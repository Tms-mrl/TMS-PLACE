-- CoopenPlaces · 0004 · capacidad (personas) + ventana de disponibilidad.
-- Para búsquedas de temporario: "casa para el 3 de septiembre, para 2 personas".
-- Ventana simple (from/until); calendario de reservas completo = roadmap.

ALTER TABLE properties ADD COLUMN capacity INTEGER;
ALTER TABLE properties ADD COLUMN available_from TEXT;   -- 'YYYY-MM-DD' o NULL (siempre)
ALTER TABLE properties ADD COLUMN available_until TEXT;  -- 'YYYY-MM-DD' o NULL (siempre)
