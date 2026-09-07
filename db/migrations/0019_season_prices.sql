-- CoopenPlaces · 0019 · precios por temporada (quincena) — planilla interna de tarifas.
-- Una fila por (propiedad, mes). `price_month` vale para todo el mes; `día`/`semana`
-- varían por quincena (1ª = días 1-15, 2ª = 16-fin). Todos los importes en ARS y
-- opcionales — el dueño carga a mano lo que aplica. Solo se usa para cotizar (interno),
-- no cambia la ficha pública. El runner re-ejecuta todo: mantener aditivo.
CREATE TABLE IF NOT EXISTS property_season_prices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  month         INTEGER NOT NULL,              -- 1..12
  price_month   REAL,                          -- $ por mes, igual para ambas quincenas
  price_day_q1  REAL,
  price_week_q1 REAL,
  price_day_q2  REAL,
  price_week_q2 REAL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_season_prices_prop_month
  ON property_season_prices (property_id, month);
CREATE INDEX IF NOT EXISTS idx_season_prices_property
  ON property_season_prices (property_id);
