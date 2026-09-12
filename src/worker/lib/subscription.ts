import type { AgencyRow } from './types';

/** Días de trial por defecto para una agencia nueva (decisión de producto). */
export const TRIAL_DAYS = 30;

export type SubStatus = {
  agency_id: number;
  status: 'trial' | 'active' | 'blocked';
  trial_ends_at: string | null;
  active_until: string | null;
  /** Efectivo: 1 si el acceso a la gestión está bloqueado (por fecha o estado). */
  blocked: number;
  /** Días restantes de trial/vigencia (negativo = vencido). */
  days_left: number | null;
};

/** Crea la agencia + su membership admin + la suscripción con trial de 30 días. */
export async function createAgencyWithTrial(
  db: D1Database,
  ownerUserId: number,
  data: { name: string; legal_name?: string | null; tax_id?: string | null },
): Promise<AgencyRow> {
  const agency = await db
    .prepare(
      'INSERT INTO agencies (owner_user_id, name, legal_name, tax_id) VALUES (?, ?, ?, ?) RETURNING *',
    )
    .bind(ownerUserId, data.name, data.legal_name ?? null, data.tax_id ?? null)
    .first<AgencyRow>();
  if (!agency) throw new Error('No se pudo crear la agencia');

  await db
    .prepare("INSERT INTO agency_members (agency_id, user_id, role) VALUES (?, ?, 'admin')")
    .bind(agency.id, ownerUserId)
    .run();

  // trial_ends_at = ahora + 30 días (calculado por SQLite en UTC).
  await db
    .prepare(
      "INSERT INTO subscriptions (agency_id, status, trial_ends_at) VALUES (?, 'trial', datetime('now', ?))",
    )
    .bind(agency.id, `+${TRIAL_DAYS} days`)
    .run();

  return agency;
}

/** Estado efectivo de la suscripción de una agencia (bloqueo calculado en SQL). */
export async function getSubStatus(db: D1Database, agencyId: number): Promise<SubStatus | null> {
  return db
    .prepare(
      `SELECT agency_id, status, trial_ends_at, active_until,
              CASE
                WHEN status = 'blocked' THEN 1
                WHEN status = 'trial'  AND trial_ends_at IS NOT NULL AND datetime('now') > trial_ends_at THEN 1
                WHEN status = 'active' AND active_until  IS NOT NULL AND datetime('now') > active_until  THEN 1
                ELSE 0
              END AS blocked,
              CAST(julianday(COALESCE(active_until, trial_ends_at)) - julianday('now') AS INTEGER) AS days_left
       FROM subscriptions WHERE agency_id = ?`,
    )
    .bind(agencyId)
    .first<SubStatus>();
}

/** La (primera) agencia a la que pertenece el user, con su rol. v0: 1 agencia/user. */
export async function getUserAgency(
  db: D1Database,
  userId: number,
): Promise<{ agency: AgencyRow; role: string; branchId: number | null } | null> {
  const row = await db
    .prepare(
      `SELECT a.*, m.role AS member_role, m.branch_id AS member_branch_id
       FROM agency_members m JOIN agencies a ON a.id = m.agency_id
       WHERE m.user_id = ? ORDER BY a.id LIMIT 1`,
    )
    .bind(userId)
    .first<AgencyRow & { member_role: string; member_branch_id: number | null }>();
  if (!row) return null;
  const { member_role, member_branch_id, ...agency } = row;
  return { agency: agency as AgencyRow, role: member_role, branchId: member_branch_id };
}
