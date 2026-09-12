import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, notFound, num, paymentRequired, str } from '../lib/http';
import { getSubStatus, getUserAgency } from '../lib/subscription';
import { parseArgenprop } from '../lib/argenprop';
import { BOOKING_KINDS, COMPUTED_STATUS_SQL } from '../lib/propertyStatus';
import { clientInAgency } from '../lib/ownership';

// Cartera de propiedades de la inmobiliaria (no hay alta particular, ver POST /).
export const properties = new Hono<AppEnv>();

/** Tope de filas de /mine. El front lo compara para avisar si quedó gente afuera. */
export const MINE_LIMIT = 1000;

const OPERATIONS = ['venta', 'alquiler', 'temporario'];
// disponible/reservada/alquilada se calculan desde bookings (COMPUTED_STATUS_SQL);
// solo estos dos son asignables a mano vía PATCH (vender / revertir venta).
const MANUAL_STATUSES = ['disponible', 'vendida'];

// amenities llega como array de keys → se guarda como JSON string (o null).
function jsonAmenities(v: unknown): string | null {
  return Array.isArray(v) ? JSON.stringify(v.filter((x) => typeof x === 'string').slice(0, 20)) : null;
}

// Propiedades que el user puede gestionar (las de su agencia; owner_user_id queda
// como filtro defensivo por si hay filas históricas de antes de este cambio).
properties.get('/mine', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  const agencyId = mine?.agency.id ?? -1;
  const res = await c.env.DB
    .prepare(
      `SELECT p.id, p.owner_kind, p.operation, p.kind, p.title, p.price, p.currency, p.price_period, p.city, p.province,
              p.address, p.description, p.lat, p.lng, p.rooms, p.area_m2, p.bathrooms, p.capacity, p.amenities,
              p.available_from, p.available_until, p.external_url,
              ${COMPUTED_STATUS_SQL} AS status, p.published, p.archived_at, p.branch_id, b.name AS branch_name, p.created_at, p.updated_at,
              (SELECT r2_key FROM property_media pm WHERE pm.property_id = p.id ORDER BY pm.sort LIMIT 1) AS cover_key,
              (SELECT COUNT(*) FROM property_media pm2 WHERE pm2.property_id = p.id) AS photos,
              (SELECT COALESCE(SUM(count), 0) FROM property_views v WHERE v.property_id = p.id) AS views,
              -- Tarifas por temporada embebidas: las usa el filtro "con/sin precio" y el
              -- precio calculado al compartir por WhatsApp (según el rango de fechas del filtro).
              COALESCE((SELECT json_group_array(json_object(
                  'month', sp.month, 'price_month', sp.price_month,
                  'price_day_q1', sp.price_day_q1, 'price_week_q1', sp.price_week_q1, 'price_fortnight_q1', sp.price_fortnight_q1,
                  'price_day_q2', sp.price_day_q2, 'price_week_q2', sp.price_week_q2, 'price_fortnight_q2', sp.price_fortnight_q2))
                FROM property_season_prices sp WHERE sp.property_id = p.id), '[]') AS season_prices,
              -- Reservas completas (no solo el rango): con esto el modal del calendario
              -- abre YA, sin esperar su propio fetch. El nombre del contacto se resuelve
              -- scopeado a la agencia de la propiedad (nunca por client_id a secas).
              COALESCE((SELECT json_group_array(json_object(
                  'id', bk.id, 'f', bk.from_date, 't', bk.to_date, 'k', bk.kind,
                  'g', bk.guest_name, 'ci', bk.client_id,
                  'c', (SELECT cl.name FROM clients cl WHERE cl.id = bk.client_id AND cl.agency_id = p.agency_id)))
                FROM bookings bk WHERE bk.property_id = p.id), '[]') AS bookings,
              -- Propietario (contacto del CRM que la dejó en consignación), vía el encargo.
              (SELECT m.client_id FROM mandates m WHERE m.property_id = p.id AND m.agency_id = p.agency_id LIMIT 1) AS owner_client_id,
              (SELECT cl.name FROM mandates m JOIN clients cl ON cl.id = m.client_id
                WHERE m.property_id = p.id AND m.agency_id = p.agency_id LIMIT 1) AS owner_client_name
       FROM properties p LEFT JOIN branches b ON b.id = p.branch_id
       WHERE p.owner_user_id = ? OR p.agency_id = ?
       -- El tope existe para que una cartera grande no tumbe la request; el panel avisa
       -- en pantalla cuando lo toca (el cliente que llega de BuscadorProp trae ~1000).
       ORDER BY p.created_at DESC LIMIT ${MINE_LIMIT}`,
    )
    .bind(c.var.user.id, agencyId)
    .all();
  // `capped` avisa que el tope dejó filas afuera: sin esto el panel muestra un total
  // que miente (y el cliente que llega de BuscadorProp trae ~1000 propiedades).
  return c.json({ properties: res.results, capped: res.results.length >= MINE_LIMIT });
});

