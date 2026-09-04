import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, notFound, num, str } from '../lib/http';
import { getUserAgency } from '../lib/subscription';
import { COMPUTED_STATUS_SQL } from '../lib/propertyStatus';

// CRM de la inmobiliaria: contactos (propietarios en consignación + interesados)
// y cruce interesado→propiedades disponibles (matching).
export const clients = new Hono<AppEnv>();

// prefs = { operation?, city?, capacity?, max_price?, currency?, min_rooms? } — qué busca
// el interesado. `capacity` (cuántos duermen) es EL criterio del alquiler temporario de
// costa: sin él, el cruce ofrecía monoambientes a una familia de 6.
function buildPrefs(body: Record<string, unknown>): string {
  const p: Record<string, unknown> = {};
  const op = str(body.operation, 20);
  if (op && ['venta', 'alquiler', 'temporario'].includes(op)) p.operation = op;
  const city = str(body.city, 80);
  if (city) p.city = city;
  const maxP = num(body.max_price);
  if (maxP != null) p.max_price = maxP;
  const cur = str(body.currency, 3);
  if (cur && ['ARS', 'USD'].includes(cur)) p.currency = cur;
  const minR = num(body.min_rooms);
  if (minR != null) p.min_rooms = minR;
  const cap = num(body.capacity);
  if (cap != null) p.capacity = cap;
  return JSON.stringify(p);
}

/**
 * Lee las prefs tolerando las DOS escrituras que hay en las bases.
 *
 * El form del CRM guardaba `max_price`/`min_rooms`, pero las carteras cargadas por seed
 * (El Muelle) tienen `maxPrice`/`rooms`/`capacity`/`currency`. El matcher leía solo las
 * primeras, así que presupuesto y personas se **ignoraban en silencio** y ni siquiera se
 * mostraban en la ficha ("Busca: temporario · Mar de las Pampas", sin el resto).
 * Se acepta cualquiera de las dos en vez de migrar el JSON de las bases en producción.
 */
function readPrefs(raw: string | null) {
  let p: Record<string, unknown> = {};
  try { p = JSON.parse(raw || '{}') as Record<string, unknown>; } catch { /* prefs rotas → sin criterios */ }
  const pick = (...keys: string[]) => { for (const k of keys) { const v = num(p[k]); if (v != null) return v; } return null; };
  const cur = str(p.currency, 3);
  return {
    operation: str(p.operation, 20),
    city: str(p.city, 80),
    max_price: pick('max_price', 'maxPrice'),
    currency: cur && ['ARS', 'USD'].includes(cur.toUpperCase()) ? cur.toUpperCase() : null,
    min_rooms: pick('min_rooms', 'minRooms', 'rooms'),
    capacity: pick('capacity'),
  };
}

/**
 * Ficha del contacto: todo lo que la inmobiliaria tiene sobre él en un solo lugar.
 *
 * El vínculo con propiedades sale de `mandates` (el encargo/consignación). Los gastos
 * y los ingresos NO cuelgan del contacto: cuelgan de SUS propiedades y de SUS contratos,
 * así que se derivan de ahí. Como en el P&L, **las monedas nunca se mezclan**.
 *
 * Todo va scopeado por `agency_id` — un id de otra agencia devuelve 404, no datos ajenos.
 */
