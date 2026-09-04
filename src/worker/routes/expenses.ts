import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, notFound, num, str } from '../lib/http';
import { getUserAgency } from '../lib/subscription';
import { propertyInScope } from '../lib/ownership';

// Gastos por propiedad (módulos A y B): reparaciones, limpieza, impuestos, servicios…
// Un gasto pertenece al "contexto" del user: su inmobiliaria (agency_id) o, si no tiene,
// a él como propietario particular. Mismo scope que contracts/receipts.
export const expenses = new Hono<AppEnv>();

const CATEGORIES = ['reparacion', 'limpieza', 'impuestos', 'servicios', 'expensas', 'mantenimiento', 'comision', 'seguro', 'otro'];

// Ámbito del user: agencia (si pertenece a una) o propietario particular.
// `prefix` prefija las columnas (ej 'e') para desambiguar en queries con JOIN.
async function scope(c: any, prefix = ''): Promise<{ where: string; bind: unknown[]; agencyId: number | null }> {
  const p = prefix ? `${prefix}.` : '';
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (mine) return { where: `${p}agency_id = ?`, bind: [mine.agency.id], agencyId: mine.agency.id };
  return { where: `${p}owner_kind = 'particular' AND ${p}owner_user_id = ?`, bind: [c.var.user.id], agencyId: null };
}

// Scope de escritura para los guards de FKs (propertyInScope de lib/ownership).
const owner = (c: any, s: { agencyId: number | null }) => ({ agencyId: s.agencyId, userId: c.var.user.id });

// ── Resumen ingresos vs gastos (P&L) por propiedad, SEPARADO por moneda ──
// Base CAJA y consistente en ambos lados: ingresos = recibos COBRADOS (receipts.paid_at
// IS NOT NULL) y gastos = solo PAGADOS (paid = 1). El "resultado" es flujo de caja real
// (lo que entró − lo que salió); los pendientes viven en la lista pero no falsean el P&L.
// Nunca se suman ARS + USD (gotcha del ecosistema).
expenses.get('/summary', async (c) => {
  const es = await scope(c, 'e');
  const cs = await scope(c, 'ct');

  const exp = (await c.env.DB
    .prepare(`SELECT e.property_id AS property_id, e.currency AS currency, COALESCE(SUM(e.amount), 0) AS amount
              FROM expenses e WHERE ${es.where} AND e.paid = 1 GROUP BY e.property_id, e.currency`)
    .bind(...es.bind)
    .all()).results as { property_id: number | null; currency: string; amount: number }[];

  const inc = (await c.env.DB
    .prepare(`SELECT ct.property_id AS property_id, r.currency AS currency, COALESCE(SUM(r.amount), 0) AS amount
              FROM receipts r JOIN contracts ct ON ct.id = r.contract_id
              WHERE r.paid_at IS NOT NULL AND ${cs.where} GROUP BY ct.property_id, r.currency`)
    .bind(...cs.bind)
    .all()).results as { property_id: number | null; currency: string; amount: number }[];

  type Row = { property_id: number | null; title: string | null; currency: string; income: number; expense: number };
  const map = new Map<string, Row>();
  const key = (pid: number | null, cur: string) => `${pid ?? 0}|${cur}`;
  const upsert = (pid: number | null, cur: string, field: 'income' | 'expense', val: number) => {
    const k = key(pid, cur);
    let r = map.get(k);
    if (!r) { r = { property_id: pid, title: null, currency: cur, income: 0, expense: 0 }; map.set(k, r); }
    r[field] += val;
  };
  for (const e of exp) upsert(e.property_id, e.currency, 'expense', e.amount);
  for (const i of inc) upsert(i.property_id, i.currency, 'income', i.amount);

  // Nombres de las propiedades. IMPORTANTE: la query de títulos se scopea al tenant (ps.where
  // sobre las columnas de properties). Los property_id del lado INGRESOS salen de ct.property_id,
  // y contracts.ts no valida ese id contra el scope → un contrato podría apuntar a una propiedad
  // ajena; sin este filtro se fugaría su título (lectura cross-tenant). Si el id no resuelve en
  // scope, la fila queda sin título ("Sin propiedad") pero conserva sus montos propios.
  const ids = [...new Set([...map.values()].map((r) => r.property_id).filter((x): x is number => x != null))];
  if (ids.length) {
    const ps = await scope(c);
    const ph = ids.map(() => '?').join(',');
    const titles = (await c.env.DB
      .prepare(`SELECT id, title FROM properties WHERE id IN (${ph}) AND ${ps.where}`)
      .bind(...ids, ...ps.bind)
      .all()).results as { id: number; title: string }[];
    const tmap = new Map(titles.map((t) => [t.id, t.title]));
    for (const r of map.values()) if (r.property_id != null) r.title = tmap.get(r.property_id) ?? null;
  }

  const rows = [...map.values()].sort((a, b) => (b.income - b.expense) - (a.income - a.expense));
  const totals = new Map<string, { currency: string; income: number; expense: number }>();
  for (const r of map.values()) {
    let t = totals.get(r.currency);
    if (!t) { t = { currency: r.currency, income: 0, expense: 0 }; totals.set(r.currency, t); }
    t.income += r.income; t.expense += r.expense;
  }
  return c.json({ rows, totals: [...totals.values()] });
});

