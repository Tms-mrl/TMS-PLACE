import type { Env } from './types';

// Alertas de búsquedas guardadas: el cron busca propiedades nuevas que matcheen
// cada búsqueda guardada (notify=1) para avisar por email al inquilino. El matching
// ya es propio; el envío es un placeholder — falta conectar un proveedor de mail
// (Resend, SES, Postmark, etc.) en sendEmail(). Hasta entonces, DORMANTE.

type SavedSearch = { id: number; user_id: number; query_json: string; last_notified_at: string | null; created_at: string };
type Match = { id: number; title: string; operation: string; price: number | null; currency: string; city: string | null };

/** TODO: conectar un proveedor de mail propio. Hoy no manda nada (siempre falla). */
async function sendEmail(_env: Env, _to: string, _subject: string, _body: string): Promise<void> {
  throw new Error('sendEmail: no hay proveedor de mail configurado');
}

/** Propiedades publicadas NUEVAS (desde `since`) que matchean los filtros guardados. */
async function matchesFor(db: D1Database, query: any, since: string): Promise<Match[]> {
  const where: string[] = ['published = 1', 'created_at > ?'];
  const binds: unknown[] = [since];
  if (query.op && ['venta', 'alquiler', 'temporario'].includes(query.op)) { where.push('operation = ?'); binds.push(query.op); }
  if (query.ciudad) { where.push('LOWER(city) LIKE ?'); binds.push(`%${String(query.ciudad).toLowerCase()}%`); }
  if (query.min != null) { where.push('price >= ?'); binds.push(query.min); }
  if (query.max != null) { where.push('price <= ?'); binds.push(query.max); }
  if (query.amb != null) { where.push('rooms >= ?'); binds.push(query.amb); }
  const res = await db
    .prepare(`SELECT id, title, operation, price, currency, city FROM properties WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 12`)
    .bind(...binds)
    .all<Match>();
  return res.results;
}

/** Corre el barrido de alertas. Devuelve cuántos emails mandó (0 mientras esté dormante). */
export async function runSavedSearchAlerts(env: Env): Promise<number> {
  const site = env.SITE_URL || 'http://localhost:8787';
  const searches = (await env.DB
    .prepare('SELECT id, user_id, query_json, last_notified_at, created_at FROM saved_searches WHERE notify = 1')
    .all<SavedSearch>()).results;
  let sent = 0;
  for (const s of searches) {
    const since = s.last_notified_at || s.created_at;
    let query: any = {};
    try { query = JSON.parse(s.query_json); } catch { /* búsqueda corrupta: la salteamos */ }
    const matches = await matchesFor(env.DB, query, since);
    // Avanzamos la marca aunque no haya matches (evita reprocesar todo cada corrida).
    await env.DB.prepare("UPDATE saved_searches SET last_notified_at = datetime('now') WHERE id = ?").bind(s.id).run();
    if (!matches.length) continue;
    const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(s.user_id).first<{ email: string }>();
    if (!user?.email || !user.email.includes('@')) continue;
    const list = matches
      .map((m) => `• ${m.title} — ${m.currency} ${m.price?.toLocaleString('es-AR') ?? 'Consultar'}${m.city ? ` (${m.city})` : ''}\n  ${site}/propiedad/${m.id}`)
      .join('\n\n');
    const subject = `🏡 ${matches.length} propiedad${matches.length === 1 ? '' : 'es'} nueva${matches.length === 1 ? '' : 's'} para tu búsqueda`;
    const body = `¡Hola! Aparecieron propiedades que matchean una búsqueda que guardaste:\n\n${list}\n\nVer más: ${site}/buscar`;
    try { await sendEmail(env, user.email, subject, body); sent++; } catch { /* dormante hasta conectar un proveedor de mail */ }
  }
  return sent;
}