clients.get('/:id', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return notFound(c, 'Sin inmobiliaria');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const ag = mine.agency.id;

  const client = await c.env.DB
    .prepare('SELECT * FROM clients WHERE id = ? AND agency_id = ?')
    .bind(id, ag)
    .first();
  if (!client) return notFound(c, 'Contacto no encontrado');

  // Propiedades en consignación (vía mandates).
  const properties = await c.env.DB
    .prepare(
      `SELECT p.id, p.title, p.operation, p.status, p.price, p.currency, p.price_period,
              p.city, p.published, p.archived_at,
              m.commission_pct, m.exclusive, m.ends_at,
              (SELECT r2_key FROM property_media pm WHERE pm.property_id = p.id ORDER BY pm.sort LIMIT 1) AS cover_key
       FROM mandates m JOIN properties p ON p.id = m.property_id
       WHERE m.client_id = ? AND m.agency_id = ? ORDER BY p.id`,
    )
    .bind(id, ag)
    .all();

  // Operaciones del pipeline donde participa.
  const deals = await c.env.DB
    .prepare(
      `SELECT d.id, d.stage, d.notes, d.created_at, p.title AS property_title
       FROM deals d LEFT JOIN properties p ON p.id = d.property_id AND p.agency_id = d.agency_id
       WHERE d.client_id = ? AND d.agency_id = ? ORDER BY d.id DESC`,
    )
    .bind(id, ag)
    .all();

  // Contratos que le tocan, por DOS vías — sin las dos, la ficha miente:
  //   · `parte`: él es el inquilino/comprador (client_id)
  //   · `propietario`: el contrato es sobre una propiedad SUYA (vía mandates)
  // Un propietario no firma el contrato de alquiler de su inquilino, pero ese contrato
  // es exactamente lo que le rinde: sin la 2ª vía, la ficha del dueño sale en cero.
  const CONTRACT_SCOPE = `(
      ct.client_id = ?
      OR ct.property_id IN (SELECT property_id FROM mandates WHERE client_id = ? AND agency_id = ?)
    ) AND ct.agency_id = ?`;

  const contracts = await c.env.DB
    .prepare(
      `SELECT ct.id, ct.operation, ct.amount, ct.currency, ct.status, ct.start_date, ct.end_date,
              p.title AS property_title,
              CASE WHEN ct.client_id = ? THEN 'parte' ELSE 'propietario' END AS role,
              (SELECT COALESCE(SUM(r.amount), 0) FROM receipts r WHERE r.contract_id = ct.id AND r.paid_at IS NOT NULL) AS collected
       FROM contracts ct LEFT JOIN properties p ON p.id = ct.property_id AND p.agency_id = ct.agency_id
       WHERE ${CONTRACT_SCOPE} ORDER BY ct.id DESC`,
    )
    .bind(id, id, id, ag, ag)
    .all();

  // Ingresos: recibos COBRADOS de esos contratos, agrupados por la moneda DEL RECIBO
  // (un contrato en USD puede tener recibos en ARS; manda lo que entró en caja).
  const income = await c.env.DB
    .prepare(
      `SELECT r.currency, COALESCE(SUM(r.amount), 0) AS total
       FROM receipts r JOIN contracts ct ON ct.id = r.contract_id
       WHERE ${CONTRACT_SCOPE} AND r.paid_at IS NOT NULL
       GROUP BY r.currency`,
    )
    .bind(id, id, ag, ag)
    .all();

  // Gastos: los de SUS propiedades (las que tiene en consignación), por moneda.
  // `paid` separa lo ya pagado de lo pendiente, igual criterio que el P&L.
  const expenses = await c.env.DB
    .prepare(
      `SELECT e.currency,
              COALESCE(SUM(CASE WHEN e.paid = 1 THEN e.amount ELSE 0 END), 0) AS paid,
              COALESCE(SUM(CASE WHEN e.paid = 0 THEN e.amount ELSE 0 END), 0) AS pending
       FROM expenses e
       WHERE e.agency_id = ?
         AND e.property_id IN (SELECT property_id FROM mandates WHERE client_id = ? AND agency_id = ?)
       GROUP BY e.currency`,
    )
    .bind(ag, id, ag)
    .all();

  return c.json({
    client,
    properties: properties.results,
    deals: deals.results,
    contracts: contracts.results,
    income: income.results,
    expenses: expenses.results,
  });
});

clients.get('/', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ clients: [] });
  const res = await c.env.DB
    .prepare('SELECT * FROM clients WHERE agency_id = ? ORDER BY created_at DESC')
    .bind(mine.agency.id)
    .all();
  return c.json({ clients: res.results });
});

clients.post('/', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(body.name, 120);
  if (!name) return bad(c, 'Falta el nombre del contacto');
  const kind = body.kind === 'propietario' ? 'propietario' : 'interesado';
  const row = await c.env.DB
    .prepare(
      `INSERT INTO clients (agency_id, kind, name, email, phone, notes, prefs)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .bind(mine.agency.id, kind, name, str(body.email, 160), str(body.phone, 40), str(body.notes, 2000), buildPrefs(body))
    .first();
  return c.json({ client: row }, 201);
});

clients.patch('/:id', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  const put = (col: string, v: unknown) => { sets.push(`${col} = ?`); binds.push(v); };
  if ('name' in body) { const n = str(body.name, 120); if (!n) return bad(c, 'name vacío'); put('name', n); }
  if ('email' in body) put('email', str(body.email, 160));
  if ('phone' in body) put('phone', str(body.phone, 40));
  if ('notes' in body) put('notes', str(body.notes, 2000));
  if ('kind' in body) put('kind', body.kind === 'propietario' ? 'propietario' : 'interesado');
  if (['operation', 'city', 'max_price', 'currency', 'min_rooms', 'capacity'].some((k) => k in body)) put('prefs', buildPrefs(body));
  if (!sets.length) return bad(c, 'Nada para actualizar');
  binds.push(id, mine.agency.id);
  const r = await c.env.DB.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ? AND agency_id = ?`).bind(...binds).run();
  if (!r.meta.changes) return notFound(c, 'Contacto no encontrado');
  const updated = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  return c.json({ client: updated });
});

