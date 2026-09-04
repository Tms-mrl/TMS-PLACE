-- CoopenPlaces · 0016 · testimonios de clientes (prueba social del landing)
--
-- La sección "Detrás de cada casa, hay personas" afirmaba algo que el sitio no probaba.
-- Esto le da a la inmobiliaria dónde cargar testimonios REALES desde Configuración; el
-- landing esconde la sección entera mientras no haya ninguno publicado (nunca se inventan
-- ni se muestran de ejemplo: un testimonio falso es exactamente lo contrario de la
-- confianza que la sección busca).
--
-- Scopeado por agencia igual que todo el resto, aunque hoy 1 deploy = 1 inmobiliaria.
CREATE TABLE IF NOT EXISTS testimonials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id  INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,              -- quién lo dijo (nombre y apellido o inicial)
  role       TEXT,                       -- "Inquilina en Villa Gesell", "Propietario"
  quote      TEXT NOT NULL,
  published  INTEGER NOT NULL DEFAULT 1, -- 0 = cargado pero todavía no visible
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_testimonials_agency ON testimonials (agency_id, published, sort);
