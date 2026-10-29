import type { Context, Next } from 'hono';
import type { AppEnv } from './types';
import { getUserAgency } from './subscription';

// Registro de actividad (apartado "Registro"): middleware que anota cada cambio hecho por
// un usuario (POST/PATCH/PUT/DELETE en /api/*) con quién, qué y —en ediciones— qué campos
// cambiaron (antes → después). En un borrado guarda además una copia de la fila (y de lo
// que cae en cascada) para poder reconstruirla. Nunca rompe el request: si el log falla,
// el cambio igual se hizo.

type Target = { table: string; where: string; binds: unknown[]; noun: string; propertyId?: number };

const NOUN: Record<string, string> = {
  properties: 'propiedad', clients: 'contacto', deals: 'operación', contracts: 'contrato', expenses: 'gasto',
  bookings: 'reserva', property_media: 'foto', property_season_prices: 'tarifa de temporada', receipts: 'recibo',
  agency_members: 'miembro del equipo',
};

function targetOf(path: string): Target | null {
  const s = path.replace(/^\/api\//, '').split('/').filter(Boolean);
  const n = (i: number) => (s[i] && /^\d+$/.test(s[i]!) ? Number(s[i]) : null);
  const head = s[0];
  if (head && ['properties', 'clients', 'deals', 'contracts', 'expenses'].includes(head)) {
    if (head === 'contracts' && s[1] === 'receipts' && n(2) != null) return { table: 'receipts', where: 'id = ?', binds: [n(2)], noun: NOUN.receipts! };
    const id = n(1);
    if (id == null) return null;
    if (head === 'properties' && s[2] === 'bookings' && n(3) != null) return { table: 'bookings', where: 'id = ?', binds: [n(3)], noun: NOUN.bookings!, propertyId: id };
    if (head === 'properties' && s[2] === 'media' && n(3) != null) return { table: 'property_media', where: 'id = ?', binds: [n(3)], noun: NOUN.property_media!, propertyId: id };
    if (head === 'properties' && s[2] === 'season-prices' && n(3) != null) return { table: 'property_season_prices', where: 'property_id = ? AND month = ?', binds: [id, n(3)], noun: NOUN.property_season_prices!, propertyId: id };
    // Alta bajo una propiedad (reserva, foto…): no hay fila previa, el aviso nombra a la propiedad.
    if (head === 'properties' && s[2] === 'bookings') return { table: 'bookings', where: '1 = 0', binds: [], noun: NOUN.bookings!, propertyId: id };
    if (head === 'properties' && s[2] === 'media') return { table: 'property_media', where: '1 = 0', binds: [], noun: NOUN.property_media!, propertyId: id };
    return { table: head, where: 'id = ?', binds: [id], noun: NOUN[head]! };
  }
  if (head === 'agencies' && s[1] === 'members' && n(2) != null) return { table: 'agency_members', where: 'user_id = ?', binds: [n(2)], noun: NOUN.agency_members! };
  return null;
}

/** Acciones que no se anotan: lecturas, sincronización de correo y marcas de leído. */
function skip(method: string, path: string): boolean {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
  if (path.startsWith('/api/activity') || path.startsWith('/api/favorites') || path.startsWith('/api/saved-searches')) return true;
  if (path.startsWith('/api/correo') && !/\/(reply|compose|disconnect)$/.test(path)) return true;
  return false;
}

const cut = (v: unknown, n = 300) => (typeof v === 'string' && v.length > n ? v.slice(0, n) + '…' : v);
const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '');

