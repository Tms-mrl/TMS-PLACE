import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, notFound, num, str } from '../lib/http';
import { getUserAgency } from '../lib/subscription';
import { clientInAgency, propertyInScope } from '../lib/ownership';

// Contratos y recibos (módulos A y B). Un contrato pertenece al "contexto" del user:
// su inmobiliaria (agency_id) o, si no tiene, a él como propietario particular.
export const contracts = new Hono<AppEnv>();

const OPS = ['alquiler', 'venta'];
const STATUSES = ['activo', 'vencido', 'rescindido', 'finalizado'];

// Ámbito del user: agencia (si pertenece a una) o propietario particular.
// `prefix` prefija las columnas (ej 'ct') para desambiguar en queries con JOIN.
async function scope(c: any, prefix = ''): Promise<{ where: string; bind: unknown[]; agencyId: number | null }> {
  const p = prefix ? `${prefix}.` : '';
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (mine) return { where: `${p}agency_id = ?`, bind: [mine.agency.id], agencyId: mine.agency.id };
  return { where: `${p}owner_kind = 'particular' AND ${p}owner_user_id = ?`, bind: [c.var.user.id], agencyId: null };
}

contracts.get('/', async (c) => {
  const s = await scope(c, 'ct');
  const res = await c.env.DB
    .prepare(
      `SELECT ct.*, p.title AS property_title,
              COALESCE(cl.name, ct.tenant_name) AS client_name,
              COALESCE(cl.phone, ct.tenant_phone) AS client_phone,
              (SELECT COALESCE(SUM(amount), 0) FROM receipts r WHERE r.contract_id = ct.id AND r.paid_at IS NOT NULL) AS paid_total,
              (SELECT COUNT(*) FROM receipts r WHERE r.contract_id = ct.id) AS receipts_count
       FROM contracts ct
       LEFT JOIN properties p ON p.id = ct.property_id AND (
         (ct.owner_kind = 'agency'     AND p.agency_id = ct.agency_id) OR
         (ct.owner_kind = 'particular' AND p.owner_kind = 'particular' AND p.owner_user_id = ct.owner_user_id)
       )
       LEFT JOIN clients cl ON cl.id = ct.client_id AND cl.agency_id = ct.agency_id
       WHERE ${s.where} ORDER BY ct.status = 'activo' DESC, ct.end_date ASC LIMIT 300`,
    )
    .bind(...s.bind)
    .all();
  return c.json({ contracts: res.results });
});

contracts.post('/', async (c) => {
  const s = await scope(c);
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const op = OPS.includes(String(b.operation)) ? String(b.operation) : 'alquiler';
  const propertyId = num(b.property_id);
  const clientId = s.agencyId ? num(b.client_id) : null;
  if (!(await propertyInScope(c.env.DB, { agencyId: s.agencyId, userId: c.var.user.id }, propertyId))) return bad(c, 'Propiedad inválida');
  if (!(await clientInAgency(c.env.DB, s.agencyId, clientId))) return bad(c, 'Contacto inválido');
  const row = await c.env.DB
    .prepare(
      `INSERT INTO contracts
         (owner_kind, agency_id, owner_user_id, property_id, client_id, tenant_name, tenant_phone,
          operation, amount, currency, deposit, start_date, end_date, adjust_months, adjust_index, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?) RETURNING *`,
    )
    .bind(
      s.agencyId ? 'agency' : 'particular',
      s.agencyId,
      s.agencyId ? null : c.var.user.id,
      propertyId,
      clientId,
      str(b.tenant_name, 120),
      str(b.tenant_phone, 30),
      op,
      num(b.amount),
      str(b.currency, 8) || 'ARS',
      num(b.deposit),
      str(b.start_date, 10),
      str(b.end_date, 10),
      num(b.adjust_months),
      str(b.adjust_index, 40),
      str(b.notes, 2000),
    )
    .first();
  return c.json({ contract: row }, 201);
});

