import { Hono } from 'hono';
import type { AppEnv, UserRow } from '../lib/types';
import { bad, notFound, num, str } from '../lib/http';
import { createAgencyWithTrial } from '../lib/subscription';
import { genToken } from '../lib/auth';

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'inmo';
}

// Admin de Coopen (módulo D). Gateado por requireSuperAdmin en el index.
// v0: Charly cobra en persona y extiende trial / marca pago a mano (sin checkout online).
export const admin = new Hono<AppEnv>();

// Todas las agencias con su suscripción (estado efectivo) y su dueño.
admin.get('/agencies', async (c) => {
  const res = await c.env.DB
    .prepare(
      `SELECT a.id, a.name, a.created_at, u.email AS owner_email,
              s.status, s.trial_ends_at, s.active_until, s.notes,
              CASE
                WHEN s.status = 'blocked' THEN 1
                WHEN s.status = 'trial'  AND s.trial_ends_at IS NOT NULL AND datetime('now') > s.trial_ends_at THEN 1
                WHEN s.status = 'active' AND s.active_until  IS NOT NULL AND datetime('now') > s.active_until  THEN 1
                ELSE 0
              END AS blocked,
              CAST(julianday(COALESCE(s.active_until, s.trial_ends_at)) - julianday('now') AS INTEGER) AS days_left,
              (SELECT COUNT(*) FROM properties p WHERE p.agency_id = a.id) AS properties,
              (SELECT token FROM agency_access aa WHERE aa.agency_id = a.id AND aa.active = 1 ORDER BY aa.id LIMIT 1) AS access_token
       FROM agencies a
       JOIN users u ON u.id = a.owner_user_id
       LEFT JOIN subscriptions s ON s.agency_id = a.id
       ORDER BY a.created_at DESC`,
    )
    .all();
  return c.json({ agencies: res.results });
});

// Extender el trial N días (reactiva la gestión sin cobrar todavía).
admin.post('/agencies/:id/extend-trial', async (c) => {
  const id = num(c.req.param('id'));
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const days = num(body.days) ?? 30;
  if (id == null) return bad(c, 'id inválido');
  if (days <= 0 || days > 3650) return bad(c, 'days fuera de rango');
  const r = await c.env.DB
    .prepare(
      `UPDATE subscriptions SET status = 'trial', trial_ends_at = datetime('now', ?),
              notes = ?, updated_at = datetime('now') WHERE agency_id = ?`,
    )
    .bind(`+${days} days`, `trial +${days}d por admin`, id)
    .run();
  if (!r.meta.changes) return notFound(c, 'Agencia sin suscripción');
  return c.json({ ok: true, status: 'trial', days });
});

// Marcar como paga N meses (cobro en persona → activa la gestión).
admin.post('/agencies/:id/mark-paid', async (c) => {
  const id = num(c.req.param('id'));
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const months = num(body.months) ?? 1;
  if (id == null) return bad(c, 'id inválido');
  if (months <= 0 || months > 120) return bad(c, 'months fuera de rango');
  const r = await c.env.DB
    .prepare(
      `UPDATE subscriptions SET status = 'active', active_until = datetime('now', ?),
              notes = ?, updated_at = datetime('now') WHERE agency_id = ?`,
    )
    .bind(`+${months} months`, `pago en persona ${months}m`, id)
    .run();
  if (!r.meta.changes) return notFound(c, 'Agencia sin suscripción');
  return c.json({ ok: true, status: 'active', months });
});

// Bloquear manualmente.
admin.post('/agencies/:id/block', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const r = await c.env.DB
    .prepare("UPDATE subscriptions SET status = 'blocked', updated_at = datetime('now') WHERE agency_id = ?")
    .bind(id)
    .run();
  if (!r.meta.changes) return notFound(c, 'Agencia sin suscripción');
  return c.json({ ok: true, status: 'blocked' });
});

// Crear una inmobiliaria nueva + su usuario sintético + link de acceso único.
admin.post('/agencies', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(body.name, 120);
  if (!name) return bad(c, 'Falta el nombre de la inmobiliaria');
  const sub = 'local:' + crypto.randomUUID();
  const email = `${slugify(name)}.${genToken().slice(0, 6)}@places.local`;
  const user = await c.env.DB
    .prepare('INSERT INTO users (auth_sub, email, name) VALUES (?, ?, ?) RETURNING *')
    .bind(sub, email, name)
    .first<UserRow>();
  if (!user) return bad(c, 'No se pudo crear el usuario de la inmobiliaria');
  await c.env.DB.prepare('INSERT OR IGNORE INTO places_profiles (user_id, is_owner, onboarded) VALUES (?, 1, 1)').bind(user.id).run();
  const agency = await createAgencyWithTrial(c.env.DB, user.id, { name });
  const token = genToken();
  await c.env.DB
    .prepare('INSERT INTO agency_access (agency_id, user_id, token, label) VALUES (?, ?, ?, ?)')
    .bind(agency.id, user.id, token, `Acceso ${name}`)
    .run();
  return c.json({ agency, accessUrl: `${new URL(c.req.url).origin}/i/${token}` }, 201);
});

