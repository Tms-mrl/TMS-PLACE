import type { Env } from './types';

// Apartado "Correo": todo lo que habla con la API de Gmail vive acá — cripto del
// refresh token, refresh de access token, helpers REST, parseo de MIME y el sync
// incremental que corre desde el cron (ver scheduled() en src/worker/index.ts) y
// las rutas en src/worker/routes/correo.ts. Ver docs/ideas.md "Apartado Correo".

export const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
// Ventana del re-scan completo (cuando no hay historyId todavía, o venció). Alcanza
// para no perder consultas viejas sin traer años de historial en cada full sync.
const RESCAN_QUERY = 'newer_than:30d';

export type MailAccountRow = {
  id: 1;
  email: string;
  refresh_token: string;
  scope: string;
  connected_by: number | null;
  connected_at: string;
  last_history_id: string | null;
  last_sync_at: string | null;
  last_error: string | null;
};

export type MailThreadRow = {
  id: number;
  gmail_thread_id: string;
  from_addr: string | null;
  from_name: string | null;
  subject: string | null;
  snippet: string | null;
  last_message_id: string | null;
  last_from_me: number;
  received_at: string | null;
  branch_id: number | null;
  status: 'nuevo' | 'pendiente' | 'respondido' | 'archivado';
  assigned_by: number | null;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
};

/** El código de connect/callback (Google) devolvió una situación que exige re-conectar. */
export class GmailNeedsReconnect extends Error {}

export function gmailCallbackUrl(requestUrl: string): string {
  return `${new URL(requestUrl).origin}/api/correo/callback`;
}

// ── Cripto del refresh token (AES-GCM, clave = MAIL_TOKEN_KEY) ─────────────────────
// Formato guardado: base64(iv[12] || ciphertext). Net-new: no había crypto.subtle en
// el repo (el login no guarda tokens, ver auth.ts).

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function tokenKey(env: Env): Promise<CryptoKey> {
  if (!env.MAIL_TOKEN_KEY) throw new Error('Falta el secret MAIL_TOKEN_KEY');
  return crypto.subtle.importKey('raw', base64ToBytes(env.MAIL_TOKEN_KEY), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptToken(env: Env, plain: string): Promise<string> {
  const key = await tokenKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return bytesToBase64(out);
}

export async function decryptToken(env: Env, stored: string): Promise<string> {
  const key = await tokenKey(env);
  const raw = base64ToBytes(stored);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12));
  return new TextDecoder().decode(plain);
}

// ── Cuenta conectada (fila única en mail_account) ───────────────────────────────────

export async function getMailAccount(env: Env): Promise<MailAccountRow | null> {
  return env.DB.prepare('SELECT * FROM mail_account WHERE id = 1').first<MailAccountRow>();
}

export function accountNeedsReconnect(account: MailAccountRow | null): boolean {
  return !!account?.last_error;
}

async function setMailAccountError(env: Env, msg: string | null): Promise<void> {
  await env.DB.prepare('UPDATE mail_account SET last_error = ? WHERE id = 1').bind(msg).run();
}

export async function saveMailAccount(env: Env, opts: {
  email: string; refreshToken: string; scope: string; connectedBy: number; historyId: string;
}): Promise<void> {
  const enc = await encryptToken(env, opts.refreshToken);
  await env.DB.prepare(
    `INSERT INTO mail_account (id, email, refresh_token, scope, connected_by, connected_at, last_history_id, last_sync_at, last_error)
     VALUES (1, ?, ?, ?, ?, datetime('now'), ?, NULL, NULL)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email, refresh_token = excluded.refresh_token, scope = excluded.scope,
       connected_by = excluded.connected_by, connected_at = datetime('now'),
       last_history_id = excluded.last_history_id, last_sync_at = NULL, last_error = NULL`,
  ).bind(opts.email, enc, opts.scope, opts.connectedBy, opts.historyId).run();
  cachedAccessToken = null;
}

export async function disconnectMailAccount(env: Env): Promise<void> {
  await env.DB.prepare('DELETE FROM mail_account WHERE id = 1').run();
  cachedAccessToken = null;
}

