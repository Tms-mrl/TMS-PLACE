import { Hono } from 'hono';
import type { AppEnv, Env } from './lib/types';
import { requireSuperAdmin, requireUser } from './lib/auth';
import { num, serverError } from './lib/http';
import { resolvePropertyWhatsapp, waLink } from './lib/whatsapp';
import { getBrandName } from './lib/layout';
import { auth } from './routes/auth';
import { site } from './routes/site';
import { publicApi, publicSite } from './routes/public';
import { profile } from './routes/profile';
import { agencies } from './routes/agencies';
import { properties } from './routes/properties';
import { clients } from './routes/clients';
import { deals } from './routes/deals';
import { contracts } from './routes/contracts';
import { expenses } from './routes/expenses';
import { favorites, savedSearches } from './routes/tenant';
import { admin } from './routes/admin';
import { runSavedSearchAlerts } from './lib/alerts';

// El Worker corre PRIMERO en toda request (run_worker_first=true en wrangler.toml):
// - /api/*         → API JSON (pública o gateada por sesión SSO)
// - /, /buscar, /propiedad/:id → SSR del marketplace (indexable)
// - resto (SPA de gestión /app/*, estáticos) → assets binding con fallback SPA
const app = new Hono<AppEnv>();

// ── API pública (sin sesión): auth + búsqueda del marketplace ──
app.route('/api/auth', auth);
app.route('/api/site', site); // GET público (marca del sitio) · PUT protegido a nivel de ruta
app.route('/api/public', publicApi); // /api/public/search · /api/public/property/:id

// ── API privada (sesión SSO, modelo C) ──
app.use('/api/*', requireUser);
app.route('/api/profile', profile);
app.route('/api/agencies', agencies);
app.route('/api/properties', properties);
app.route('/api/clients', clients);
app.route('/api/deals', deals);
app.route('/api/contracts', contracts);
app.route('/api/expenses', expenses);
app.route('/api/favorites', favorites);
app.route('/api/saved-searches', savedSearches);
app.use('/api/admin/*', requireSuperAdmin); // además de requireUser (ya aplicado arriba)
app.route('/api/admin', admin);

app.onError((err, c) => serverError(c, err));

// Un /api/* que no matcheó ninguna ruta → JSON 404 (no caer al SPA de assets).
app.all('/api/*', (c) => c.json({ error: 'No encontrado', code: 'NOT_FOUND' }, 404));

// ── Fotos públicas desde R2 (GET /media/<key>) ──
// Se cachean en el edge (Cache API): las fotos son inmutables —una edición sube una key
// nueva—, así que a partir del segundo visitante la imagen no vuelve a bajar de R2.
app.get('/media/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ''));
  if (!key) return c.notFound();
  const cache = caches.default;
  const hit = await cache.match(c.req.raw);
  if (hit) return hit;
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=86400');
  headers.set('etag', obj.httpEtag);
  const res = new Response(obj.body, { headers });
  c.executionCtx.waitUntil(cache.put(c.req.raw, res.clone()));
  return res;
});

// ── Consulta por WhatsApp: registra la consulta y redirige a wa.me (público) ──
app.get('/wa/:id', async (c) => {
  const id = num(c.req.param('id'));
  const prop = id == null ? null : await c.env.DB
    .prepare('SELECT id, title, agency_id, owner_user_id, published FROM properties WHERE id = ?')
    .bind(id)
    .first<{ id: number; title: string; agency_id: number | null; owner_user_id: number | null; published: number }>();
  if (!prop || !prop.published) return c.redirect('/');
  const wa = await resolvePropertyWhatsapp(c.env.DB, prop);
  if (!wa) return c.redirect(`/propiedad/${prop.id}`);
  try {
    await c.env.DB
      .prepare("INSERT INTO inquiries (property_id, message, status, source) VALUES (?, 'Consulta por WhatsApp', 'nueva', 'whatsapp')")
      .bind(prop.id)
      .run();
  } catch { /* el registro es best-effort; no bloquea el redirect */ }
  const origin = new URL(c.req.url).origin;
  const brandName = await getBrandName(c.env.DB);
  const text = `¡Hola! Vi "${prop.title}" en ${brandName} (${origin}/propiedad/${prop.id}) y quería hacer una consulta.`;
  return c.redirect(waLink(wa, text));
});

// ── Link de acceso de inmobiliaria (magic link): valida token, setea cookie, entra al panel ──
app.get('/i/:token', async (c) => {
  const token = c.req.param('token');
  const row = await c.env.DB
    .prepare('SELECT id FROM agency_access WHERE token = ? AND active = 1')
    .bind(token)
    .first();
  if (!row) return c.redirect('/?acceso=invalido');
  // Cookie host-only, larga (1 año). El token en DB es la credencial; revocable.
  c.header('Set-Cookie', `places_access=${encodeURIComponent(token)}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`);
  return c.redirect('/app');
});

// ── SEO: robots + sitemap ──
app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin;
  return new Response(`User-agent: *\nAllow: /\nDisallow: /app\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
});
app.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin;
  const rows = (await c.env.DB.prepare('SELECT id FROM properties WHERE published = 1 ORDER BY id DESC LIMIT 5000').all<{ id: number }>()).results;
  const urls = [`${origin}/`, `${origin}/buscar`, ...rows.map((r) => `${origin}/propiedad/${r.id}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
});

// ── SSR público del marketplace (HTML) ──
app.route('/', publicSite);

// ── Todo lo demás → assets (SPA de gestión /app/* + estáticos, con fallback SPA) ──
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

// Cron (ver [triggers] en wrangler.toml): alerta de búsquedas guardadas por email.
// Dormante hasta que se setee INTERNAL_API_SECRET (runSavedSearchAlerts devuelve 0).
async function scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  ctx.waitUntil(runSavedSearchAlerts(env).catch(() => {}));
}

export default { fetch: app.fetch, scheduled };