// Crear propiedad. Solo inmobiliarias (cartera gateada por la suscripción) —
// no hay alta de propiedad "particular" (decisión de producto: el software se
// vende a inmobiliarias, no es autoservicio para dueños sueltos).
properties.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const operation = str(body.operation, 20);
  const title = str(body.title, 160);
  if (!operation || !OPERATIONS.includes(operation)) return bad(c, 'operation inválida (venta|alquiler|temporario)');
  if (!title) return bad(c, 'Falta el título');

  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'Necesitás pertenecer a una inmobiliaria para publicar propiedades');
  const sub = await getSubStatus(c.env.DB, mine.agency.id);
  if (sub?.blocked) return paymentRequired(c, 'Trial vencido: contactá a Coopen para reactivar la gestión');
  const ownerKind = 'agency';
  const agencyId = mine.agency.id;
  const branchId = num(body.branch_id);

  const row = await c.env.DB
    .prepare(
      `INSERT INTO properties
        (owner_kind, agency_id, branch_id, owner_user_id, operation, kind, title, description,
         price, currency, price_period, area_m2, rooms, capacity, available_from, available_until, bathrooms, amenities,
         address, city, province, external_url, lat, lng, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible') RETURNING *`,
    )
    .bind(
      ownerKind, agencyId, branchId, c.var.user.id, operation,
      str(body.kind, 40), title, str(body.description, 4000),
      num(body.price), str(body.currency, 8) || 'USD', str(body.price_period, 10), num(body.area_m2), num(body.rooms),
      num(body.capacity), str(body.available_from, 10), str(body.available_until, 10),
      num(body.bathrooms), jsonAmenities(body.amenities),
      str(body.address, 200), str(body.city, 80), str(body.province, 80), str(body.external_url, 500) || null,
      num(body.lat), num(body.lng),
    )
    .first();
  return c.json({ property: row }, 201);
});

// Importar una propiedad desde un link de Argenprop (extrae datos + fotos).
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.9',
};