// ── Cuentas de usuario de la inmobiliaria ─────────────────────────────────────
//
// "Admin de El Muelle" = fila en agency_members con role='admin': manda adentro de ESA
// inmobiliaria y de ninguna otra. NO se toca el super-admin de Coopen, que es la
// allowlist SUPER_ADMIN_SUBS (una var, no una tabla) — desde acá no se puede escalar a eso.
//
// La lista trae TODAS las cuentas de este deploy, no solo el equipo: el caso real es que
// alguien entró con su Google, quedó sin panel (es un `users` suelto sin membresía) y hay
// que darle acceso. Sin esto había que tocar la base a mano.
const ROLES = ['admin', 'manager', 'agent'];

admin.get('/agencies/:id/users', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const ag = await c.env.DB.prepare('SELECT owner_user_id FROM agencies WHERE id = ?').bind(id).first<{ owner_user_id: number }>();
  if (!ag) return notFound(c, 'Agencia no encontrada');
  const res = await c.env.DB
    .prepare(
      `SELECT u.id, u.email, u.name, u.auth_sub, u.created_at, m.role, b.name AS branch_name,
              (SELECT GROUP_CONCAT(a2.name, ', ')
                 FROM agency_members m2 JOIN agencies a2 ON a2.id = m2.agency_id
                WHERE m2.user_id = u.id AND m2.agency_id <> ?) AS other_agencies
         FROM users u
         LEFT JOIN agency_members m ON m.user_id = u.id AND m.agency_id = ?
         LEFT JOIN branches b ON b.id = m.branch_id
        ORDER BY (m.role IS NULL), u.id`,
    )
    .bind(id, id)
    .all();
  return c.json({ users: res.results, ownerUserId: ag.owner_user_id });
});

// Dar/cambiar rol dentro de la inmobiliaria (upsert: sirve para sumar y para promover).
admin.post('/agencies/:id/members', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const userId = num(body.user_id);
  const role = ROLES.includes(String(body.role)) ? String(body.role) : null;
  if (userId == null) return bad(c, 'user_id inválido');
  if (!role) return bad(c, 'rol inválido');
  const ag = await c.env.DB.prepare('SELECT id FROM agencies WHERE id = ?').bind(id).first<{ id: number }>();
  if (!ag) return notFound(c, 'Agencia no encontrada');
  const u = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first<{ id: number }>();
  if (!u) return notFound(c, 'Usuario no encontrado');
  await c.env.DB
    .prepare(
      `INSERT INTO agency_members (agency_id, user_id, role) VALUES (?, ?, ?)
       ON CONFLICT (agency_id, user_id) DO UPDATE SET role = excluded.role`,
    )
    .bind(id, userId, role)
    .run();
  return c.json({ ok: true, role });
});

// Sacar a alguien del equipo (y apagarle el link de acceso de esa agencia).
admin.delete('/agencies/:id/members/:userId', async (c) => {
  const id = num(c.req.param('id'));
  const userId = num(c.req.param('userId'));
  if (id == null || userId == null) return bad(c, 'id inválido');
  const ag = await c.env.DB.prepare('SELECT owner_user_id FROM agencies WHERE id = ?').bind(id).first<{ owner_user_id: number }>();
  if (!ag) return notFound(c, 'Agencia no encontrada');
  // El dueño es la raíz de la agencia (createAgencyWithTrial lo deja como admin): sin él
  // la inmobiliaria queda sin nadie que la administre.
  if (userId === ag.owner_user_id) return bad(c, 'No podés quitar al dueño de la inmobiliaria');
  const r = await c.env.DB.prepare('DELETE FROM agency_members WHERE agency_id = ? AND user_id = ?').bind(id, userId).run();
  if (!r.meta.changes) return notFound(c, 'Esa cuenta no es parte del equipo');
  await c.env.DB.prepare('UPDATE agency_access SET active = 0 WHERE user_id = ? AND agency_id = ?').bind(userId, id).run();
  return c.json({ ok: true });
});

// Regenerar el link de acceso (revoca el anterior).
admin.post('/agencies/:id/regenerate-access', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const token = genToken();
  const acc = await c.env.DB.prepare('SELECT id FROM agency_access WHERE agency_id = ? ORDER BY id LIMIT 1').bind(id).first<{ id: number }>();
  if (acc) {
    await c.env.DB.prepare('UPDATE agency_access SET token = ?, active = 1 WHERE id = ?').bind(token, acc.id).run();
  } else {
    const ag = await c.env.DB.prepare('SELECT owner_user_id FROM agencies WHERE id = ?').bind(id).first<{ owner_user_id: number }>();
    if (!ag) return notFound(c, 'Agencia no encontrada');
    await c.env.DB.prepare('INSERT INTO agency_access (agency_id, user_id, token, label) VALUES (?, ?, ?, ?)').bind(id, ag.owner_user_id, token, 'Acceso').run();
  }
  return c.json({ accessUrl: `${new URL(c.req.url).origin}/i/${token}` });
});