// ── Resumen ingresos vs gastos agrupado por período (mes o día), SEPARADO por moneda ──
// Mismo criterio de caja que /summary: ingresos = recibos cobrados, gastos = pagados.
// by=month: agrupa todo el histórico por 'YYYY-MM'. by=day: acota a un solo mes
// (?month=YYYY-MM, default mes actual) para no traer volumen ilimitado de días.
// Gastos sin incurred_on (fecha opcional) caen a la fecha de created_at (ideas.md).
expenses.get('/summary/period', async (c) => {
  const by = c.req.query('by') === 'day' ? 'day' : 'month';
  const monthParam = str(c.req.query('month'), 7);
  const month = by === 'day' ? (monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : new Date().toISOString().slice(0, 7)) : null;

  const expFmt = by === 'day' ? "date(COALESCE(e.incurred_on, date(e.created_at)))" : "strftime('%Y-%m', COALESCE(e.incurred_on, date(e.created_at)))";
  const incFmt = by === 'day' ? 'date(r.paid_at)' : "strftime('%Y-%m', r.paid_at)";

  const es = await scope(c, 'e');
  const cs = await scope(c, 'ct');
  const expMonthFilter = by === 'day' ? ` AND strftime('%Y-%m', COALESCE(e.incurred_on, date(e.created_at))) = ?` : '';
  const incMonthFilter = by === 'day' ? ` AND strftime('%Y-%m', r.paid_at) = ?` : '';

  const exp = (await c.env.DB
    .prepare(`SELECT ${expFmt} AS period, e.currency AS currency, COALESCE(SUM(e.amount), 0) AS amount
              FROM expenses e WHERE ${es.where} AND e.paid = 1${expMonthFilter} GROUP BY period, e.currency`)
    .bind(...es.bind, ...(by === 'day' ? [month] : []))
    .all()).results as { period: string; currency: string; amount: number }[];

  const inc = (await c.env.DB
    .prepare(`SELECT ${incFmt} AS period, r.currency AS currency, COALESCE(SUM(r.amount), 0) AS amount
              FROM receipts r JOIN contracts ct ON ct.id = r.contract_id
              WHERE r.paid_at IS NOT NULL AND ${cs.where}${incMonthFilter} GROUP BY period, r.currency`)
    .bind(...cs.bind, ...(by === 'day' ? [month] : []))
    .all()).results as { period: string; currency: string; amount: number }[];

  type Row = { period: string; currency: string; income: number; expense: number };
  const map = new Map<string, Row>();
  const key = (p: string, cur: string) => `${p}|${cur}`;
  const upsert = (p: string, cur: string, field: 'income' | 'expense', val: number) => {
    const k = key(p, cur);
    let r = map.get(k);
    if (!r) { r = { period: p, currency: cur, income: 0, expense: 0 }; map.set(k, r); }
    r[field] += val;
  };
  for (const e of exp) upsert(e.period, e.currency, 'expense', e.amount);
  for (const i of inc) upsert(i.period, i.currency, 'income', i.amount);

  const periods = [...map.values()].sort((a, b) => a.period.localeCompare(b.period) || a.currency.localeCompare(b.currency));
  const totals = new Map<string, { currency: string; income: number; expense: number }>();
  for (const r of map.values()) {
    let t = totals.get(r.currency);
    if (!t) { t = { currency: r.currency, income: 0, expense: 0 }; totals.set(r.currency, t); }
    t.income += r.income; t.expense += r.expense;
  }
  return c.json({ periods, totals: [...totals.values()] });
});

