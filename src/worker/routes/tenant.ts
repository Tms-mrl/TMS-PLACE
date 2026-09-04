import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, num } from '../lib/http';

// Lado inquilino/turista: favoritos + búsquedas guardadas (con alerta por email).
// Marcamos is_tenant=1 en el perfil la primera vez que guarda algo.

const CARD = `p.id, p.title, p.operation, p.price, p.currency, p.city, p.price_period,
  (SELECT r2_key FROM property_media pm WHERE pm.property_id = p.id ORDER BY pm.sort LIMIT 1) AS cover_key`;

async function markTenant(db: D1Database, userId: number) {
  await db
    .prepare(
      `INSERT INTO places_profiles (user_id, is_tenant, updated_at) VALUES (?, 1, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET is_tenant = 1, updated_at = datetime('now')`,
    )
    .bind(userId)
    .run();
}

// ── Favoritos ──
export const favorites = new Hono<AppEnv>();

favorites.get('/', async (c) => {
  const res = await c.env.DB
    .prepare(
      `SELECT ${CARD}, f.created_at AS saved_at FROM favorites f JOIN properties p ON p.id = f.property_id
       WHERE f.user_id = ? ORDER BY f.created_at DESC`,
    )
    .bind(c.var.user.id)
    .all();
  return c.json({ favorites: res.results });
});

// Solo los ids (para pintar el estado del corazón en el marketplace SSR).
favorites.get('/ids', async (c) => {
  const res = await c.env.DB.prepare('SELECT property_id FROM favorites WHERE user_id = ?').bind(c.var.user.id).all<{ property_id: number }>();
  return c.json({ ids: res.results.map((r) => r.property_id) });
});

favorites.post('/', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const pid = num(b.property_id);
  if (pid == null) return bad(c, 'Falta la propiedad');
  await c.env.DB.prepare('INSERT OR IGNORE INTO favorites (user_id, property_id) VALUES (?, ?)').bind(c.var.user.id, pid).run();
  await markTenant(c.env.DB, c.var.user.id);
  return c.json({ saved: true });
});

favorites.delete('/:pid', async (c) => {
  const pid = num(c.req.param('pid'));
  if (pid == null) return bad(c, 'id inválido');
  await c.env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND property_id = ?').bind(c.var.user.id, pid).run();
  return c.json({ saved: false });
});

// ── Búsquedas guardadas ──
export const savedSearches = new Hono<AppEnv>();

savedSearches.get('/', async (c) => {
  const res = await c.env.DB
    .prepare('SELECT id, query_json, notify, last_notified_at, created_at FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC')
    .bind(c.var.user.id)
    .all();
  return c.json({ searches: res.results });
});

savedSearches.post('/', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  // Aceptamos el objeto de filtros directamente o dentro de query_json.
  const q = (b.query_json ?? b.query ?? b) as Record<string, unknown>;
  const clean = {
    op: typeof q.op === 'string' ? q.op : null,
    ciudad: typeof q.ciudad === 'string' ? q.ciudad.slice(0, 80) : null,
    min: num(q.min),
    max: num(q.max),
    amb: num(q.amb),
  };
  const notify = b.notify === false ? 0 : 1;
  const row = await c.env.DB
    .prepare('INSERT INTO saved_searches (user_id, query_json, notify) VALUES (?, ?, ?) RETURNING id, query_json, notify, last_notified_at, created_at')
    .bind(c.var.user.id, JSON.stringify(clean), notify)
    .first();
  await markTenant(c.env.DB, c.var.user.id);
  return c.json({ search: row }, 201);
});

savedSearches.patch('/:id', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const notify = b.notify ? 1 : 0;
  await c.env.DB.prepare('UPDATE saved_searches SET notify = ? WHERE id = ? AND user_id = ?').bind(notify, id, c.var.user.id).run();
  return c.json({ notify: !!notify });
});

savedSearches.delete('/:id', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  await c.env.DB.prepare('DELETE FROM saved_searches WHERE id = ? AND user_id = ?').bind(id, c.var.user.id).run();
  return c.json({ success: true });
});
