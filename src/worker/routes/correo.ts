import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { bad, forbidden, notFound, num, str } from '../lib/http';
import { getUserAgency } from '../lib/subscription';
import { genToken, readCookie } from '../lib/auth';
import { branchInAgency } from '../lib/ownership';
import {
  GMAIL_SCOPES, GmailNeedsReconnect, accountNeedsReconnect, disconnectMailAccount,
  gmailCallbackUrl, getAttachment, getMailAccount, getThread, parseMessage,
  saveMailAccount, sendReply, syncGmail, type MailThreadRow,
} from '../lib/gmail';

// Apartado "Correo": bandeja de equipo sobre la casilla elmuellepropiedades@gmail.com (API de
// Gmail, conectada una vez). Ver docs/ideas.md "Apartado Correo" y el plan de
// implementación. El OAuth de acá es un client de Google Cloud APARTE del login
// (src/worker/routes/auth.ts) — mismo patrón (authorization code, state en cookie),
// pero con access_type=offline + prompt=consent para obtener un refresh token.
export const correo = new Hono<AppEnv>();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_PROFILE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
const STATE_COOKIE = 'gmail_oauth_state';
const STATUSES = ['nuevo', 'pendiente', 'respondido', 'archivado'];

function threadSelect(extraWhere = ''): string {
  return `SELECT t.*, b.name AS branch_name FROM mail_threads t LEFT JOIN branches b ON b.id = t.branch_id ${extraWhere}`;
}

// ── Estado de la conexión (para el panel + el badge de pendientes) ─────────────────
correo.get('/status', async (c) => {
  const account = await getMailAccount(c.env);
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  let pendingForMe = 0;
  if (mine?.branchId != null) {
    const row = await c.env.DB
      .prepare("SELECT COUNT(*) AS n FROM mail_threads WHERE status = 'pendiente' AND branch_id = ?")
      .bind(mine.branchId)
      .first<{ n: number }>();
    pendingForMe = row?.n || 0;
  }
  return c.json({
    connected: !!account,
    email: account?.email ?? null,
    lastSyncAt: account?.last_sync_at ?? null,
    lastError: account?.last_error ?? null,
    needsReconnect: accountNeedsReconnect(account),
    pendingForMe,
  });
});

// ── Conectar / reconectar la casilla (admin o manager) ──────────────────────────
correo.get('/connect', async (c) => {
  if (!c.env.GMAIL_CLIENT_ID) return bad(c, 'Falta configurar GMAIL_CLIENT_ID');
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine || !['admin', 'manager'].includes(mine.role)) return forbidden(c, 'Solo admin/manager pueden conectar la casilla');
  const returnToRaw = c.req.query('return_to') || '/app';
  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : '/app';
  const state = genToken();
  const params = new URLSearchParams({
    client_id: c.env.GMAIL_CLIENT_ID,
    redirect_uri: gmailCallbackUrl(c.req.url),
    response_type: 'code',
    scope: GMAIL_SCOPES,
    state,
    access_type: 'offline', // pedimos refresh token: todo el equipo responde por esta conexión
    prompt: 'consent',      // fuerza a que Google re-emita el refresh token siempre
    login_hint: 'elmuellepropiedades@gmail.com',
  });
  c.header('Set-Cookie', `${STATE_COOKIE}=${state}:${encodeURIComponent(returnTo)}; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax`);
  return c.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

correo.get('/callback', async (c) => {
  const saved = readCookie(c.req.raw, STATE_COOKIE);
  c.header('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`);
  const [savedState, returnToEnc] = (saved || '').split(':');
  const returnTo = returnToEnc ? decodeURIComponent(returnToEnc) : '/app';

  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code || !state || !savedState || state !== savedState) return c.redirect(`${returnTo}?correo_error=state`);

  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine || !['admin', 'manager'].includes(mine.role)) return c.redirect(`${returnTo}?correo_error=forbidden`);

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GMAIL_CLIENT_ID || '',
      client_secret: c.env.GMAIL_CLIENT_SECRET || '',
      redirect_uri: gmailCallbackUrl(c.req.url),
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    console.error('correo callback: token exchange', tokenRes.status, await tokenRes.text().catch(() => ''));
    return c.redirect(`${returnTo}?correo_error=token`);
  }
  const tokens = (await tokenRes.json()) as { access_token: string; refresh_token?: string; scope?: string };
  if (!tokens.refresh_token) {
    // No debería pasar (mandamos prompt=consent), salvo revocación manual rara.
    console.error('correo callback: Google no devolvió refresh_token');
    return c.redirect(`${returnTo}?correo_error=no_refresh_token`);
  }

  const profileRes = await fetch(GMAIL_PROFILE_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileRes.ok) return c.redirect(`${returnTo}?correo_error=profile`);
  const profile = (await profileRes.json()) as { emailAddress: string; historyId: string };

  await saveMailAccount(c.env, {
    email: profile.emailAddress,
    refreshToken: tokens.refresh_token,
    scope: tokens.scope || GMAIL_SCOPES,
    connectedBy: c.var.user.id,
    historyId: profile.historyId,
  });
  // Primer sync en background: sin esto, recién conectada la casilla queda vacía hasta
  // el próximo tick del cron de 1 min (que además puede tardar en "prender" la primera
  // vez que se agrega un trigger nuevo).
  c.executionCtx.waitUntil(syncGmail(c.env).catch((e) => console.error('correo: sync post-connect', e)));
  return c.redirect(returnTo);
});

