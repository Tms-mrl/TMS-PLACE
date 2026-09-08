-- CoopenPlaces · 0020 · precio "por quincena completa" en las tarifas por temporada.
-- Suma a property_season_prices el precio de la quincena entera, por cada quincena
-- (día < semana < quincena). Aditivo; el runner re-ejecuta todo y tolera "duplicate column".
ALTER TABLE property_season_prices ADD COLUMN price_fortnight_q1 REAL;
ALTER TABLE property_season_prices ADD COLUMN price_fortnight_q2 REAL;