contracts.patch('/:id', async (c) => {
  const s = await scope(c);
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  const setStr = (k: string, v: string | null) => { sets.push(`${k} = ?`); binds.push(v); };
  const setNum = (k: string, v: number | null) => { sets.push(`${k} = ?`); binds.push(v); };
  if ('operation' in b) { const v = String(b.operation); if (!OPS.includes(v)) return bad(c, 'operación inválida'); setStr('operation', v); }
  if ('status' in b) { const v = String(b.status); if (!STATUSES.includes(v)) return bad(c, 'estado inválido'); setStr('status', v); }
  if ('amount' in b) setNum('amount', num(b.amount));
  if ('currency' in b) setStr('currency', str(b.currency, 8) || 'ARS');
  if ('deposit' in b) setNum('deposit', num(b.deposit));
  if ('start_date' in b) setStr('start_date', str(b.start_date, 10));
  if ('end_date' in b) setStr('end_date', str(b.end_date, 10));
  if ('adjust_months' in b) setNum('adjust_months', num(b.adjust_months));
  if ('adjust_index' in b) setStr('adjust_index', str(b.adjust_index, 40));
  if ('tenant_name' in b) setStr('tenant_name', str(b.tenant_name, 120));
  if ('tenant_phone' in b) setStr('tenant_phone', str(b.tenant_phone, 30));
  if ('client_id' in b) {
    const clientId = num(b.client_id);
    if (!(await clientInAgency(c.env.DB, s.agencyId, clientId))) return bad(c, 'Contacto inválido');
    setNum('client_id', clientId);
  }
  if ('property_id' in b) {
    const propertyId = num(b.property_id);
    if (!(await propertyInScope(c.env.DB, { agencyId: s.agencyId, userId: c.var.user.id }, propertyId))) return bad(c, 'Propiedad inválida');
    setNum('property_id', propertyId);
  }
  if ('notes' in b) setStr('notes', str(b.notes, 2000));
  if (!sets.length) return bad(c, 'Nada para actualizar');
  sets.push("updated_at = datetime('now')");
  const r = await c.env.DB
    .prepare(`UPDATE contracts SET ${sets.join(', ')} WHERE id = ? AND ${s.where}`)
    .bind(...binds, id, ...s.bind)
    .run();
  if (!r.meta.changes) return notFound(c, 'Contrato no encontrado');
  const updated = await c.env.DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
  return c.json({ contract: updated });
});

contracts.delete('/:id', async (c) => {
  const s = await scope(c);
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  await c.env.DB.prepare(`DELETE FROM contracts WHERE id = ? AND ${s.where}`).bind(id, ...s.bind).run();
  return c.json({ success: true });
});

// ── Recibos de un contrato ──
async function ownsContract(c: any, contractId: number): Promise<boolean> {
  const s = await scope(c);
  const row = await c.env.DB.prepare(`SELECT id FROM contracts WHERE id = ? AND ${s.where}`).bind(contractId, ...s.bind).first();
  return !!row;
}

contracts.get('/:id/receipts', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null || !(await ownsContract(c, id))) return notFound(c, 'Contrato no encontrado');
  const res = await c.env.DB.prepare('SELECT * FROM receipts WHERE contract_id = ? ORDER BY period DESC, id DESC').bind(id).all();
  return c.json({ receipts: res.results });
});

contracts.post('/:id/receipts', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null || !(await ownsContract(c, id))) return notFound(c, 'Contrato no encontrado');
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const amount = num(b.amount);
  if (amount == null) return bad(c, 'Falta el monto');
  const row = await c.env.DB
    .prepare(
      `INSERT INTO receipts (contract_id, period, amount, currency, paid_at, method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .bind(id, str(b.period, 20), amount, str(b.currency, 8) || 'ARS', str(b.paid_at, 20), str(b.method, 40), str(b.notes, 500))
    .first();
  return c.json({ receipt: row }, 201);
});

contracts.delete('/receipts/:rid', async (c) => {
  const rid = num(c.req.param('rid'));
  if (rid == null) return bad(c, 'id inválido');
  const rc = await c.env.DB.prepare('SELECT contract_id FROM receipts WHERE id = ?').bind(rid).first<{ contract_id: number }>();
  if (!rc || !(await ownsContract(c, rc.contract_id))) return notFound(c, 'Recibo no encontrado');
  await c.env.DB.prepare('DELETE FROM receipts WHERE id = ?').bind(rid).run();
  return c.json({ success: true });
});
