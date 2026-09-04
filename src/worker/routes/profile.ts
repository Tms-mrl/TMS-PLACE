import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, str } from '../lib/http';

// Perfil del user dentro de Places: qué roles activó (propietario / inquilino) +
// su WhatsApp de consultas. La pertenencia a inmobiliaria se gestiona en /api/agencies.
export const profile = new Hono<AppEnv>();

profile.get('/', async (c) => {
  const row = await c.env.DB
    .prepare('SELECT is_owner, is_tenant, onboarded, whatsapp FROM places_profiles WHERE user_id = ?')
    .bind(c.var.user.id)
    .first<{ is_owner: number; is_tenant: number; onboarded: number; whatsapp: string | null }>();
  return c.json({
    owner: !!row?.is_owner,
    tenant: !!row?.is_tenant,
    onboarded: !!row?.onboarded,
    whatsapp: row?.whatsapp ?? null,
  });
});

// Nombre del user (Configuración). El email no es editable: viene de Google.
profile.put('/name', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(body.name, 120);
  if (!name) return bad(c, 'Nombre vacío');
  await c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, c.var.user.id).run();
  return c.json({ name });
});

// WhatsApp del propietario particular (para el botón de consulta en sus avisos).
profile.put('/whatsapp', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const wa = str(body.whatsapp, 30);
  await c.env.DB
    .prepare(
      `INSERT INTO places_profiles (user_id, whatsapp, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET whatsapp = ?, updated_at = datetime('now')`,
    )
    .bind(c.var.user.id, wa, wa)
    .run();
  return c.json({ whatsapp: wa });
});

// Onboarding: el user elige rol(es). No es excluyente (puede ser ambos).
profile.put('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const owner = body.owner ? 1 : 0;
  const tenant = body.tenant ? 1 : 0;
  await c.env.DB
    .prepare(
      `INSERT INTO places_profiles (user_id, is_owner, is_tenant, onboarded, updated_at)
       VALUES (?, ?, ?, 1, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET is_owner = ?, is_tenant = ?, onboarded = 1, updated_at = datetime('now')`,
    )
    .bind(c.var.user.id, owner, tenant, owner, tenant)
    .run();
  return c.json({ owner: !!owner, tenant: !!tenant, onboarded: true });
});
