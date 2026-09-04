-- Propiedades de temporario para demostrar el filtro por fecha + personas + precio.
-- Requiere 0004 (capacity, available_from/until). Correr una vez.
INSERT INTO properties (owner_kind, agency_id, branch_id, owner_user_id, operation, kind, title, description, price, currency, area_m2, rooms, capacity, available_from, available_until, city, province, lat, lng, status, published) VALUES
 ('agency',1,1,1,'temporario','cabaña','Cabaña para 2 en Villa Carlos Paz','Cabaña acogedora para 2, con parrilla y vista a las sierras. Ideal escapada.',180000,'ARS',45,1,2,'2026-01-01','2026-12-31','Villa Carlos Paz','Córdoba',-31.424,-64.497,'disponible',1),
 ('agency',1,2,1,'temporario','departamento','Depto para 2 en el centro','Monoambiente equipado para 2, a metros de todo. Alquiler temporario.',250000,'ARS',40,1,2,'2026-01-01','2026-12-31','Rosario','Santa Fe',-32.946,-60.641,'disponible',1),
 ('agency',1,3,1,'temporario','casa','Casa para 4 frente al lago','Casa amplia para 4 personas, muelle propio y galería. Alquiler por temporadas.',320000,'ARS',110,3,4,'2026-01-01','2026-12-31','Villa Carlos Paz','Córdoba',-31.410,-64.485,'disponible',1);

INSERT INTO property_media (property_id, r2_key, kind, sort) SELECT id,'seed/casa1.jpg','photo',0 FROM properties WHERE title='Cabaña para 2 en Villa Carlos Paz';
INSERT INTO property_media (property_id, r2_key, kind, sort) SELECT id,'seed/casa3.jpg','photo',0 FROM properties WHERE title='Depto para 2 en el centro';
INSERT INTO property_media (property_id, r2_key, kind, sort) SELECT id,'seed/casa2.jpg','photo',0 FROM properties WHERE title='Casa para 4 frente al lago';