// Sync manual "a demanda": mismo `syncGmail` que corre desde el cron de 1 min, pero
// disparado por el usuario (botón "Actualizar" del panel) — no hace falta esperar al
// próximo tick, y sirve de red si el cron tarda en arrancar o está caído.
correo.post('/sync', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return forbidden(c, 'Sin acceso');
  try {
    await syncGmail(c.env);
  } catch (e) {
    if (e instanceof GmailNeedsReconnect) return c.json({ error: e.message, code: 'GMAIL_RECONNECT' }, 409);
    return c.json({ error: 'No se pudo sincronizar', detail: e instanceof Error ? e.message : String(e) }, 502);
  }
  return c.json({ success: true });
});

correo.post('/disconnect', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine || mine.role !== 'admin') return forbidden(c, 'Solo el admin puede desconectar la casilla');
  await disconnectMailAccount(c.env);
  return c.json({ success: true });
});

// ── Hilos: lista, detalle, asignación, respuesta ────────────────────────────────
// Bandeja abierta (v0, 1 sola agencia en este deploy): cualquiera del equipo ve todos
// los hilos y puede asignar sucursal + estado. `getUserAgency` solo gatea "sos del equipo".

correo.get('/threads', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return c.json({ threads: [] });
  const status = c.req.query('status');
  const branch = num(c.req.query('branch'));
  const q = str(c.req.query('q'), 200);
  const where: string[] = [];
  const binds: unknown[] = [];
  if (status && status !== '_all') { where.push('t.status = ?'); binds.push(status); }
  if (branch != null) { where.push('t.branch_id = ?'); binds.push(branch); }
  if (q) {
    where.push('(t.subject LIKE ? OR t.from_addr LIKE ? OR t.from_name LIKE ? OR t.snippet LIKE ?)');
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  const sql = `${threadSelect(where.length ? `WHERE ${where.join(' AND ')}` : '')} ORDER BY t.received_at DESC LIMIT 300`;
  const res = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({ threads: res.results });
});

