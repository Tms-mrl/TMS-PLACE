-- CoopenPlaces · 0013 · marca configurable por deploy (white-label: 1 deploy = 1 cliente)
-- Cada cliente tiene su propio Worker/dominio/D1; este singleton permite que el admin de
-- la agencia le ponga su propio nombre al sitio (header/footer/títulos/topbar/login) sin
-- necesitar un redeploy.

CREATE TABLE IF NOT EXISTS site_settings (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  brand_name TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