properties.post('/import', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const url = str(body.url, 500);
  if (!url || !/^https?:\/\/(www\.)?argenprop\.com\//i.test(url)) return bad(c, 'Pegá un link de argenprop.com');

  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'Necesitás pertenecer a una inmobiliaria para publicar propiedades');
  const sub = await getSubStatus(c.env.DB, mine.agency.id);
  if (sub?.blocked) return paymentRequired(c, 'Trial vencido: contactá a Coopen para reactivar la gestión');
  const ownerKind = 'agency';
  const agencyId = mine.agency.id;

  const grab = async (u: string) => {
    try { const r = await fetch(u, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(20000) }); return r.ok ? await r.text() : ''; }
    catch { return ''; }
  };
  // Con proxy configurado (SCRAPER_URL) se saltea el anti-bot; si no, intento directo (suele bloquear).
  let html = '';
  if (c.env.SCRAPER_URL) html = await grab(c.env.SCRAPER_URL.replace('{url}', encodeURIComponent(url)));
  if (!html || html.length < 2000) html = await grab(url);
  if (!html || html.length < 2000) {
    return c.json({ error: 'No pudimos leer el aviso de Argenprop (puede estar bloqueando el acceso). Probá de nuevo en un rato o cargala a mano.', code: 'IMPORT_FAILED' }, 502);
  }

  const { draft, images } = parseArgenprop(html, url);
  if (!draft.title && draft.price == null) {
    return c.json({ error: 'No pudimos extraer los datos del aviso. Cargala a mano.', code: 'IMPORT_FAILED' }, 422);
  }

  const row = await c.env.DB
    .prepare(
      `INSERT INTO properties
        (owner_kind, agency_id, owner_user_id, operation, kind, title, description,
         price, currency, area_m2, rooms, capacity, bathrooms, amenities,
         address, city, province, external_url, status, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', 0) RETURNING *`,
    )
    .bind(
      ownerKind, agencyId, c.var.user.id, draft.operation || 'alquiler', draft.kind, draft.title || 'Propiedad importada',
      draft.description, draft.price, draft.currency, draft.area_m2, draft.rooms, null, draft.bathrooms,
      draft.amenities.length ? JSON.stringify(draft.amenities) : null,
      draft.address, draft.city, draft.province, url,
    )
    .first<{ id: number }>();
  if (!row) return bad(c, 'No se pudo crear la propiedad');

  // Bajar las fotos a R2 (best-effort, tope 15).
  let photos = 0;
  for (const imgUrl of images.slice(0, 15)) {
    try {
      const ir = await fetch(imgUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(9000) });
      if (!ir.ok) continue;
      const ct = ir.headers.get('content-type') || 'image/jpeg';
      if (!ct.startsWith('image/')) continue;
      const key = `prop/${row.id}/${crypto.randomUUID()}.jpg`;
      await c.env.MEDIA.put(key, await ir.arrayBuffer(), { httpMetadata: { contentType: ct } });
      await c.env.DB.prepare("INSERT INTO property_media (property_id, r2_key, kind, sort) VALUES (?, ?, 'photo', ?)").bind(row.id, key, photos).run();
      photos++;
    } catch { /* salta la foto que falle */ }
  }

  return c.json({ property: row, imported: { photos, fields: draft } }, 201);
});

// Carga una propiedad que el user puede gestionar (suya o de su agencia), o null.
async function loadManageable(db: D1Database, userId: number, id: number) {
  const mine = await getUserAgency(db, userId);
  const agencyId = mine?.agency.id ?? -1;
  return db
    .prepare('SELECT * FROM properties WHERE id = ? AND (owner_user_id = ? OR agency_id = ?)')
    .bind(id, userId, agencyId)
    .first<Record<string, unknown>>();
}