clients.delete('/:id', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'No tenés una inmobiliaria');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const r = await c.env.DB.prepare('DELETE FROM clients WHERE id = ? AND agency_id = ?').bind(id, mine.agency.id).run();
  if (!r.meta.changes) return notFound(c, 'Contacto no encontrado');
  return c.json({ success: true });
});

/**
 * Cruce: propiedades de la agencia que matchean lo que busca el interesado.
 *
 * 🔴 **"Reservada" NO es "no ofrecerle".** Esto filtraba por `status = 'disponible'`, y
 * desde la 0014 el estado se **calcula desde el calendario**: una reserva FUTURA ya deja
 * la propiedad en 'reservada'. En una inmobiliaria de costa eso significa que en cuanto
 * una casa tiene una quincena vendida desaparece del cruce para siempre — el matcher
 * devolvía cero para TODOS los interesados de El Muelle teniendo la casa exacta cargada.
 * Ahora solo se descarta lo que realmente no se puede ofrecer (vendida / archivada) y
 * cada fila viaja con su estado y su próxima ocupación, para que decida la persona.
 *
 * El precio se compara **dentro de la misma moneda** (misma regla que el resto del repo:
 * 150.000 USD no es 150.000 ARS) y la capacidad es un **mínimo**: para 4 personas, una
 * casa de 6 sirve; una de 2, no.
 */
clients.get('/:id/matches', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ matches: [] });
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const client = await c.env.DB
    .prepare('SELECT prefs FROM clients WHERE id = ? AND agency_id = ?')
    .bind(id, mine.agency.id)
    .first<{ prefs: string | null }>();
  if (!client) return notFound(c, 'Contacto no encontrado');
  const prefs = readPrefs(client.prefs);

  const where = ['p.agency_id = ?', 'p.archived_at IS NULL', "COALESCE(p.status, '') <> 'vendida'"];
  const binds: unknown[] = [mine.agency.id];
  if (prefs.operation) { where.push('p.operation = ?'); binds.push(prefs.operation); }
  if (prefs.city) { where.push('LOWER(p.city) LIKE ?'); binds.push(`%${prefs.city.toLowerCase()}%`); }
  if (prefs.max_price != null) {
    // Sin moneda declarada se compara el número pelado (dato viejo); con moneda, solo contra la suya.
    if (prefs.currency) { where.push('(p.price IS NULL OR (p.currency = ? AND p.price <= ?))'); binds.push(prefs.currency, prefs.max_price); }
    else { where.push('(p.price IS NULL OR p.price <= ?)'); binds.push(prefs.max_price); }
  }
  if (prefs.min_rooms != null) { where.push('(p.rooms IS NULL OR p.rooms >= ?)'); binds.push(prefs.min_rooms); }
  if (prefs.capacity != null) { where.push('(p.capacity IS NULL OR p.capacity >= ?)'); binds.push(prefs.capacity); }
  const res = await c.env.DB
    .prepare(
      `SELECT p.id, p.title, p.operation, p.price, p.currency, p.city, p.rooms, p.capacity, p.area_m2,
              ${COMPUTED_STATUS_SQL} AS status,
              (SELECT bk.from_date FROM bookings bk WHERE bk.property_id = p.id AND bk.to_date >= date('now')
                ORDER BY bk.from_date LIMIT 1) AS busy_from,
              (SELECT bk.to_date FROM bookings bk WHERE bk.property_id = p.id AND bk.to_date >= date('now')
                ORDER BY bk.from_date LIMIT 1) AS busy_to,
              (SELECT r2_key FROM property_media pm WHERE pm.property_id = p.id ORDER BY pm.sort LIMIT 1) AS cover_key
         FROM properties p
        WHERE ${where.join(' AND ')}
        ORDER BY (status = 'disponible') DESC, p.price LIMIT 50`,
    )
    .bind(...binds)
    .all();
  return c.json({ matches: res.results, prefs });
});
