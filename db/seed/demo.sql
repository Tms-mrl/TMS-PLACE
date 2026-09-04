-- Datos de demo para que el marketplace no esté vacío (fotos ya subidas a R2 en seed/).
-- Se corre a mano contra la D1 (NO es una migración):
--   npx wrangler d1 execute coopen-places-db --remote --file=db/seed/demo.sql
-- Borrable después: DELETE FROM properties WHERE title LIKE '[demo]%';

INSERT INTO properties (owner_kind, operation, kind, title, description, price, currency, area_m2, rooms, address, city, province, status, published) VALUES
 ('particular','venta','casa','Casa con jardín en Fisherton','Amplia casa familiar con galería, parque y cochera. Muy luminosa, en una de las zonas más tranquilas de la ciudad. Ideal para familia.',185000,'USD',180,4,'Fisherton','Rosario','Santa Fe','disponible',1),
 ('agency','venta','casa','Villa moderna con pileta','Diseño contemporáneo, pileta climatizada y grandes ventanales que integran el interior con el jardín. Lista para mudarse.',320000,'USD',260,5,'Cerro de las Rosas','Córdoba','Córdoba','disponible',1),
 ('particular','alquiler','casa','Casa minimalista con patio y pileta','Casa de estilo minimalista, muy luminosa, con patio, pileta y cochera. Cerca de comercios y colegios.',95000,'ARS',150,3,'Chacras de Coria','Mendoza','Mendoza','disponible',1),
 ('agency','alquiler','departamento','Departamento luminoso en el centro','Ambiente amplio y luminoso, con balcón y excelente ubicación a metros del río. Ideal primer alquiler o inversión.',250000,'ARS',65,2,'Centro','Rosario','Santa Fe','disponible',1);

INSERT INTO property_media (property_id, r2_key, kind, sort)
 SELECT id, 'seed/casa1.jpg', 'photo', 0 FROM properties WHERE title = 'Casa con jardín en Fisherton';
INSERT INTO property_media (property_id, r2_key, kind, sort)
 SELECT id, 'seed/casa2.jpg', 'photo', 0 FROM properties WHERE title = 'Villa moderna con pileta';
INSERT INTO property_media (property_id, r2_key, kind, sort)
 SELECT id, 'seed/casa3.jpg', 'photo', 0 FROM properties WHERE title = 'Casa minimalista con patio y pileta';
INSERT INTO property_media (property_id, r2_key, kind, sort)
 SELECT id, 'seed/casa4.jpg', 'photo', 0 FROM properties WHERE title = 'Departamento luminoso en el centro';