// Editar campos (incluye publicar/despublicar y cambiar estado).
properties.patch('/:id', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  const setStr = (col: string, v: string | null) => { sets.push(`${col} = ?`); binds.push(v); };
  const setNum = (col: string, v: number | null) => { sets.push(`${col} = ?`); binds.push(v); };

  if ('title' in body) { const t = str(body.title, 160); if (!t) return bad(c, 'title vacío'); setStr('title', t); }
  if ('operation' in body) { const o = str(body.operation, 20); if (!o || !OPERATIONS.includes(o)) return bad(c, 'operation inválida'); setStr('operation', o); }
  if ('kind' in body) setStr('kind', str(body.kind, 40));
  if ('description' in body) setStr('description', str(body.description, 4000));
  if ('price' in body) setNum('price', num(body.price));
  if ('currency' in body) setStr('currency', str(body.currency, 8) || 'USD');
  if ('price_period' in body) setStr('price_period', str(body.price_period, 10));
  if ('rooms' in body) setNum('rooms', num(body.rooms));
  if ('area_m2' in body) setNum('area_m2', num(body.area_m2));
  if ('capacity' in body) setNum('capacity', num(body.capacity));
  if ('available_from' in body) setStr('available_from', str(body.available_from, 10));
  if ('available_until' in body) setStr('available_until', str(body.available_until, 10));
  if ('bathrooms' in body) setNum('bathrooms', num(body.bathrooms));
  if ('amenities' in body) { sets.push('amenities = ?'); binds.push(jsonAmenities(body.amenities)); }
  if ('lat' in body) setNum('lat', num(body.lat));
  if ('lng' in body) setNum('lng', num(body.lng));
  if ('city' in body) setStr('city', str(body.city, 80));
  if ('province' in body) setStr('province', str(body.province, 80));
  if ('address' in body) setStr('address', str(body.address, 200));
  if ('external_url' in body) setStr('external_url', str(body.external_url, 500) || null);
  if ('status' in body) {
    // disponible/reservada/alquilada se calculan solos desde el calendario; acá
    // solo se puede vender (marcar 'vendida') o revertir eso ('disponible').
    const s = str(body.status, 20);
    if (!s || !MANUAL_STATUSES.includes(s)) return bad(c, "status inválido (solo 'disponible' o 'vendida')");
    setStr('status', s);
  }
  if ('archived' in body) {
    if (body.archived) {
      if (prop.status !== 'vendida') return bad(c, 'Solo se puede archivar una propiedad vendida');
      sets.push("archived_at = datetime('now')");
      sets.push('published = ?'); binds.push(0);
    } else {
      sets.push('archived_at = NULL');
    }
  }
  if ('published' in body) { sets.push('published = ?'); binds.push(body.published ? 1 : 0); }
  if ('branch_id' in body) { sets.push('branch_id = ?'); binds.push(num(body.branch_id)); }

  // Propietario: no es una columna de `properties`, es el encargo (`mandates`). Se maneja
  // aparte del UPDATE y por eso NO cuenta para el "Nada para actualizar" de abajo.
  const ownerTouched = 'owner_client_id' in body;
  const ownerClientId = ownerTouched ? num(body.owner_client_id) : null;
  if (ownerTouched && ownerClientId != null) {
    // Hardening: el contacto tiene que ser de ESTA agencia (regla de lib/ownership).
    if (!(await clientInAgency(c.env.DB, prop.agency_id as number | null, ownerClientId))) {
      return bad(c, 'Contacto inválido');
    }
  }
  if (!sets.length && !ownerTouched) return bad(c, 'Nada para actualizar');

  if (ownerTouched) {
    // Un encargo por propiedad: se reemplaza el anterior. null = se le saca el propietario.
    await c.env.DB.prepare('DELETE FROM mandates WHERE property_id = ? AND agency_id = ?').bind(id, prop.agency_id).run();
    if (ownerClientId != null) {
      await c.env.DB
        .prepare('INSERT INTO mandates (agency_id, property_id, client_id) VALUES (?, ?, ?)')
        .bind(prop.agency_id, id, ownerClientId)
        .run();
    }
  }
  if (!sets.length) {
    const only = await c.env.DB.prepare('SELECT * FROM properties WHERE id = ?').bind(id).first();
    return c.json({ property: only });
  }

  sets.push("updated_at = datetime('now')");
  binds.push(id);
  await c.env.DB.prepare(`UPDATE properties SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
  const updated = await c.env.DB.prepare('SELECT * FROM properties WHERE id = ?').bind(id).first();
  return c.json({ property: updated });
});

properties.delete('/:id', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  await c.env.DB.prepare('DELETE FROM properties WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Duplicar una propiedad (datos + fotos + propietario + precios por temporada). El título
// de la copia queda como "<título> copia 1"; la próxima copia de esa familia es "copia 2",
// "copia 3", etc. Respeta el estado de publicación de la original; nace sin reservas, sin
// link de aviso (external_url es único) y con estado 'disponible'. Las fotos NO se
// duplican en R2: las filas nuevas apuntan a las MISMAS keys (se comparte el binario para
// ahorrar espacio; el borrado de foto ya está referenciado, ver DELETE /:id/media/:mid).
properties.post('/:id/copy', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const src = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!src) return notFound(c, 'Propiedad no encontrada');

  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return bad(c, 'Necesitás pertenecer a una inmobiliaria para copiar propiedades');
  const sub = await getSubStatus(c.env.DB, mine.agency.id);
  if (sub?.blocked) return paymentRequired(c, 'Trial vencido: contactá a Coopen para reactivar la gestión');

  // Base del título = título sin un " copia N" final. Escaneo la cartera por "<base> copia N",
  // tomo el mayor N (0 si no hay ninguna) y la copia nueva es "copia max+1" → la 1ª es "copia 1".
  const rawTitle = String(src.title ?? '');
  const base = rawTitle.replace(/\s+copia(?:\s+\d+)?\s*$/i, '').trim() || rawTitle.trim();
  const scan = src.agency_id != null
    ? c.env.DB.prepare('SELECT title FROM properties WHERE agency_id = ?').bind(src.agency_id)
    : c.env.DB.prepare('SELECT title FROM properties WHERE owner_user_id = ?').bind(c.var.user.id);
  const siblings = (await scan.all<{ title: string }>()).results;
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+copia\\s+(\\d+)\\s*$`, 'i');
  let max = 0;
  for (const s of siblings) {
    const m = re.exec((s.title ?? '').trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  const title = `${base} copia ${max + 1}`.slice(0, 160);

  const ins = await c.env.DB
    .prepare(
      `INSERT INTO properties
        (owner_kind, agency_id, branch_id, owner_user_id, operation, kind, title, description,
         price, currency, price_period, area_m2, rooms, capacity, available_from, available_until,
         bathrooms, amenities, address, city, province, lat, lng, status, published)
       SELECT owner_kind, agency_id, branch_id, owner_user_id, operation, kind, ?, description,
         price, currency, price_period, area_m2, rooms, capacity, available_from, available_until,
         bathrooms, amenities, address, city, province, lat, lng, 'disponible', published
       FROM properties WHERE id = ?`,
    )
    .bind(title, id)
    .run();
  const newId = ins.meta.last_row_id;
  if (!newId) return bad(c, 'No se pudo copiar la propiedad');

  // Encargo (propietario): se copia el de la original, apuntando a la copia (no-op si no tiene).
  await c.env.DB
    .prepare(
      `INSERT INTO mandates (agency_id, property_id, client_id, exclusive, commission_pct, ends_at)
       SELECT agency_id, ?, client_id, exclusive, commission_pct, ends_at
       FROM mandates WHERE property_id = ? AND agency_id = ?`,
    )
    .bind(newId, id, src.agency_id)
    .run();

  // Precios por temporada: se copian tal cual (una fila por mes) a la propiedad nueva.
  await c.env.DB
    .prepare(
      `INSERT INTO property_season_prices
        (property_id, month, price_month, price_day_q1, price_week_q1, price_fortnight_q1, price_day_q2, price_week_q2, price_fortnight_q2)
       SELECT ?, month, price_month, price_day_q1, price_week_q1, price_fortnight_q1, price_day_q2, price_week_q2, price_fortnight_q2
       FROM property_season_prices WHERE property_id = ?`,
    )
    .bind(newId, id)
    .run();

  // Fotos: se comparten. Las filas nuevas apuntan a la MISMA r2_key que la original — no
  // se copia el binario en R2 (ahorro de espacio). El DELETE de foto borra el objeto solo
  // si ninguna otra fila lo referencia.
  const media = await c.env.DB
    .prepare(
      `INSERT INTO property_media (property_id, r2_key, kind, sort)
       SELECT ?, r2_key, kind, sort FROM property_media WHERE property_id = ?`,
    )
    .bind(newId, id)
    .run();

  const property = await c.env.DB.prepare('SELECT * FROM properties WHERE id = ?').bind(newId).first();
  return c.json({ property, copied: { photos: media.meta.changes ?? 0 } }, 201);
});

// ── Fotos de la propiedad (R2). Se sirven públicas en GET /media/<key>. ──

const MAX_BYTES = 8 * 1024 * 1024;

// El global File no viene tipado con @cloudflare/workers-types; forma mínima que usamos.
type Uploaded = { type: string; size: number; name: string; arrayBuffer(): Promise<ArrayBuffer> };

// Subir una foto (multipart, campo "file") a una propiedad gestionable.
properties.post('/:id/media', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');

  const form = await c.req.formData().catch(() => null);
  const file = form?.get('file') as unknown as Uploaded | string | null | undefined;
  if (!file || typeof file === 'string') return bad(c, 'Falta el archivo (campo "file")');
  if (!file.type.startsWith('image/')) return bad(c, 'Solo se aceptan imágenes');
  if (file.size > MAX_BYTES) return bad(c, 'La imagen supera 8MB');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
  const key = `prop/${id}/${crypto.randomUUID()}.${ext}`;
  await c.env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const next = await c.env.DB
    .prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM property_media WHERE property_id = ?')
    .bind(id)
    .first<{ n: number }>();
  const row = await c.env.DB
    .prepare("INSERT INTO property_media (property_id, r2_key, kind, sort) VALUES (?, ?, 'photo', ?) RETURNING id, r2_key, sort")
    .bind(id, key, next?.n ?? 0)
    .first();
  return c.json({ media: row }, 201);
});