function describe(method: string, path: string, noun: string | undefined, label: string | null): { action: string; summary: string } {
  const who = label ? ` «${label}»` : '';
  if (path.endsWith('/reply')) return { action: 'other', summary: 'Respondió un correo' };
  if (path.endsWith('/compose')) return { action: 'other', summary: 'Envió un correo nuevo' };
  if (path.endsWith('/disconnect')) return { action: 'other', summary: 'Desconectó la cuenta de Gmail' };
  if (path.endsWith('/restore')) return { action: 'other', summary: 'Restauró una propiedad de la papelera' };
  if (path.includes('/properties/trash/') && method === 'DELETE') return { action: 'delete', summary: 'Eliminó definitivamente una propiedad de la papelera' };
  if (path.endsWith('/copy')) return { action: 'create', summary: `Duplicó propiedad${who}` };
  if (path.endsWith('/import')) return { action: 'create', summary: 'Importó una propiedad desde un link' };
  const n = noun || 'registro';
  if (method === 'POST') return { action: 'create', summary: `Creó ${n}${who}` };
  if (method === 'DELETE') return { action: 'delete', summary: noun === NOUN.properties ? `Envió a la papelera propiedad${who}` : `Eliminó ${n}${who}` };
  return { action: 'update', summary: `Editó ${n}${who}` };
}

export async function activityLog(c: Context<AppEnv>, next: Next) {
  const method = c.req.method;
  const path = c.req.path;
  if (skip(method, path)) return next();

  let body: Record<string, unknown> | null = null;
  let before: Record<string, unknown> | null = null;
  let snapshot: Record<string, unknown> | null = null;
  let parentTitle: string | null = null;
  const target = targetOf(path);
  try {
    if ((c.req.header('content-type') || '').includes('application/json') && !path.startsWith('/api/correo')) {
      const j = await c.req.raw.clone().json().catch(() => null);
      if (j && typeof j === 'object' && !Array.isArray(j)) body = j as Record<string, unknown>;
    }
    if (target?.propertyId != null) {
      parentTitle = (await c.env.DB.prepare('SELECT title FROM properties WHERE id = ?').bind(target.propertyId).first<{ title: string }>())?.title ?? null;
    }
    if (target && method !== 'POST') {
      before = await c.env.DB.prepare(`SELECT * FROM ${target.table} WHERE ${target.where}`).bind(...target.binds).first<Record<string, unknown>>();
      // Las propiedades ya guardan su copia completa en la papelera: no se duplica acá.
      if (method === 'DELETE' && before && target.table !== 'properties') snapshot = { [target.table]: before };
    }
  } catch { /* el registro es best-effort */ }

  await next();
  if (c.res.status >= 400) return;

  try {
    const user = c.var.user;
    const mine = await getUserAgency(c.env.DB, user.id);
    const own = target?.table === 'properties' || target?.propertyId == null;
    const raw = (own ? (before?.title ?? before?.name ?? body?.title ?? body?.name) : null) ?? parentTitle;
    const label = raw ? String(raw).slice(0, 120) : null;
    const { action, summary } = describe(method, path, target?.noun, own ? label : null);
    const where = !own && label ? ` (en «${label}»)` : '';

    let changes: Record<string, [unknown, unknown]> | null = null;
    if (action === 'update' && before && body) {
      for (const k of Object.keys(body)) {
        if (k in before && !same(before[k], body[k])) (changes ??= {})[k] = [cut(before[k]), cut(body[k])];
      }
    }
    const entity = target?.table ?? path.replace(/^\/api\//, '').split('/')[0] ?? null;
    const entityId = target && target.binds.length === 1 ? (target.binds[0] as number) : null;
    const createBody = action === 'create' && body
      ? JSON.stringify(Object.fromEntries(Object.entries(body).map(([k, v]) => [k, cut(v, 500)]))).slice(0, 4000)
      : null;
    await c.env.DB
      .prepare(
        `INSERT INTO activity_log (agency_id, user_id, user_label, method, path, action, entity, entity_id, summary, changes, body, snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        mine?.agency.id ?? null, user.id, user.name || user.email, method, path, action, entity, entityId,
        summary + where,
        changes ? JSON.stringify(changes) : null,
        createBody,
        snapshot ? JSON.stringify(snapshot).slice(0, 60000) : null,
      )
      .run();
  } catch { /* idem */ }
}
