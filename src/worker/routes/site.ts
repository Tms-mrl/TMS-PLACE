import { Hono, type Context } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, forbidden, notFound, num, str } from '../lib/http';
import { getBrandLogoKey, getBrandName, invalidateBrand, mediaUrl } from '../lib/layout';
import { isSuperAdmin, requireUser } from '../lib/auth';
import { getUserAgency } from '../lib/subscription';

// Marca del sitio (white-label): 1 deploy = 1 cliente, editable en vivo desde
// Configuración por el admin/manager de la agencia. GET es público (landing/login
// la necesitan antes de loguearse); PUT exige sesión + rol, aplicado a nivel de ruta
// porque este archivo se monta antes del requireUser global (ver index.ts).
export const site = new Hono<AppEnv>();

site.get('/', async (c) => {
  const logoKey = await getBrandLogoKey(c.env.DB);
  return c.json({
    brandName: await getBrandName(c.env.DB),
    // URL lista para usar (null si la inmobiliaria no cargó logo): el cliente no tiene
    // por qué saber cómo se arma una key de R2.
    logoUrl: logoKey ? mediaUrl(logoKey) : null,
  });
});

site.put('/', requireUser, async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  const allowed = (mine && ['admin', 'manager'].includes(mine.role)) || isSuperAdmin(c.env, c.var.user);
  if (!allowed) return forbidden(c, 'Solo el admin de la inmobiliaria');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  const brandName = str(body.brandName, 60);
  if (!('brandName' in body)) return bad(c, 'Nada para actualizar');
  if (!brandName) return bad(c, 'Nombre vacío');

  await c.env.DB
    .prepare(
      `INSERT INTO site_settings (id, brand_name, updated_at)
       VALUES (1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET brand_name = excluded.brand_name, updated_at = datetime('now')`,
    )
    .bind(brandName)
    .run();
  invalidateBrand(); // el SSR cachea la marca en memoria

  const s = await c.env.DB
    .prepare('SELECT brand_name FROM site_settings WHERE id = 1')
    .first<{ brand_name: string | null }>();
  return c.json({ brandName: s?.brand_name ?? '' });
});

// ── Testimonios (prueba social del landing) ───────────────────────────────────
// Los carga el admin/manager de la inmobiliaria. **Nunca se generan de ejemplo**: sin
// testimonios cargados el landing no muestra la sección, que es preferible a inventar
// una reseña — justamente lo que destruiría la confianza que la sección busca dar.

async function requireAgencyAdmin(c: Context<AppEnv>) {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine || !['admin', 'manager'].includes(mine.role)) return null;
  return mine;
}

site.get('/testimonials', requireUser, async (c) => {
  const mine = await requireAgencyAdmin(c);
  if (!mine) return forbidden(c, 'Solo el admin de la inmobiliaria');
  const res = await c.env.DB
    .prepare('SELECT id, author, role, quote, published, sort FROM testimonials WHERE agency_id = ? ORDER BY sort, id')
    .bind(mine.agency.id)
    .all();
  return c.json({ testimonials: res.results });
});

site.post('/testimonials', requireUser, async (c) => {
  const mine = await requireAgencyAdmin(c);
  if (!mine) return forbidden(c, 'Solo el admin de la inmobiliaria');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const author = str(body.author, 80);
  const quote = str(body.quote, 400);
  if (!author) return bad(c, 'Falta quién lo dijo');
  if (!quote) return bad(c, 'Falta el testimonio');
  const row = await c.env.DB
    .prepare('INSERT INTO testimonials (agency_id, author, role, quote, sort) VALUES (?, ?, ?, ?, ?) RETURNING *')
    .bind(mine.agency.id, author, str(body.role, 80), quote, num(body.sort) ?? 0)
    .first();
  return c.json({ testimonial: row }, 201);
});

site.patch('/testimonials/:id', requireUser, async (c) => {
  const mine = await requireAgencyAdmin(c);
  if (!mine) return forbidden(c, 'Solo el admin de la inmobiliaria');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!('published' in body)) return bad(c, 'Nada para actualizar');
  const r = await c.env.DB
    .prepare('UPDATE testimonials SET published = ? WHERE id = ? AND agency_id = ?')
    .bind(body.published ? 1 : 0, id, mine.agency.id)
    .run();
  if (!r.meta.changes) return notFound(c, 'Testimonio no encontrado');
  return c.json({ ok: true });
});

site.delete('/testimonials/:id', requireUser, async (c) => {
  const mine = await requireAgencyAdmin(c);
  if (!mine) return forbidden(c, 'Solo el admin de la inmobiliaria');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const r = await c.env.DB.prepare('DELETE FROM testimonials WHERE id = ? AND agency_id = ?').bind(id, mine.agency.id).run();
  if (!r.meta.changes) return notFound(c, 'Testimonio no encontrado');
  return c.json({ ok: true });
});

/**
 * Testimonios publicados para el SSR del landing (1 deploy = 1 inmobiliaria, mismo
 * criterio que `resolveSiteWhatsapp`).
 *
 * **Falla blando a propósito**: si la tabla todavía no existe en ESA base (cada deploy
 * white-label tiene la suya y se migran de a una), devuelve vacío y el landing sale
 * completo sin la sección, en vez de tirar 500 la home entera por una feature de adorno.
 */
export async function getPublishedTestimonials(db: D1Database, limit = 6) {
  try {
    const res = await db
      .prepare('SELECT author, role, quote FROM testimonials WHERE published = 1 ORDER BY sort, id LIMIT ?')
      .bind(limit)
      .all<{ author: string; role: string | null; quote: string }>();
    return res.results ?? [];
  } catch {
    return [];
  }
}
