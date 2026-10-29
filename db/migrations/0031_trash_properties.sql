-- Papelera de propiedades: al "eliminar" una propiedad se guarda una copia completa (fila +
-- reservas, tarifas, fotos, encargos, consultas, favoritos y visitas) y recién a los 40 días
-- se borra de verdad (cron diario). Restaurar vuelve a insertar todo con los mismos ids.
CREATE TABLE IF NOT EXISTS trash_properties (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id         INTEGER NOT NULL,
  agency_id           INTEGER,
  title               TEXT NOT NULL,
  code                TEXT,
  deleted_at          TEXT NOT NULL DEFAULT (datetime('now')),
  purge_at            TEXT NOT NULL DEFAULT (datetime('now', '+40 days')),
  deleted_by_user_id  INTEGER,
  deleted_by          TEXT,
  bookings_n          INTEGER NOT NULL DEFAULT 0,
  prices_n            INTEGER NOT NULL DEFAULT 0,
  photos_n            INTEGER NOT NULL DEFAULT 0,
  data                TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trash_agency ON trash_properties (agency_id, deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_purge ON trash_properties (purge_at);
