-- CoopenPlaces · 0009 · analítica de visitas por propiedad
-- Agregado POR DÍA (no una fila por visita): habilita series temporales, tendencias
-- y predicciones sin filas ilimitadas. El total es SUM(count); la serie es por día.
CREATE TABLE IF NOT EXISTS property_views (
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,                 -- YYYY-MM-DD (UTC, date('now'))
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (property_id, day)
);
CREATE INDEX IF NOT EXISTS idx_pviews_prop ON property_views (property_id, day);
