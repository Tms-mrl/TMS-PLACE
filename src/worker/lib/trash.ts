import type { Env } from './types';

// Papelera de propiedades (ver migración 0031). Borrar = guardar una copia completa y recién
// a los 40 días eliminar de verdad; restaurar = volver a insertar todo con los mismos ids.

/** Tablas que dependen de la propiedad y se borran en cascada con ella. */
const CASCADE = ['property_media', 'bookings', 'property_season_prices', 'mandates', 'inquiries', 'favorites', 'property_views'] as const;
/** Tablas que solo pierden el vínculo (ON DELETE SET NULL): se guardan los ids para re-vincular. */
const LINKED = ['deals', 'contracts', 'expenses'] as const;

type Snapshot = {
  property: Record<string, unknown>;
  children: Record<string, Record<string, unknown>[]>;
  linked: Record<string, number[]>;
};

const IDENT = /^[a-z_][a-z0-9_]*$/i;
const MAX_BYTES = 1_500_000; // D1 limita la fila a 2 MB

/** Copia lo necesario para reconstruir la propiedad y la inserta en la papelera ANTES de borrarla. */
export async function moveToTrash(env: Env, prop: Record<string, unknown>, user: { id: number; label: string }): Promise<void> {
  const id = prop.id as number;
  const children: Snapshot['children'] = {};
  for (const t of CASCADE) {
    children[t] = (await env.DB.prepare(`SELECT * FROM ${t} WHERE property_id = ?`).bind(id).all()).results as Record<string, unknown>[];
  }
  const linked: Snapshot['linked'] = {};
  for (const t of LINKED) {
    linked[t] = ((await env.DB.prepare(`SELECT id FROM ${t} WHERE property_id = ?`).bind(id).all()).results as { id: number }[]).map((r) => r.id);
  }
  let data = JSON.stringify({ property: prop, children, linked } satisfies Snapshot);
  if (data.length > MAX_BYTES) { // las visitas son lo único prescindible
    children.property_views = [];
    data = JSON.stringify({ property: prop, children, linked } satisfies Snapshot);
  }
  await env.DB.batch([
    env.DB
      .prepare(
        `INSERT INTO trash_properties (property_id, agency_id, title, code, deleted_by_user_id, deleted_by, bookings_n, prices_n, photos_n, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, prop.agency_id ?? null, String(prop.title ?? ''), prop.code ?? null, user.id, user.label,
        children.bookings!.length, children.property_season_prices!.length, children.property_media!.length, data),
    env.DB.prepare('DELETE FROM properties WHERE id = ?').bind(id),
  ]);
}

/** Vuelve a insertar la propiedad y todo lo suyo. Devuelve un error legible si no se puede. */
export async function restoreFromTrash(env: Env, trashId: number): Promise<{ ok: true; propertyId: number } | { ok: false; error: string }> {
  const row = await env.DB.prepare('SELECT property_id, data FROM trash_properties WHERE id = ?').bind(trashId).first<{ property_id: number; data: string }>();
  if (!row) return { ok: false, error: 'No está en la papelera' };
  const snap = JSON.parse(row.data) as Snapshot;
  const p = snap.property;

  if (await env.DB.prepare('SELECT 1 FROM properties WHERE id = ?').bind(row.property_id).first()) {
    return { ok: false, error: 'Ya existe una propiedad con ese número' };
  }
  if (p.external_url) {
    const dup = await env.DB.prepare('SELECT id, title FROM properties WHERE external_url = ?').bind(p.external_url).first<{ id: number; title: string }>();
    if (dup) return { ok: false, error: `Ya hay otra propiedad con el mismo link del aviso (#${dup.id} «${dup.title}»). Borrala o cambiale el link antes de restaurar.` };
  }

  const stmts: D1PreparedStatement[] = [];
  const insertJson = (table: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]!);
    if (!IDENT.test(table) || !cols.every((c) => IDENT.test(c))) throw new Error('copia inválida');
    const sel = cols.map((c) => `json_extract(value, '$.${c}')`).join(', ');
    stmts.push(env.DB.prepare(`INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) SELECT ${sel} FROM json_each(?)`).bind(JSON.stringify(rows)));
  };
  insertJson('properties', [p]);
  for (const t of CASCADE) insertJson(t, snap.children[t] ?? []);
  // Deals/contratos/gastos que quedaron sin propiedad al borrarla: se vuelven a vincular
  // (solo si siguen sin vínculo, para no pisar algo que alguien ya reasignó).
  for (const t of LINKED) {
    const ids = snap.linked[t] ?? [];
    if (ids.length) stmts.push(env.DB.prepare(`UPDATE ${t} SET property_id = ? WHERE property_id IS NULL AND id IN (SELECT value FROM json_each(?))`).bind(row.property_id, JSON.stringify(ids)));
  }
  stmts.push(env.DB.prepare('DELETE FROM trash_properties WHERE id = ?').bind(trashId));
  await env.DB.batch(stmts);
  return { ok: true, propertyId: row.property_id };
}

/** Elimina de verdad una entrada de la papelera y las fotos de R2 que ya nadie usa. */
export async function purgeTrashEntry(env: Env, trashId: number): Promise<void> {
  const row = await env.DB.prepare('SELECT data FROM trash_properties WHERE id = ?').bind(trashId).first<{ data: string }>();
  if (!row) return;
  const keys = ((JSON.parse(row.data) as Snapshot).children.property_media ?? []).map((m) => String(m.r2_key)).filter(Boolean);
  await env.DB.prepare('DELETE FROM trash_properties WHERE id = ?').bind(trashId).run();
  for (const key of new Set(keys)) {
    // Las copias de una propiedad comparten la foto: solo se borra si nadie más la referencia.
    const used = await env.DB.prepare('SELECT 1 FROM property_media WHERE r2_key = ? LIMIT 1').bind(key).first();
    const inTrash = await env.DB.prepare('SELECT 1 FROM trash_properties WHERE data LIKE ? LIMIT 1').bind(`%"${key}"%`).first();
    if (!used && !inTrash) await env.MEDIA.delete(key).catch(() => {});
  }
}

/** Vacía lo que ya pasó los 40 días. Lo corre el cron diario (y se puede llamar a mano). */
export async function purgeExpiredTrash(env: Env): Promise<number> {
  const due = (await env.DB.prepare("SELECT id FROM trash_properties WHERE purge_at <= datetime('now') LIMIT 50").all<{ id: number }>()).results;
  for (const r of due) await purgeTrashEntry(env, r.id);
  return due.length;
}