// Listar fotos de una propiedad gestionable.
properties.get('/:id/media', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  const res = await c.env.DB
    .prepare('SELECT id, r2_key, sort FROM property_media WHERE property_id = ? ORDER BY sort')
    .bind(id)
    .all();
  return c.json({ media: res.results });
});

// Borrar una foto (fila + objeto de R2). El objeto de R2 se borra solo si ninguna otra
// fila lo referencia — al duplicar una propiedad las copias comparten la misma r2_key.
properties.delete('/:id/media/:mid', async (c) => {
  const id = num(c.req.param('id'));
  const mid = num(c.req.param('mid'));
  if (id == null || mid == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  const m = await c.env.DB
    .prepare('SELECT r2_key FROM property_media WHERE id = ? AND property_id = ?')
    .bind(mid, id)
    .first<{ r2_key: string }>();
  if (!m) return notFound(c, 'Foto no encontrada');
  await c.env.DB.prepare('DELETE FROM property_media WHERE id = ?').bind(mid).run();
  const stillUsed = await c.env.DB
    .prepare('SELECT 1 FROM property_media WHERE r2_key = ? LIMIT 1')
    .bind(m.r2_key)
    .first();
  if (!stillUsed) await c.env.MEDIA.delete(m.r2_key);
  return c.json({ success: true });
});

// ── Estadísticas de visitas de una propiedad (para el dueño) ──
properties.get('/:id/stats', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  // Serie de los últimos 30 días (los días sin visitas no tienen fila; se rellenan en el cliente).
  const series = (await c.env.DB
    .prepare(`SELECT day, count FROM property_views WHERE property_id = ? AND day >= date('now','-29 days') ORDER BY day`)
    .bind(id)
    .all<{ day: string; count: number }>()).results;
  const agg = await c.env.DB
    .prepare(
      `SELECT COALESCE(SUM(count), 0) AS total,
              COALESCE(SUM(CASE WHEN day >= date('now','-6 days')  THEN count ELSE 0 END), 0) AS last7,
              COALESCE(SUM(CASE WHEN day >= date('now','-29 days') THEN count ELSE 0 END), 0) AS last30
       FROM property_views WHERE property_id = ?`,
    )
    .bind(id)
    .first<{ total: number; last7: number; last30: number }>();
  return c.json({ total: agg?.total ?? 0, last7: agg?.last7 ?? 0, last30: agg?.last30 ?? 0, series });
});

