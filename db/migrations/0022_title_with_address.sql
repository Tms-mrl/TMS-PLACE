-- CoopenPlaces · 0022 · suma la dirección al título de las propiedades que YA están.
-- "Para 6 Personas"  ->  "Para 6 Personas - San Juan 4606, La Lucila del Mar".
-- Solo las que tienen dirección y cuyo título todavía no la contiene → idempotente
-- (el runner re-ejecuta todos los archivos). No toca updated_at: no es una edición humana.
-- El alta y el import NO cambian; esto es un renombre puntual de la cartera actual.
UPDATE properties
SET title = TRIM(title) || ' - ' || TRIM(address) ||
            CASE WHEN city IS NOT NULL AND TRIM(city) <> '' THEN ', ' || TRIM(city) ELSE '' END
WHERE address IS NOT NULL AND TRIM(address) <> ''
  AND instr(title, TRIM(address)) = 0;
