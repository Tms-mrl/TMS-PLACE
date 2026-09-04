-- Seed de galerías para demo: a cada propiedad le sumamos varias fotos reutilizando
-- las imágenes ya existentes en R2 (portadas de otras propiedades). Reglas:
--   · Nunca se repite una key DENTRO de la misma galería (keys distintas + NOT EXISTS).
--   · Se puede repetir la misma imagen ENTRE galerías distintas (es demo).
--   · El subset por propiedad (módulo) hace que las galerías no sean todas idénticas.
-- Idempotente: re-ejecutar no duplica. Las filas del seed usan sort 51..56 (sort>=50).
WITH keys AS (
  -- Primero DISTINCT, DESPUÉS numerar: así son exactamente las keys únicas (no 1 por fila).
  SELECT r2_key, ROW_NUMBER() OVER (ORDER BY r2_key) AS rn
  FROM (SELECT DISTINCT r2_key FROM property_media)
)
INSERT INTO property_media (property_id, r2_key, kind, sort)
SELECT p.id, k.r2_key, 'photo', 50 + k.rn
FROM properties p
JOIN keys k ON ((p.id + k.rn) % 6) < 4
WHERE NOT EXISTS (
  SELECT 1 FROM property_media pm WHERE pm.property_id = p.id AND pm.r2_key = k.r2_key
);
