-- CoopenPlaces · 0023 · apartado "Correo": bandeja de equipo sobre una casilla de Gmail
-- (elmuellepropiedades@gmail.com), conectada una vez vía API de Gmail. Ver docs/ideas.md.
-- Aditivo/idempotente: el runner (scripts/migrate-d1.mjs) re-ejecuta todo.

-- Conexión única a la casilla (una sola fila, id = 1). refresh_token va cifrado
-- (AES-GCM con el secret MAIL_TOKEN_KEY del Worker) — nunca en texto plano.
CREATE TABLE IF NOT EXISTS mail_account (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  email            TEXT NOT NULL,
  refresh_token    TEXT NOT NULL,
  scope            TEXT NOT NULL,
  connected_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  connected_at     TEXT NOT NULL DEFAULT (datetime('now')),
  last_history_id  TEXT,                 -- cursor de Gmail para el sync incremental
  last_sync_at     TEXT,
  last_error       TEXT                  -- último fallo de sync/refresh; NULL si ok
);

-- Un hilo de Gmail = una fila. Los mensajes/adjuntos NO se guardan acá: el detalle se
-- trae de Gmail en vivo al abrir el hilo (ver src/worker/lib/gmail.ts).
CREATE TABLE IF NOT EXISTS mail_threads (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  gmail_thread_id  TEXT NOT NULL UNIQUE,
  from_addr        TEXT,
  from_name        TEXT,
  subject          TEXT,
  snippet          TEXT,
  last_message_id  TEXT,                 -- header RFC "Message-ID" del último entrante (threading)
  last_from_me     INTEGER NOT NULL DEFAULT 0,
  received_at      TEXT,                 -- fecha del último mensaje del hilo
  branch_id        INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'nuevo',  -- nuevo | pendiente | respondido | archivado
  assigned_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at      TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mail_threads_status   ON mail_threads (status);
CREATE INDEX IF NOT EXISTS idx_mail_threads_branch   ON mail_threads (branch_id);
CREATE INDEX IF NOT EXISTS idx_mail_threads_received ON mail_threads (received_at DESC);
