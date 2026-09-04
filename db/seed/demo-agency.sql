-- Puebla la inmobiliaria "Centurion Propiedades" (agency 1) para la demo.
-- Correr una vez: npx wrangler d1 execute coopen-places-db --remote --file=db/seed/demo-agency.sql

-- Asignar propiedades a la agencia + sucursales (1,2,3) con estados variados.
UPDATE properties SET owner_kind='agency', owner_user_id=1, agency_id=1, branch_id=1, status='reservada'  WHERE id=1;
UPDATE properties SET owner_kind='agency', owner_user_id=1, agency_id=1, branch_id=2, status='disponible' WHERE id=2;
UPDATE properties SET owner_kind='agency', owner_user_id=1, agency_id=1, branch_id=3, status='alquilada'  WHERE id=3;
UPDATE properties SET owner_kind='agency', owner_user_id=1, agency_id=1, branch_id=2, status='disponible' WHERE id=4;
UPDATE properties SET branch_id=1, status='disponible' WHERE id=5;

-- Propiedades adicionales de la agencia (con foto en R2).
INSERT INTO properties (owner_kind, agency_id, branch_id, owner_user_id, operation, kind, title, description, price, currency, area_m2, rooms, city, province, status, published) VALUES
 ('agency',1,3,1,'venta','duplex','Dúplex a estrenar en Funes','Dúplex de categoría, dos plantas, patio y cochera. A estrenar.',210000,'USD',140,3,'Funes','Santa Fe','disponible',1),
 ('agency',1,2,1,'alquiler','local','Local comercial sobre avenida','Local a la calle sobre avenida de alto tránsito, ideal comercio.',400000,'ARS',90,1,'Rosario','Santa Fe','disponible',1),
 ('agency',1,2,1,'venta','departamento','Monoambiente para inversión','Monoambiente en edificio con renta asegurada. Ideal inversión.',65000,'USD',35,1,'Rosario','Santa Fe','vendida',1);

INSERT INTO property_media (property_id, r2_key, kind, sort) SELECT id,'seed/casa1.jpg','photo',0 FROM properties WHERE title='Dúplex a estrenar en Funes';
INSERT INTO property_media (property_id, r2_key, kind, sort) SELECT id,'seed/casa2.jpg','photo',0 FROM properties WHERE title='Local comercial sobre avenida';
INSERT INTO property_media (property_id, r2_key, kind, sort) SELECT id,'seed/casa3.jpg','photo',0 FROM properties WHERE title='Monoambiente para inversión';
INSERT INTO property_media (property_id, r2_key, kind, sort) SELECT 5,'seed/casa4.jpg','photo',0 WHERE NOT EXISTS (SELECT 1 FROM property_media WHERE property_id=5);

-- CRM: interesados (con preferencias para el cruce) + propietarios.
INSERT INTO clients (agency_id, kind, name, email, phone, notes, prefs) VALUES
 (1,'interesado','Lucía Fernández','lucia.fernandez@example.com','341-555-0110','Busca para mudarse en 2 meses.','{"operation":"alquiler","city":"Rosario","max_price":300000,"min_rooms":2}'),
 (1,'interesado','Martín Gómez','martin.gomez@example.com','341-555-0122','Familia, busca en Funes.','{"operation":"venta","city":"Funes","min_rooms":3}'),
 (1,'interesado','Sofía Ruiz','sofia.ruiz@example.com','341-555-0133','Primer alquiler.','{"operation":"alquiler","city":"Rosario"}'),
 (1,'propietario','Roberto Díaz','roberto.diaz@example.com','341-555-0144','Dueño de la casa en Fisherton. Consignación exclusiva.','{}'),
 (1,'propietario','Ana Torres','ana.torres@example.com','341-555-0155','Consignó el local comercial sobre avenida.','{}');
