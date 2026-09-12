export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  /** R2: fotos/planos/documentos de propiedades. */
  MEDIA: R2Bucket;
  /** OAuth Client ID de Google (Google Cloud Console → Credentials). No es secreto. */
  GOOGLE_CLIENT_ID?: string;
  /** Secret: `wrangler secret put GOOGLE_CLIENT_SECRET`. */
  GOOGLE_CLIENT_SECRET?: string;
  /**
   * SSO del ecosistema Coopen (modelo C / delegación). Si está seteada, el Worker
   * acepta además la cookie `coopen_session` reenviándola a `<AUTH_URL>/api/me`.
   * Vacía = solo login propio (deploy standalone / white-label de un cliente).
   */
  AUTH_URL?: string;
  /** Solo dev local ("email|nombre"): bypass del login. NUNCA en prod. */
  DEV_USER?: string;
  /** sub(s) o email(s) con acceso al panel de super-admin, separados por coma. */
  SUPER_ADMIN_SUBS?: string;
  /**
   * Opcional (secret): proxy de scraping para el import de Argenprop (que bloquea las IPs
   * de Cloudflare). Template con {url}, ej: https://api.scraperapi.com/?api_key=XXX&url={url}
   */
  SCRAPER_URL?: string;
  /** Base pública del sitio (para links absolutos en el cron de alertas, que no tiene request). */
  SITE_URL?: string;
  /**
   * OAuth Client ID de Gmail (proyecto de Google Cloud dedicado, separado del login).
   * No es secreto. Ver docs/ideas.md "Apartado Correo".
   */
  GMAIL_CLIENT_ID?: string;
  /** Secret: `wrangler secret put GMAIL_CLIENT_SECRET`. */
  GMAIL_CLIENT_SECRET?: string;
  /**
   * Secret: clave AES-GCM (32 bytes, base64) para cifrar el refresh token de Gmail
   * guardado en `mail_account`. `wrangler secret put MAIL_TOKEN_KEY`.
   */
  MAIL_TOKEN_KEY?: string;
};

export type UserRow = {
  id: number;
  auth_sub: string;
  email: string;
  name: string | null;
  created_at: string;
};

export type AgencyRow = {
  id: number;
  owner_user_id: number;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  logo_key: string | null;
  whatsapp: string | null;
  created_at: string;
};

export type SubscriptionRow = {
  agency_id: number;
  status: 'trial' | 'active' | 'blocked';
  trial_ends_at: string | null;
  active_until: string | null;
  notes: string | null;
  updated_at: string;
};

export type Vars = {
  user: UserRow;
};

export type AppEnv = { Bindings: Env; Variables: Vars };
