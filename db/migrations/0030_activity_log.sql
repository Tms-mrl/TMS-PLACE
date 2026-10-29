-- Registro de actividad: quién cambió qué y cuándo (todo lo que no es GET en /api/*).
-- `changes` = {campo: [antes, después]} en ediciones; `body` = lo enviado al crear;
-- `snapshot` = copia de la fila (y de lo que se borra en cascada) cuando se elimina algo,
-- para poder reconstruirla a mano si fue un error.
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  agency_id   INTEGER,
  user_id     INTEGER,
  user_label  TEXT,
  method      TEXT NOT NULL,
  path        TEXT NOT NULL,
  action      TEXT NOT NULL,            -- create | update | delete | other
  entity      TEXT,                     -- properties | clients | bookings | ...
  entity_id   INTEGER,
  summary     TEXT NOT NULL,
  changes     TEXT,
  body        TEXT,
  snapshot    TEXT
);
CREATE INDEX IF NOT EXISTS idx_activity_agency_id ON activity_log (agency_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log (entity, entity_id);
