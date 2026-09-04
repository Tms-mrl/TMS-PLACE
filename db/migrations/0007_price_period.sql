-- CoopenPlaces · 0007 · a qué refiere el precio (mensual, por noche, etc.)
-- Valores: 'mes' | 'noche' | 'dia' | 'semana' | 'total' (o NULL). Para temporario suele
-- ser 'noche', alquiler 'mes', venta 'total'.
ALTER TABLE properties ADD COLUMN price_period TEXT;