// ── Access token (se refresca con el refresh token guardado) ───────────────────────
// Cache en memoria del módulo: "best effort" — vive mientras el isolate esté caliente,
// no hace falta que sobreviva a un cold start (se vuelve a pedir, sin costo real).

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(env: Env): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now) return cachedAccessToken.token;

  const account = await getMailAccount(env);
  if (!account) throw new GmailNeedsReconnect('La casilla de Gmail no está conectada');
  const refreshToken = await decryptToken(env, account.refresh_token);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID || '',
      client_secret: env.GMAIL_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    await setMailAccountError(env, `refresh_token: ${res.status} ${detail}`.slice(0, 500));
    throw new GmailNeedsReconnect(`No se pudo renovar el acceso a Gmail (${res.status}) — hay que reconectar la casilla`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = { token: data.access_token, expiresAt: now + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

async function gmailFetch(env: Env, path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken(env);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${GMAIL_API}${path}`, { ...init, headers });
}

// ── Helpers REST de Gmail ────────────────────────────────────────────────────────

export async function getProfile(env: Env): Promise<{ emailAddress: string; historyId: string }> {
  const res = await gmailFetch(env, '/profile');
  if (!res.ok) throw new Error(`Gmail getProfile ${res.status}`);
  return res.json();
}

type HistoryResponse = { history?: Array<{ messages?: Array<{ id: string; threadId: string }> }>; historyId: string };

/** null = el historyId venció (404) → el caller debe hacer un re-scan completo. */
export async function listHistory(env: Env, startHistoryId: string): Promise<HistoryResponse | null> {
  const res = await gmailFetch(env, `/history?startHistoryId=${encodeURIComponent(startHistoryId)}&historyTypes=messageAdded&maxResults=100`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Gmail listHistory ${res.status}`);
  return res.json();
}

export async function listThreadIds(env: Env, q: string, maxResults = 100): Promise<string[]> {
  const res = await gmailFetch(env, `/threads?q=${encodeURIComponent(q)}&maxResults=${maxResults}`);
  if (!res.ok) throw new Error(`Gmail listThreads ${res.status}`);
  const data = (await res.json()) as { threads?: Array<{ id: string }> };
  return (data.threads || []).map((t) => t.id);
}

export type GmailMessagePart = {
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: { size?: number; data?: string; attachmentId?: string };
  parts?: GmailMessagePart[];
};
export type GmailMessage = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
};
export type GmailThread = { id: string; historyId?: string; messages?: GmailMessage[] };

export async function getThread(env: Env, id: string, format: 'metadata' | 'full' = 'metadata'): Promise<GmailThread> {
  const metaHeaders = format === 'metadata' ? '&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=Message-ID' : '';
  const res = await gmailFetch(env, `/threads/${id}?format=${format}${metaHeaders}`);
  if (!res.ok) throw new Error(`Gmail getThread ${res.status}`);
  return res.json();
}

export async function getAttachment(env: Env, messageId: string, attachmentId: string): Promise<{ bytes: Uint8Array; size: number }> {
  const res = await gmailFetch(env, `/messages/${messageId}/attachments/${attachmentId}`);
  if (!res.ok) throw new Error(`Gmail getAttachment ${res.status}`);
  const json = (await res.json()) as { data: string; size: number };
  return { bytes: base64urlToBytes(json.data), size: json.size };
}

// ── Parseo de mensajes (headers + cuerpo + adjuntos desde el árbol MIME) ───────────

