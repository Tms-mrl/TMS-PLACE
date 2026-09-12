import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, forbidden, num, str } from '../lib/http';
import { getSubStatus, getUserAgency } from '../lib/subscription';
import { genToken } from '../lib/auth';
import { branchInAgency } from '../lib/ownership';
import { COMPUTED_STATUS_SQL } from '../lib/propertyStatus';

// Gestión de la inmobiliaria (módulo A). v0: 1 agencia por user.
export const agencies = new Hono<AppEnv>();

// Mi agencia + estado de suscripción (trial/activa/bloqueada) + sucursales.
agencies.get('/mine', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ agency: null });
  const sub = await getSubStatus(c.env.DB, mine.agency.id);
  const branches = await c.env.DB
    .prepare('SELECT id, name, address, phone FROM branches WHERE agency_id = ? ORDER BY id')
    .bind(mine.agency.id)
    .all();
  return c.json({ agency: mine.agency, role: mine.role, subscription: sub, branches: branches.results });
});

// Autoservicio: cada usuario elige SU PROPIA sucursal (no hace falta ser admin/manager
// — a diferencia de PATCH /members/:userId, que es como un admin asigna sucursal a
// terceros). Cada persona entra con su propia cuenta de Google, así que esto queda
// guardado por usuario, no por dispositivo/sesión. Pensado para reemplazar el chip de
// suscripción en el header del panel por un selector rápido de "en qué sucursal estoy".
agencies.patch('/mine/branch', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const branchId = num(body.branch_id);
  if (!(await branchInAgency(c.env.DB, mine.agency.id, branchId))) return bad(c, 'Sucursal inválida');
  await c.env.DB
    .prepare('UPDATE agency_members SET branch_id = ? WHERE agency_id = ? AND user_id = ?')
    .bind(branchId, mine.agency.id, c.var.user.id)
    .run();
  return c.json({ branchId });
});

// Resumen para el dashboard (KPIs): propiedades por estado/operación/sucursal + clientes.
agencies.get('/summary', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ agency: null });
  const aid = mine.agency.id;
  const [byStatus, byOperation, byBranch, clientsByKind, totals] = await Promise.all([
    c.env.DB
      // GROUP BY 1 (posición), no "GROUP BY status": la tabla ya tiene una columna real
      // "status" y SQLite resuelve el nombre contra esa en vez del alias calculado,
      // agrupando por el valor crudo y duplicando buckets (ej. dos filas "alquilada").
      .prepare(`SELECT ${COMPUTED_STATUS_SQL} AS status, COUNT(*) AS n FROM properties p WHERE p.agency_id = ? AND p.archived_at IS NULL GROUP BY 1`)
      .bind(aid)
      .all(),
    c.env.DB.prepare('SELECT operation, COUNT(*) AS n FROM properties WHERE agency_id = ? AND archived_at IS NULL GROUP BY operation').bind(aid).all(),
    c.env.DB
      .prepare(
        `SELECT b.id, b.name,
                COUNT(p.id) AS n,
                COALESCE(SUM(CASE WHEN (${COMPUTED_STATUS_SQL}) = 'disponible' THEN 1 ELSE 0 END), 0) AS disponibles
         FROM branches b
         LEFT JOIN properties p ON p.branch_id = b.id AND p.agency_id = ? AND p.archived_at IS NULL
         WHERE b.agency_id = ? GROUP BY b.id ORDER BY b.id`,
      )
      .bind(aid, aid)
      .all(),
    c.env.DB.prepare('SELECT kind, COUNT(*) AS n FROM clients WHERE agency_id = ? GROUP BY kind').bind(aid).all(),
    c.env.DB.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(published), 0) AS publicadas FROM properties WHERE agency_id = ? AND archived_at IS NULL').bind(aid).first(),
  ]);
  return c.json({
    agency: mine.agency,
    role: mine.role,
    totals,
    byStatus: byStatus.results,
    byOperation: byOperation.results,
    byBranch: byBranch.results,
    clientsByKind: clientsByKind.results,
  });
});

