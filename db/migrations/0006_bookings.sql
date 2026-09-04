-- CoopenPlaces · 0006 · reservas / bloqueos de fechas (temporario).
-- Cada reserva bloquea un rango [from_date, to_date] inclusive de una propiedad.
CREATE TABLE IF NOT EXISTS bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  from_date   TEXT NOT NULL,   -- 'YYYY-MM-DD' inclusive
  to_date     TEXT NOT NULL,   -- 'YYYY-MM-DD' inclusive
  guest_name  TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings (property_id, from_date);