function base64urlToBytes(data: string): Uint8Array {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  return Uint8Array.from(atob(b64 + pad), (c) => c.charCodeAt(0));
}
function decodeBase64urlText(data: string): string {
  return new TextDecoder('utf-8').decode(base64urlToBytes(data));
}
function headerValue(headers: Array<{ name: string; value: string }> | undefined, name: string): string | null {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}
function parseFromHeader(v: string | null): { name: string | null; addr: string | null } {
  if (!v) return { name: null, addr: null };
  const m = v.match(/^"?([^"<]*)"?\s*<?([^<>]*)>?$/);
  const name = m?.[1]?.trim() || null;
  const addr = (m?.[2] || name)?.trim() || null;
  return { name, addr };
}
function stripHtml(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
/** internalDate de Gmail (epoch ms, string) → "YYYY-MM-DD HH:MM:SS" UTC, mismo formato
 *  que `datetime('now')` de SQLite (ordena bien como texto; el header Date crudo no). */
function epochMsToSqliteDatetime(ms: string | undefined): string | null {
  const n = ms ? Number(ms) : NaN;
  return Number.isFinite(n) ? new Date(n).toISOString().slice(0, 19).replace('T', ' ') : null;
}

function walkParts(part: GmailMessagePart | undefined, out: { text: string | null; html: string | null; attachments: ParsedMessage['attachments'] }) {
  if (!part) return;
  const mime = part.mimeType || '';
  if (part.filename && part.body?.attachmentId) {
    out.attachments.push({ id: part.body.attachmentId, filename: part.filename, mimeType: mime, size: part.body.size || 0 });
  } else if (mime === 'text/plain' && part.body?.data && out.text == null) {
    out.text = decodeBase64urlText(part.body.data);
  } else if (mime === 'text/html' && part.body?.data && out.html == null) {
    out.html = decodeBase64urlText(part.body.data);
  }
  for (const p of part.parts || []) walkParts(p, out);
}

export type ParsedMessage = {
  id: string;
  fromName: string | null;
  fromAddr: string | null;
  subject: string | null;
  messageId: string | null;
  receivedAt: string | null;
  bodyText: string;
  attachments: Array<{ id: string; filename: string; mimeType: string; size: number }>;
};

export function parseMessage(msg: GmailMessage): ParsedMessage {
  const headers = msg.payload?.headers;
  const from = parseFromHeader(headerValue(headers, 'From'));
  const out: { text: string | null; html: string | null; attachments: ParsedMessage['attachments'] } = { text: null, html: null, attachments: [] };
  walkParts(msg.payload, out);
  return {
    id: msg.id,
    fromName: from.name,
    fromAddr: from.addr,
    subject: headerValue(headers, 'Subject'),
    messageId: headerValue(headers, 'Message-ID'),
    receivedAt: epochMsToSqliteDatetime(msg.internalDate),
    bodyText: out.text ?? (out.html ? stripHtml(out.html) : msg.snippet || ''),
    attachments: out.attachments,
  };
}

// ── Enviar respuesta (MIME propio, threadeado) ──────────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/** Headers con tildes/ñ necesitan "encoded-word" (RFC 2047) para no romper el parseo. */
function encodeHeaderValue(v: string): string {
  return /^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${btoa(unescape(encodeURIComponent(v)))}?=`;
}

export async function sendReply(env: Env, opts: {
  threadId: string; toAddr: string; subject: string; bodyText: string;
  inReplyTo?: string | null; references?: string | null;
}): Promise<{ id: string; threadId: string }> {
  const account = await getMailAccount(env);
  if (!account) throw new GmailNeedsReconnect('La casilla de Gmail no está conectada');
  const subject = /^re:/i.test(opts.subject) ? opts.subject : `Re: ${opts.subject}`;
  const lines = [
    `From: El Muelle <${account.email}>`,
    `To: ${opts.toAddr}`,
    `Subject: ${encodeHeaderValue(subject)}`,
  ];
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push(
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(opts.bodyText))),
  );
  const raw = toBase64Url(new TextEncoder().encode(lines.join('\r\n')));
  const res = await gmailFetch(env, '/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw, threadId: opts.threadId }),
  });
  if (!res.ok) throw new Error(`Gmail sendReply ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json();
}

// ── Sync incremental (llamado desde el cron de 1 min, ver scheduled() en index.ts) ──

export async function syncGmail(env: Env): Promise<void> {
  const account = await getMailAccount(env);
  if (!account) return; // no conectada todavía

  try {
    let threadIds: string[];
    let newHistoryId: string;

    if (account.last_history_id) {
      const hist = await listHistory(env, account.last_history_id);
      if (hist) {
        const ids = new Set<string>();
        for (const h of hist.history || []) for (const m of h.messages || []) ids.add(m.threadId);
        threadIds = [...ids];
        newHistoryId = hist.historyId;
      } else {
        // historyId vencido (Gmail lo purga tras ~1 semana de inactividad) → re-scan.
        threadIds = await listThreadIds(env, RESCAN_QUERY);
        newHistoryId = (await getProfile(env)).historyId;
      }
    } else {
      threadIds = await listThreadIds(env, RESCAN_QUERY);
      newHistoryId = (await getProfile(env)).historyId;
    }

    for (const tid of threadIds) {
      try {
        await syncOneThread(env, tid, account.email);
      } catch (e) {
        console.error('syncOneThread', tid, e);
      }
    }

    await env.DB.prepare("UPDATE mail_account SET last_history_id = ?, last_sync_at = datetime('now'), last_error = NULL WHERE id = 1")
      .bind(newHistoryId).run();
  } catch (e) {
    if (!(e instanceof GmailNeedsReconnect)) {
      const msg = e instanceof Error ? e.message : String(e);
      await setMailAccountError(env, msg.slice(0, 500));
    }
    throw e;
  }
}

async function syncOneThread(env: Env, gmailThreadId: string, myEmail: string): Promise<void> {
  const thread = await getThread(env, gmailThreadId, 'metadata');
  const messages = thread.messages || [];
  if (!messages.length) return;

  const mine = myEmail.toLowerCase();
  const parsed = messages.map(parseMessage);
  const last = parsed[parsed.length - 1]!;
  const lastFromMe = !!(last.fromAddr && last.fromAddr.toLowerCase() === mine);
  // "De quién es la consulta" para la lista: el último mensaje que NO es nuestro.
  const counterpart = [...parsed].reverse().find((m) => !(m.fromAddr && m.fromAddr.toLowerCase() === mine)) ?? last;
  const original = parsed[0]!;

  const existing = await env.DB.prepare('SELECT status FROM mail_threads WHERE gmail_thread_id = ?').bind(gmailThreadId).first<{ status: string }>();
  // Un entrante nuevo en un hilo que ya estaba "respondido" lo vuelve a abrir.
  const nextStatus = !existing ? 'nuevo' : !lastFromMe && existing.status === 'respondido' ? 'pendiente' : existing.status;

  await env.DB.prepare(
    `INSERT INTO mail_threads (gmail_thread_id, from_addr, from_name, subject, snippet, last_message_id, last_from_me, received_at, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(gmail_thread_id) DO UPDATE SET
       from_addr = excluded.from_addr, from_name = excluded.from_name, subject = excluded.subject,
       snippet = excluded.snippet, last_message_id = excluded.last_message_id, last_from_me = excluded.last_from_me,
       received_at = excluded.received_at, status = excluded.status, updated_at = datetime('now')`,
  ).bind(
    gmailThreadId, counterpart.fromAddr, counterpart.fromName, original.subject, counterpart.bodyText.slice(0, 200),
    last.messageId, lastFromMe ? 1 : 0, last.receivedAt, nextStatus,
  ).run();
}
