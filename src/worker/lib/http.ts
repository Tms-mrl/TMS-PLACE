import type { Context } from 'hono';

/** 400 con detail legible (validación de inputs). */
export function bad(c: Context, detail: string) {
  return c.json({ error: detail, code: 'BAD_REQUEST' }, 400);
}

/** 402: trial vencido / suscripción bloqueada (gate de la gestión). */
export function paymentRequired(c: Context, detail: string) {
  return c.json({ error: detail, code: 'SUBSCRIPTION_BLOCKED' }, 402);
}

/** 403: sin permiso (no es super-admin, no pertenece a la agencia, etc). */
export function forbidden(c: Context, detail: string) {
  return c.json({ error: detail, code: 'FORBIDDEN' }, 403);
}

/** 404 JSON. */
export function notFound(c: Context, detail = 'No encontrado') {
  return c.json({ error: detail, code: 'NOT_FOUND' }, 404);
}

/** Convención del ecosistema: 500 con el detail real en el body (debug remoto). */
export function serverError(c: Context, err: unknown) {
  const detail = err instanceof Error ? err.message : String(err);
  return c.json({ error: 'Error interno', detail }, 500);
}

/** Número finito o null (los inputs llegan como unknown desde JSON/query). */
export function num(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

/** String no vacío y recortado, o null. */
export function str(v: unknown, max = 2000): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}