// Configurar la inmobiliaria (WhatsApp de consultas, nombre). Solo admin/manager.
agencies.patch('/', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  if (!['admin', 'manager'].includes(mine.role)) return forbidden(c, 'Solo admin/manager');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  if ('whatsapp' in body) { sets.push('whatsapp = ?'); binds.push(str(body.whatsapp, 30)); }
  if ('name' in body) { const n = str(body.name, 120); if (!n) return bad(c, 'name vacío'); sets.push('name = ?'); binds.push(n); }
  if (!sets.length) return bad(c, 'Nada para actualizar');
  binds.push(mine.agency.id);
  await c.env.DB.prepare(`UPDATE agencies SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
  const updated = await c.env.DB.prepare('SELECT * FROM agencies WHERE id = ?').bind(mine.agency.id).first();
  return c.json({ agency: updated });
});

// Consultas recibidas (por WhatsApp o web) sobre las propiedades de la agencia.
agencies.get('/inquiries', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ inquiries: [] });
  const res = await c.env.DB
    .prepare(
      `SELECT i.id, i.property_id, p.title AS property_title, i.name, i.phone, i.message, i.source, i.status, i.created_at
       FROM inquiries i JOIN properties p ON p.id = i.property_id
       WHERE p.agency_id = ? ORDER BY i.created_at DESC LIMIT 100`,
    )
    .bind(mine.agency.id)
    .all();
  return c.json({ inquiries: res.results });
});

// No hay autoservicio de alta de inmobiliaria — se crea a mano en la base (o con
// createAgencyWithTrial en lib/subscription.ts) cuando hace falta. El panel "Admin de
// Coopen" que hacía esto por UI se sacó (2026-09-11): con un solo tenant no servía.

// Alta de sucursal (solo admin/manager de la agencia).
agencies.post('/branches', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  if (!['admin', 'manager'].includes(mine.role)) return forbidden(c, 'Solo admin/manager');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(body.name, 120);
  if (!name) return bad(c, 'Falta el nombre de la sucursal');
  const branch = await c.env.DB
    .prepare('INSERT INTO branches (agency_id, name, address, phone) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(mine.agency.id, name, str(body.address, 200), str(body.phone, 40))
    .first();
  return c.json({ branch }, 201);
});

// ── Equipo: agentes por sucursal (invitar con link de acceso, rol, sucursal) ──

agencies.get('/members', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ members: [], role: null });
  const res = await c.env.DB
    .prepare(
      `SELECT m.id AS member_id, m.role, m.branch_id, b.name AS branch_name,
              u.id AS user_id, u.name, u.email,
              (SELECT token FROM agency_access aa WHERE aa.user_id = u.id AND aa.active = 1 ORDER BY aa.id LIMIT 1) AS access_token
       FROM agency_members m JOIN users u ON u.id = m.user_id
       LEFT JOIN branches b ON b.id = m.branch_id
       WHERE m.agency_id = ? ORDER BY m.id`,
    )
    .bind(mine.agency.id)
    .all();
  return c.json({ members: res.results, role: mine.role, ownerUserId: mine.agency.owner_user_id });
});

/**
 * Invitar a alguien al equipo. Dos modos:
 *
 *  · CON email  → queda invitado por su **cuenta del ecosistema**. Se crea la fila con
 *    `auth_sub = 'invite:<email>'` y, la primera vez que entra por SSO, `resolveCoopenUser`
 *    ADOPTA esa fila (ver lib/auth) — o sea, entra con su Google de siempre y ya tiene el
 *    panel de la inmobiliaria. Es el camino para sumar a un dueño/socio que ya tiene cuenta.
 *  · SIN email → agente sin cuenta: usuario sintético + **link de acceso** (lo de antes).
 *
 * Sin el modo email, sumar a una cuenta existente exigía tocar la base a mano.
 */
agencies.post('/members', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  if (mine.role !== 'admin') return forbidden(c, 'Solo el admin puede sumar agentes');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(body.name, 120);
  if (!name) return bad(c, 'Falta el nombre del agente');
  const role = ['admin', 'manager', 'agent'].includes(String(body.role)) ? String(body.role) : 'agent';
  const branchId = num(body.branch_id);

  // ── Modo email: invitación a una cuenta del ecosistema ──────────────────────
  const invitedEmail = str(body.email, 160)?.trim().toLowerCase();
  if (invitedEmail) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invitedEmail)) return bad(c, 'Email inválido');
    // ¿Ya existe ese email acá? (entró antes por SSO, o ya fue invitado.)
    const existing = await c.env.DB
      .prepare('SELECT id FROM users WHERE lower(email) = ?')
      .bind(invitedEmail)
      .first<{ id: number }>();
    let userId = existing?.id;
    if (!userId) {
      const created = await c.env.DB
        .prepare('INSERT INTO users (auth_sub, email, name) VALUES (?, ?, ?) RETURNING id')
        .bind(`invite:${invitedEmail}`, invitedEmail, name)
        .first<{ id: number }>();
      if (!created) return bad(c, 'No se pudo crear la invitación');
      userId = created.id;
    }
    await c.env.DB.prepare('INSERT OR IGNORE INTO places_profiles (user_id, onboarded) VALUES (?, 1)').bind(userId).run();
    const r = await c.env.DB
      .prepare('INSERT OR IGNORE INTO agency_members (agency_id, user_id, role, branch_id) VALUES (?, ?, ?, ?)')
      .bind(mine.agency.id, userId, role, branchId)
      .run();
    if (!r.meta.changes) return bad(c, 'Esa persona ya es parte del equipo');
    return c.json({ invitedEmail, role }, 201);
  }

  // ── Modo link de acceso: agente sin cuenta ─────────────────────────────────
  const sub = 'local:' + crypto.randomUUID();
  const email = `agente.${genToken().slice(0, 6)}@places.local`;
  const user = await c.env.DB
    .prepare('INSERT INTO users (auth_sub, email, name) VALUES (?, ?, ?) RETURNING *')
    .bind(sub, email, name)
    .first<{ id: number }>();
  if (!user) return bad(c, 'No se pudo crear el agente');
  await c.env.DB.prepare('INSERT OR IGNORE INTO places_profiles (user_id, onboarded) VALUES (?, 1)').bind(user.id).run();
  await c.env.DB.prepare('INSERT INTO agency_members (agency_id, user_id, role, branch_id) VALUES (?, ?, ?, ?)').bind(mine.agency.id, user.id, role, branchId).run();
  const token = genToken();
  await c.env.DB.prepare('INSERT INTO agency_access (agency_id, user_id, token, label) VALUES (?, ?, ?, ?)').bind(mine.agency.id, user.id, token, `Agente ${name}`).run();
  return c.json({ accessUrl: `${new URL(c.req.url).origin}/i/${token}` }, 201);
});

agencies.patch('/members/:userId', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine || mine.role !== 'admin') return forbidden(c, 'Solo el admin');
  const uid = num(c.req.param('userId'));
  if (uid == null) return bad(c, 'id inválido');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  if ('role' in body) { const r = ['admin', 'manager', 'agent'].includes(String(body.role)) ? String(body.role) : 'agent'; sets.push('role = ?'); binds.push(r); }
  if ('branch_id' in body) { sets.push('branch_id = ?'); binds.push(num(body.branch_id)); }
  if (!sets.length) return bad(c, 'Nada para actualizar');
  binds.push(mine.agency.id, uid);
  await c.env.DB.prepare(`UPDATE agency_members SET ${sets.join(', ')} WHERE agency_id = ? AND user_id = ?`).bind(...binds).run();
  return c.json({ ok: true });
});

agencies.delete('/members/:userId', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine || mine.role !== 'admin') return forbidden(c, 'Solo el admin');
  const uid = num(c.req.param('userId'));
  if (uid == null) return bad(c, 'id inválido');
  if (uid === mine.agency.owner_user_id) return bad(c, 'No podés quitar al dueño de la inmobiliaria');
  await c.env.DB.prepare('DELETE FROM agency_members WHERE agency_id = ? AND user_id = ?').bind(mine.agency.id, uid).run();
  await c.env.DB.prepare('UPDATE agency_access SET active = 0 WHERE user_id = ? AND agency_id = ?').bind(uid, mine.agency.id).run();
  return c.json({ success: true });
});