// ── Movimientos (ingresos + gastos) de un solo día, para el detalle "libro diario" ──
// Acotado a una fecha puntual (evita traer volumen ilimitado). type/category/currency filtran server-side.
expenses.get('/transactions', async (c) => {
  const date = str(c.req.query('date'), 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad(c, 'Falta la fecha (YYYY-MM-DD)');
  const type = c.req.query('type'); // 'income' | 'expense' | undefined (= todos)
  const category = str(c.req.query('category'), 30);
  const currency = str(c.req.query('currency'), 8);

  const es = await scope(c, 'e');
  const cs = await scope(c, 'ct');

  type Tx = {
    id: number; source: 'receipt' | 'expense'; date: string; type: 'income' | 'expense';
    category: string | null; description: string | null; method: string | null;
    amount: number; currency: string; property_id: number | null; property_title: string | null;
  };
  const out: Tx[] = [];

  if (type !== 'expense') {
    const rows = (await c.env.DB
      .prepare(`SELECT r.id AS id, r.paid_at AS date, r.notes AS description, r.method AS method,
                       r.amount AS amount, r.currency AS currency, ct.property_id AS property_id
                FROM receipts r JOIN contracts ct ON ct.id = r.contract_id
                WHERE date(r.paid_at) = ? AND ${cs.where}${currency ? ' AND r.currency = ?' : ''}`)
      .bind(date, ...cs.bind, ...(currency ? [currency] : []))
      .all()).results as { id: number; date: string; description: string | null; method: string | null; amount: number; currency: string; property_id: number | null }[];
    out.push(...rows.map((r) => ({ id: r.id, source: 'receipt' as const, date: r.date, type: 'income' as const, category: null, description: r.description, method: r.method, amount: r.amount, currency: r.currency, property_id: r.property_id, property_title: null })));
  }
  if (type !== 'income') {
    const rows = (await c.env.DB
      .prepare(`SELECT e.id AS id, COALESCE(e.incurred_on, date(e.created_at)) AS date, e.description AS description,
                       e.method AS method, e.amount AS amount, e.currency AS currency, e.property_id AS property_id, e.category AS category
                FROM expenses e
                WHERE date(COALESCE(e.incurred_on, date(e.created_at))) = ? AND e.paid = 1 AND ${es.where}${category ? ' AND e.category = ?' : ''}${currency ? ' AND e.currency = ?' : ''}`)
      .bind(date, ...es.bind, ...(category ? [category] : []), ...(currency ? [currency] : []))
      .all()).results as { id: number; date: string; description: string | null; method: string | null; amount: number; currency: string; property_id: number | null; category: string }[];
    out.push(...rows.map((r) => ({ id: r.id, source: 'expense' as const, date: r.date, type: 'expense' as const, category: r.category, description: r.description, method: r.method, amount: r.amount, currency: r.currency, property_id: r.property_id, property_title: null })));
  }

  // Igual resguardo que /summary: resolver títulos con un lookup vuelto a scopear al tenant,
  // nunca confiar directo en ct.property_id (podría apuntar a una propiedad ajena).
  const ids = [...new Set(out.map((r) => r.property_id).filter((x): x is number => x != null))];
  if (ids.length) {
    const ps = await scope(c);
    const ph = ids.map(() => '?').join(',');
    const titles = (await c.env.DB
      .prepare(`SELECT id, title FROM properties WHERE id IN (${ph}) AND ${ps.where}`)
      .bind(...ids, ...ps.bind)
      .all()).results as { id: number; title: string }[];
    const tmap = new Map(titles.map((t) => [t.id, t.title]));
    for (const r of out) if (r.property_id != null) r.property_title = tmap.get(r.property_id) ?? null;
  }

  out.sort((a, b) => b.id - a.id);
  return c.json({ transactions: out.map(({ property_id: _pid, ...r }) => r) });
});

// ── Lista de gastos (opcional: ?property_id=) ──
expenses.get('/', async (c) => {
  const s = await scope(c, 'e');
  const pid = num(c.req.query('property_id'));
  const extra = pid != null ? ' AND e.property_id = ?' : '';
  const res = await c.env.DB
    .prepare(`SELECT e.*, p.title AS property_title
              FROM expenses e LEFT JOIN properties p ON p.id = e.property_id
              WHERE ${s.where}${extra}
              ORDER BY COALESCE(e.incurred_on, date(e.created_at)) DESC, e.id DESC LIMIT 500`)
    .bind(...s.bind, ...(pid != null ? [pid] : []))
    .all();
  return c.json({ expenses: res.results });
});

expenses.post('/', async (c) => {
  const s = await scope(c);
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const amount = num(b.amount);
  if (amount == null) return bad(c, 'Falta el monto');
  const propertyId = num(b.property_id);
  if (!(await propertyInScope(c.env.DB, owner(c, s), propertyId))) return bad(c, 'Propiedad inválida');
  const category = CATEGORIES.includes(String(b.category)) ? String(b.category) : 'otro';
  const row = await c.env.DB
    .prepare(
      `INSERT INTO expenses
         (owner_kind, agency_id, owner_user_id, property_id, category, description, amount, currency, incurred_on, paid, vendor, notes, method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .bind(
      s.agencyId != null ? 'agency' : 'particular',
      s.agencyId,
      s.agencyId != null ? null : c.var.user.id,
      propertyId,
      category,
      str(b.description, 200),
      amount,
      str(b.currency, 8) || 'ARS',
      str(b.incurred_on, 10),
      b.paid === false ? 0 : 1,
      str(b.vendor, 120),
      str(b.notes, 500),
      str(b.method, 40),
    )
    .first();
  return c.json({ expense: row }, 201);
});

expenses.patch('/:id', async (c) => {
  const s = await scope(c);
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  const setStr = (k: string, v: string | null) => { sets.push(`${k} = ?`); binds.push(v); };
  const setNum = (k: string, v: number | null) => { sets.push(`${k} = ?`); binds.push(v); };
  if ('category' in b) { const v = String(b.category); if (!CATEGORIES.includes(v)) return bad(c, 'categoría inválida'); setStr('category', v); }
  if ('property_id' in b) {
    const pid = num(b.property_id);
    if (!(await propertyInScope(c.env.DB, owner(c, s), pid))) return bad(c, 'Propiedad inválida');
    setNum('property_id', pid);
  }
  if ('description' in b) setStr('description', str(b.description, 200));
  if ('amount' in b) { const v = num(b.amount); if (v == null) return bad(c, 'Monto inválido'); setNum('amount', v); }
  if ('currency' in b) setStr('currency', str(b.currency, 8) || 'ARS');
  if ('incurred_on' in b) setStr('incurred_on', str(b.incurred_on, 10));
  if ('paid' in b) { sets.push('paid = ?'); binds.push(b.paid ? 1 : 0); }
  if ('vendor' in b) setStr('vendor', str(b.vendor, 120));
  if ('notes' in b) setStr('notes', str(b.notes, 500));
  if ('method' in b) setStr('method', str(b.method, 40));
  if (!sets.length) return bad(c, 'Nada para actualizar');
  const r = await c.env.DB
    .prepare(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ? AND ${s.where}`)
    .bind(...binds, id, ...s.bind)
    .run();
  if (!r.meta.changes) return notFound(c, 'Gasto no encontrado');
  const updated = await c.env.DB.prepare('SELECT * FROM expenses WHERE id = ?').bind(id).first();
  return c.json({ expense: updated });
});

expenses.delete('/:id', async (c) => {
  const s = await scope(c);
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const r = await c.env.DB.prepare(`DELETE FROM expenses WHERE id = ? AND ${s.where}`).bind(id, ...s.bind).run();
  if (!r.meta.changes) return notFound(c, 'Gasto no encontrado');
  return c.json({ success: true });
});