// Ámbito del user (mismo criterio que contracts.ts/expenses.ts). bookings no tiene sus
// propias columnas de dueño: se filtra vía la propiedad dueña (prefix 'p').
async function scope(c: any, prefix = ''): Promise<{ where: string; bind: unknown[]; agencyId: number | null }> {
  const p = prefix ? `${prefix}.` : '';
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (mine) return { where: `${p}agency_id = ?`, bind: [mine.agency.id], agencyId: mine.agency.id };
  return { where: `${p}owner_kind = 'particular' AND ${p}owner_user_id = ?`, bind: [c.var.user.id], agencyId: null };
}

// ── Calendario de movimientos (agencia, todas las propiedades) ──
// Solo alquileres CONFIRMADOS (kind='alquiler') — una 'reserva' tentativa no genera
// eventos acá. from_date = día de ingreso, to_date = día de desocupación: son dos
// eventos PUNTUALES, no un rango ocupado. Acotado a un mes (?month=YYYY-MM) para no
// traer el historial completo de la agencia — mismo criterio que expenses.ts (?month=).
properties.get('/bookings', async (c) => {
  const monthParam = str(c.req.query('month'), 7);
  const base = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : new Date().toISOString().slice(0, 7);
  const y = Number(base.slice(0, 4));
  const m = Number(base.slice(5, 7));
  const first = `${base}-01`;
  const last = `${base}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;

  const s = await scope(c, 'p');
  const res = await c.env.DB
    .prepare(
      `SELECT b.id, b.property_id, p.title AS property_title, b.from_date, b.to_date,
              b.guest_name, b.notes, b.kind, b.client_id, cl.name AS client_name, cl.phone AS client_phone
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       LEFT JOIN clients cl ON cl.id = b.client_id AND cl.agency_id = ?
       WHERE ${s.where} AND b.kind = 'alquiler'
         AND (b.from_date BETWEEN ? AND ? OR b.to_date BETWEEN ? AND ?)
       ORDER BY p.title, b.from_date LIMIT 2000`,
    )
    .bind(s.agencyId ?? -1, ...s.bind, first, last, first, last)
    .all();
  return c.json({ bookings: res.results });
});

// ── Reservas / bloqueos de fechas (temporario) ──
properties.get('/:id/bookings', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  // El JOIN de display va scopeado a la agencia de la propiedad: un client_id de otra
  // agencia no debe poder leerse por acá (ver lib/ownership.ts).
  const res = await c.env.DB
    .prepare(
      `SELECT b.id, b.from_date, b.to_date, b.guest_name, b.notes, b.kind, b.client_id,
              cl.name AS client_name, cl.phone AS client_phone
       FROM bookings b
       LEFT JOIN clients cl ON cl.id = b.client_id AND cl.agency_id = ?
       WHERE b.property_id = ? ORDER BY b.from_date`,
    )
    .bind(prop.agency_id ?? -1, id)
    .all();
  return c.json({ bookings: res.results });
});

properties.post('/:id/bookings', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  if (prop.status === 'vendida') return bad(c, 'Esta propiedad está vendida, no acepta nuevas reservas');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const from = str(body.from_date, 10);
  const to = str(body.to_date, 10);
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!from || !to || !re.test(from) || !re.test(to)) return bad(c, 'Fechas inválidas (YYYY-MM-DD)');
  if (from > to) return bad(c, 'La fecha de inicio es posterior a la de fin');
  const kind = str(body.kind, 20) || 'reserva';
  if (!BOOKING_KINDS.includes(kind)) return bad(c, 'kind inválido (reserva|alquiler)');
  const agencyId = (prop.agency_id as number | null) ?? null;
  const clientId = num(body.client_id);
  if (!(await clientInAgency(c.env.DB, agencyId, clientId))) return bad(c, 'Contacto inválido');
  // Medio-abierto [from, to): el día de salida de una reserva no cuenta como ocupado
  // (el huésped se va a la mañana, otra familia puede entrar esa misma tarde), así que
  // una reserva nueva puede arrancar el mismo día en que termina la anterior.
  const clash = await c.env.DB
    .prepare('SELECT id FROM bookings WHERE property_id = ? AND from_date < ? AND to_date > ? LIMIT 1')
    .bind(id, to, from)
    .first();
  if (clash) return bad(c, 'Esas fechas se superponen con una reserva existente');
  const row = await c.env.DB
    .prepare('INSERT INTO bookings (property_id, from_date, to_date, guest_name, notes, kind, client_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *')
    .bind(id, from, to, str(body.guest_name, 120), str(body.notes, 500), kind, clientId)
    .first();
  return c.json({ booking: row }, 201);
});

// Confirmar una reserva como alquiler efectivo (o revertir) sin recrear el rango, y/o
// asignarle el contacto del CRM (al confirmar el alquiler se pide quién lo alquila).
properties.patch('/:id/bookings/:bid', async (c) => {
  const id = num(c.req.param('id'));
  const bid = num(c.req.param('bid'));
  if (id == null || bid == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  if ('kind' in body) {
    const kind = str(body.kind, 20);
    if (!kind || !BOOKING_KINDS.includes(kind)) return bad(c, 'kind inválido (reserva|alquiler)');
    sets.push('kind = ?'); binds.push(kind);
  }
  if ('client_id' in body) {
    const clientId = num(body.client_id);
    if (!(await clientInAgency(c.env.DB, (prop.agency_id as number | null) ?? null, clientId))) return bad(c, 'Contacto inválido');
    sets.push('client_id = ?'); binds.push(clientId);
  }
  if (!sets.length) return bad(c, 'Nada para actualizar');
  const row = await c.env.DB
    .prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ? AND property_id = ? RETURNING *`)
    .bind(...binds, bid, id)
    .first();
  if (!row) return notFound(c, 'Reserva no encontrada');
  return c.json({ booking: row });
});