correo.get('/threads/:id', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return forbidden(c, 'Sin acceso');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const row = await c.env.DB.prepare(threadSelect('WHERE t.id = ?')).bind(id).first<MailThreadRow & { branch_name: string | null }>();
  if (!row) return notFound(c, 'Hilo no encontrado');
  try {
    const thread = await getThread(c.env, row.gmail_thread_id, 'full');
    const messages = (thread.messages || []).map(parseMessage);
    return c.json({ thread: row, messages });
  } catch (e) {
    if (e instanceof GmailNeedsReconnect) return c.json({ error: e.message, code: 'GMAIL_RECONNECT' }, 409);
    return c.json({ error: 'No se pudo traer el hilo de Gmail', detail: e instanceof Error ? e.message : String(e) }, 502);
  }
});

correo.get('/threads/:id/attachments/:mid/:aid', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return forbidden(c, 'Sin acceso');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const exists = await c.env.DB.prepare('SELECT id FROM mail_threads WHERE id = ?').bind(id).first();
  if (!exists) return notFound(c, 'Hilo no encontrado');
  try {
    const { bytes } = await getAttachment(c.env, c.req.param('mid'), c.req.param('aid'));
    return new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } });
  } catch (e) {
    if (e instanceof GmailNeedsReconnect) return c.json({ error: e.message, code: 'GMAIL_RECONNECT' }, 409);
    return c.json({ error: 'No se pudo bajar el adjunto' }, 502);
  }
});

correo.patch('/threads/:id', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return forbidden(c, 'Sin acceso');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const binds: unknown[] = [];
  if ('branch_id' in body) {
    const branchId = num(body.branch_id);
    if (!(await branchInAgency(c.env.DB, mine.agency.id, branchId))) return bad(c, 'Sucursal inválida');
    sets.push('branch_id = ?', 'assigned_by = ?', "assigned_at = datetime('now')");
    binds.push(branchId, c.var.user.id);
  }
  if ('status' in body) {
    const status = String(body.status);
    if (!STATUSES.includes(status)) return bad(c, 'status inválido');
    sets.push('status = ?');
    binds.push(status);
  }
  if (!sets.length) return bad(c, 'Nada para actualizar');
  sets.push("updated_at = datetime('now')");
  binds.push(id);
  const r = await c.env.DB.prepare(`UPDATE mail_threads SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
  if (!r.meta.changes) return notFound(c, 'Hilo no encontrado');
  const updated = await c.env.DB.prepare(threadSelect('WHERE t.id = ?')).bind(id).first();
  return c.json({ thread: updated });
});

// El body ya viene armado del cliente (texto de la respuesta + bloques de propiedades
// adjuntas, mismo formato que "Compartir por WhatsApp" — ver share-block.ts). Así el
// server no necesita portar quoteForRange()/season-price.
correo.post('/threads/:id/reply', async (c) => {
  const mine = await getUserAgency(c.env.DB, c.var.user.id);
  if (!mine) return forbidden(c, 'Sin acceso');
  const id = num(c.req.param('id'));
  if (id == null) return bad(c, 'id inválido');
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const text = str(body.body, 20000);
  if (!text) return bad(c, 'Falta el texto de la respuesta');

  const row = await c.env.DB.prepare('SELECT * FROM mail_threads WHERE id = ?').bind(id).first<MailThreadRow>();
  if (!row) return notFound(c, 'Hilo no encontrado');
  if (!row.from_addr) return bad(c, 'Este hilo no tiene una dirección para responder');

  try {
    await sendReply(c.env, {
      threadId: row.gmail_thread_id,
      toAddr: row.from_addr,
      subject: row.subject || '(sin asunto)',
      bodyText: text,
      inReplyTo: row.last_message_id,
      references: row.last_message_id,
    });
  } catch (e) {
    if (e instanceof GmailNeedsReconnect) return c.json({ error: e.message, code: 'GMAIL_RECONNECT' }, 409);
    return c.json({ error: 'No se pudo enviar la respuesta', detail: e instanceof Error ? e.message : String(e) }, 502);
  }

  await c.env.DB
    .prepare("UPDATE mail_threads SET status = 'respondido', last_from_me = 1, updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();
  const updated = await c.env.DB.prepare(threadSelect('WHERE t.id = ?')).bind(id).first();
  return c.json({ thread: updated });
});
