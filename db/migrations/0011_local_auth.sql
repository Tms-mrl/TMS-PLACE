-- CoopenPlaces · 0011 · login propio (Google OAuth directo, sin delegar a un tercero)
-- Reemplaza la delegación SSO: el Worker intercambia el code con Google, resuelve
-- el usuario y abre una sesión propia (tabla sessions + cookie), igual patrón que
-- ya existía para el link de acceso de agencia (agency_access).

ALTER TABLE users RENAME COLUMN coopen_sub TO auth_sub;

CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