properties.delete('/:id/bookings/:bid', async (c) => {
  const id = num(c.req.param('id'));
  const bid = num(c.req.param('bid'));
  if (id == null || bid == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  await c.env.DB.prepare('DELETE FROM bookings WHERE id = ? AND property_id = ?').bind(bid, id).run();
  return c.json({ success: true });
});

// ── Precios por temporada (quincena) ──
// Planilla interna de tarifas para cotizar: una fila por (propiedad, mes). `price_month`
// vale para todo el mes; día/semana varían por quincena. Todo ARS, todo opcional. No
// gatea por suscripción (igual que bookings/media), solo por `loadManageable`.
const SEASON_FIELDS = [
  'price_month',
  'price_day_q1', 'price_week_q1', 'price_fortnight_q1',
  'price_day_q2', 'price_week_q2', 'price_fortnight_q2',
] as const;

properties.get('/:id/season-prices', async (c) => {
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  const res = await c.env.DB
    .prepare(`SELECT month, ${SEASON_FIELDS.join(', ')} FROM property_season_prices WHERE property_id = ? ORDER BY month`)
    .bind(id)
    .all();
  return c.json({ rates: res.results });
});

// Upsert de un mes. Si los 5 importes quedan vacíos, borra la fila.
properties.put('/:id/season-prices/:month', async (c) => {
  const id = num(c.req.param('id'));
  const month = num(c.req.param('month'));
  if (id == null) return bad(c, 'id inválido');
  if (month == null || month < 1 || month > 12) return bad(c, 'mes inválido (1-12)');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const vals = SEASON_FIELDS.map((k) => {
    const n = num(body[k]);
    return n != null && n >= 0 ? n : null;
  });
  if (vals.every((v) => v == null)) {
    await c.env.DB.prepare('DELETE FROM property_season_prices WHERE property_id = ? AND month = ?').bind(id, month).run();
    return c.json({ deleted: true, month });
  }
  await c.env.DB
    .prepare(
      `INSERT INTO property_season_prices (property_id, month, ${SEASON_FIELDS.join(', ')})
       VALUES (?, ?, ${SEASON_FIELDS.map(() => '?').join(', ')})
       ON CONFLICT(property_id, month) DO UPDATE SET
         ${SEASON_FIELDS.map((k) => `${k} = excluded.${k}`).join(', ')}, updated_at = datetime('now')`,
    )
    .bind(id, month, ...vals)
    .run();
  const rate = await c.env.DB
    .prepare(`SELECT month, ${SEASON_FIELDS.join(', ')} FROM property_season_prices WHERE property_id = ? AND month = ?`)
    .bind(id, month)
    .first();
  return c.json({ rate });
});

properties.delete('/:id/season-prices/:month', async (c) => {
  const id = num(c.req.param('id'));
  const month = num(c.req.param('month'));
  if (id == null || month == null) return bad(c, 'id inválido');
  const prop = await loadManageable(c.env.DB, c.var.user.id, id);
  if (!prop) return notFound(c, 'Propiedad no encontrada');
  await c.env.DB.prepare('DELETE FROM property_season_prices WHERE property_id = ? AND month = ?').bind(id, month).run();
  return c.json({ success: true });
});
