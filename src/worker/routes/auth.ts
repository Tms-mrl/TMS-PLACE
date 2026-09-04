import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import {
  clearAccessCookieHeader, clearCoopenCookieHeader, clearSessionCookieHeader, createSession,
  genToken, isSuperAdmin, readCookie, readSessionToken, resolveUser, deleteSession,
  sessionCookieHeader, ssoEnabled, upsertUser,
} from '../lib/auth';
import { getUserAgency } from '../lib/subscription';

// Login con Google (authorization code flow), manejado enteramente acá — sin
// depender de un proveedor de identidad externo. Sesión propia por cookie.
export const auth = new Hono<AppEnv>();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const STATE_COOKIE = 'oauth_state';

function callbackUrl(requestUrl: string): string {
  return `${new URL(requestUrl).origin}/api/auth/callback/google`;
}

// Para que el front sepa si el login está configurado (útil en dev/smoke tests).
auth.get('/config', (c) => {
  return c.json({ enabled: !!(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET) });
});

// Contrato del ecosistema (§3 del manual raíz): toda plataforma con SSO expone
// `{ authUrl, enabled }`. `enabled:false` en un deploy white-label de cliente, que
// no setea AUTH_URL y vive fuera de la cuenta única de Coopen.
auth.get('/coopen-config', (c) => {
  return c.json({ authUrl: c.env.AUTH_URL || null, enabled: ssoEnabled(c.env) });
});

// Manda al sign-in del IdP y vuelve acá. Solo existe si este deploy tiene SSO.
auth.get('/coopen', (c) => {
  if (!ssoEnabled(c.env)) return c.text('SSO no habilitado en este deploy', 404);
  const origin = new URL(c.req.url).origin;
  const returnTo = c.req.query('return_to') || '/app';
  const dest = returnTo.startsWith('/') ? `${origin}${returnTo}` : `${origin}/app`;
  return c.redirect(`${c.env.AUTH_URL}/auth/google/authorize?return_to=${encodeURIComponent(dest)}`);
});

// Redirect directo a Google (no requiere JS: un <a href> o un window.location alcanza).
auth.get('/google', (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) return c.text('Login no configurado (falta GOOGLE_CLIENT_ID)', 500);
  const returnToRaw = c.req.query('return_to') || '/app';
  // Solo permitimos paths propios como destino (evita open redirect).
  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : '/app';
  const state = genToken();
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl(c.req.url),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  // state + return_to viajan en una cookie corta (HttpOnly); el callback los valida.
  c.header('Set-Cookie', `${STATE_COOKIE}=${state}:${encodeURIComponent(returnTo)}; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax`);
  return c.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

auth.get('/callback/google', async (c) => {
  const saved = readCookie(c.req.raw, STATE_COOKIE);
  c.header('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`);
  const [savedState, returnToEnc] = (saved || '').split(':');
  const returnTo = returnToEnc ? decodeURIComponent(returnToEnc) : '/app';

  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code || !state || !savedState || state !== savedState) {
    console.error('login_error=state', { hasCode: !!code, hasState: !!state, hasSavedCookie: !!saved });
    return c.redirect('/?login_error=state');
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID!,
      client_secret: c.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl(c.req.url),
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    console.error('login_error=token', tokenRes.status, await tokenRes.text());
    return c.redirect('/?login_error=token');
  }
  const tokens = (await tokenRes.json()) as { access_token: string };

  const infoRes = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!infoRes.ok) {
    console.error('login_error=userinfo', infoRes.status, await infoRes.text());
    return c.redirect('/?login_error=userinfo');
  }
  const info = (await infoRes.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string };
  if (!info.email || info.email_verified === false) {
    console.error('login_error=email', info);
    return c.redirect('/?login_error=email');
  }

  const user = await upsertUser(c.env.DB, `google:${info.sub}`, info.email, info.name ?? null);
  const token = await createSession(c.env.DB, user.id);
  c.header('Set-Cookie', sessionCookieHeader(token));
  return c.redirect(returnTo);
});

auth.get('/me', async (c) => {
  const user = await resolveUser(c.env, c.req.raw);
  if (!user) return c.json({ authed: false });

  const profile = await c.env.DB
    .prepare('SELECT is_owner, is_tenant, onboarded FROM places_profiles WHERE user_id = ?')
    .bind(user.id)
    .first<{ is_owner: number; is_tenant: number; onboarded: number }>();
  const agency = await getUserAgency(c.env.DB, user.id);

  return c.json({
    authed: true,
    user: {
      email: user.email,
      name: user.name,
      isSuperAdmin: isSuperAdmin(c.env, user),
      roles: {
        owner: !!profile?.is_owner,
        tenant: !!profile?.is_tenant,
        agency: agency ? { id: agency.agency.id, name: agency.agency.name, role: agency.role } : null,
      },
      onboarded: !!profile?.onboarded,
    },
  });
});

// Cierra los TRES caminos de sesión. Si falta alguno, el usuario "no se puede desloguear":
// borra su cookie local pero `resolveUser` lo vuelve a resolver por otra vía en el
// request siguiente (pasó con el SSO al sumarlo como cuarto camino).
auth.post('/logout', async (c) => {
  // 1. Sesión propia (fila en `sessions` + cookie).
  const token = readSessionToken(c.req.raw);
  if (token) await deleteSession(c.env.DB, token);
  c.header('Set-Cookie', clearSessionCookieHeader());

  // 2. Link de acceso de agencia.
  c.header('Set-Cookie', clearAccessCookieHeader(), { append: true });

  // 3. SSO del ecosistema: revocar en el IdP server-to-server y borrar SU cookie.
  //    NO navegar el browser a `auth/api/logout`: esa navegación GET con cookie cae en
  //    el 403 del WAF (fix del ecosistema ya aplicado en Portal/Driver/Finance).
  //    La revocación es best-effort — la cookie se borra igual.
  if (ssoEnabled(c.env)) {
    const cookie = c.req.header('Cookie') || '';
    if (cookie.includes('coopen_session=')) {
      try {
        await fetch(`${c.env.AUTH_URL}/api/logout`, { method: 'POST', headers: { Cookie: cookie } });
      } catch {
        /* best-effort */
      }
    }
    c.header('Set-Cookie', clearCoopenCookieHeader(), { append: true });
  }

  return c.json({ success: true });
});
