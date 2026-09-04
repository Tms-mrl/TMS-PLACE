import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, notFound, num, str } from '../lib/http';
import { getUserAgency } from '../lib/subscription';
import { clientInAgency, propertyInScope } from '../lib/ownership';

// Pipeline de operaciones (embudo): visita → oferta → reserva → firma → cerrada/perdida.
export const deals = new Hono<AppEnv>();

const STAGES = ['visita', 'oferta', 'reserva', 'firma', 'cerrada', 'perdida'];

deals.get('/', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ deals: [] });
  const res = await c.env.DB
    .prepare(
      `SELECT d.id, d.property_id, d.client_id, d.stage, d.notes, d.created_at, d.updated_at,
              p.title AS property_title, p.price AS property_price, p.currency AS property_currency,
              cl.name AS client_name, cl.phone AS client_phone
       FROM deals d
       LEFT JOIN properties p ON p.id = d.property_id AND p.agency_id = d.agency_id
       LEFT JOIN clients cl ON cl.id = d.client_id AND cl.agency_id = d.agency_id
       WHERE d.agency_id = ? ORDER BY d.updated_at DESC LIMIT 300`,
    )
    .bind(mine.agency.id)
    .all();
  return c.json({ deals: res.results });
});

deals.post('/', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const stage = STAGES.includes(String(body.stage)) ? String(body.stage) : 'visita';
  const propertyId = num(body.property_id);
  const clientId = num(body.client_id);
  if (!(await propertyInScope(c.env.DB, { agencyId: mine.agency.id, userId: c.var.user.id }, propertyId))) return bad(c, 'Propiedad inválida');
  if (!(await clientInAgency(c.env.DB, mine.agency.id, clientId))) return bad(c, 'Contacto inválido');
  const row = await c.env.DB
    .prepare('INSERT INTO deals (agency_id, property_id, client_id, agent_user_id, stage, notes) VALUES (?, ?, ?, ?, ?, ?) RETURNING *')
    .bind(mine.agency.id, propertyId, clientId, c.var.user.id, stage, str(body.notes, 2000))
    .first();
  return c.json({ deal: row }, 201);
});

deals.patch('/:id', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  if ('stage' in body) { const s = String(body.stage); if (!STAGES.includes(s)) return bad(c, 'stage inválido'); sets.push('stage = ?'); binds.push(s); }
  if ('notes' in body) { sets.push('notes = ?'); binds.push(str(body.notes, 2000)); }
  if ('property_id' in body) {
    const propertyId = num(body.property_id);
    if (!(await propertyInScope(c.env.DB, { agencyId: mine.agency.id, userId: c.var.user.id }, propertyId))) return bad(c, 'Propiedad inválida');
    sets.push('property_id = ?'); binds.push(propertyId);
  }
  if ('client_id' in body) {
    const clientId = num(body.client_id);
    if (!(await clientInAgency(c.env.DB, mine.agency.id, clientId))) return bad(c, 'Contacto inválido');
    sets.push('client_id = ?'); binds.push(clientId);
  }
  if (!sets.length) return bad(c, 'Nada para actualizar');
  sets.push("updated_at = datetime('now')");
  binds.push(id, mine.agency.id);
  const r = await c.env.DB.prepare(`UPDATE deals SET ${sets.join(', ')} WHERE id = ? AND agency_id = ?`).bind(...binds).run();
  if (!r.meta.changes) return notFound(c, 'Operación no encontrada');
  const updated = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  return c.json({ deal: updated });
});

deals.delete('/:id', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  await c.env.DB.prepare('DELETE FROM deals WHERE id = ? AND agency_id = ?').bind(id, mine.agency.id).run();
  return c.json({ success: true });
});
