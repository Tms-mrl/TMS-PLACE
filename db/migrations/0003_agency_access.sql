-- CoopenPlaces · 0003 · acceso por link (magic link) para inmobiliarias.
-- El admin (super-admin) crea una inmobiliaria + un usuario sintético + un token.
-- La URL /i/<token> loguea directo a esa inmobiliaria (sesión local de Places),
-- en paralelo al SSO de Google (que sigue para el público). Revocable.

CREATE TABLE IF NOT EXISTS agency_access (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id  INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  label      TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_agency_access_token ON agency_access (token);
