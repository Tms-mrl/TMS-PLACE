import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../lib/types';
import { isSuperAdmin } from '../lib/auth';
import { getUserAgency } from '../lib/subscription';
import { forbidden, num, notFound } from '../lib/http';

// Registro de actividad (solo lectura). Lo ve el admin/manager de la inmobiliaria y el
// super-admin; un agente común no.
export const activity = new Hono<AppEnv>();

async function scope(c: Context<AppEnv>) {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  const sa = isSuperAdmin(c.env, c.var.user);
  if (!sa && (!mine || !['admin', 'manager'].includes(mine.role))) return null;
  return { agencyId: mine?.agency.id ?? null };
}

activity.get('/', async (c) => {
  const sc = await scope(c);
  if (!sc) return forbidden(c, 'Solo admin/manager');
  const limit = Math.min(Math.max(num(c.req.query('limit')) ?? 50, 1), 100);
  const before = num(c.req.query('before'));
  const entity = c.req.query('entity') || null;
  const action = c.req.query('action') || null;
  const user = num(c.req.query('user'));
  const q = (c.req.query('q') || '').trim().slice(0, 80);
  const where: string[] = ['(agency_id IS ? OR agency_id IS NULL)'];
  const binds: unknown[] = [sc.agencyId];
  if (before != null) { where.push('id < ?'); binds.push(before); }
  if (entity) { where.push('entity = ?'); binds.push(entity); }
  if (action) { where.push('action = ?'); binds.push(action); }
  if (user != null) { where.push('user_id = ?'); binds.push(user); }
  if (q) { where.push('(summary LIKE ? OR user_label LIKE ?)'); binds.push(`%${q}%`, `%${q}%`); }
  const rows = await c.env.DB
    .prepare(
      `SELECT id, created_at, user_id, user_label, method, action, entity, entity_id, summary, changes, body,
              (snapshot IS NOT NULL) AS has_snapshot
       FROM activity_log WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ?`,
    )
    .bind(...binds, limit + 1)
    .all();
  const list = rows.results as Record<string, unknown>[];
  const more = list.length > limit;
  const users = await c.env.DB
    .prepare('SELECT DISTINCT user_id, user_label FROM activity_log WHERE user_id IS NOT NULL ORDER BY user_label LIMIT 100')
    .all();
  return c.json({ items: more ? list.slice(0, limit) : list, next: more ? list[limit - 1]!.id : null, users: users.results });
});

// Copia guardada al borrar (JSON) — para reconstruir la fila a mano.
activity.get('/:id/snapshot', async (c) => {
  const sc = await scope(c);
  if (!sc) return forbidden(c, 'Solo admin/manager');
  const id = num(c.req.param('id'));
  const row = id == null ? null : await c.env.DB.prepare('SELECT snapshot FROM activity_log WHERE id = ?').bind(id).first<{ snapshot: string | null }>();
  if (!row?.snapshot) return notFound(c, 'Sin copia guardada');
  return c.json({ snapshot: JSON.parse(row.snapshot) });
});
