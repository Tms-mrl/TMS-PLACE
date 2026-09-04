-- El Muelle · import de cartera desde elmuellepropiedades.com.ar (BuscadorProp)
-- Generado por scripts/import-elmuelle.mjs — 2026-09-04 — 251 propiedades.
-- Idempotente: ON CONFLICT(external_url). Requiere la migración 0018 (índice único parcial)
-- y las 3 sucursales reales (db/seed/elmuelle-branches-real.sql). Las fotos van aparte:
--   node scripts/import-elmuelle.mjs photos --local

-- Baja los datos de prueba (todo lo que no venga de este import).
DELETE FROM contracts WHERE property_id IN (SELECT id FROM properties WHERE external_url IS NULL);
DELETE FROM expenses  WHERE property_id IN (SELECT id FROM properties WHERE external_url IS NULL);
DELETE FROM deals     WHERE property_id IN (SELECT id FROM properties WHERE external_url IS NULL);
DELETE FROM properties WHERE external_url IS NULL;  -- cascade: property_media, bookings, mandates, property_views

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Para 6 Personas', '2 dormitorios + 1 altillo - 2 baños - cocina - living comedor - patio con parrilla y lavadero - entrada de auto - tv cable - heladera freezer - microondas - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Catamarca 5155', 'La Lucila del Mar', 'Buenos Aires', -36.658418501319, -56.684346199036, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77574')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Para 5/6 Personas', '2 dormitorios ( 1 es estar) - 2 baños - living- cocina /comedor - patio con parrilla y lavadero - entrada de auto - 2 tv cable - heladera con freezer - wi fi- gas natural',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["gas","parrilla","lavarropas","heladera"]', 'Costanera 4892, Entre Salta Y Jujuy', 'La Lucila del Mar', 'Buenos Aires', -36.66174064303, -56.680269241333, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77578')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Para 6 Personas', '2 dormitorios (matrimonial en planta baja) - 1 baño - cocicna - living comedor - entrada de auto - fondo con parrilla - tv cable. wifi
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","directv"]', 'San Juan 4606', 'La Lucila del Mar', 'Buenos Aires', -36.66446021708, -56.681771278381, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77590')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Para 5 Personas', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto - patio con parrilla. tv cable, hel con freezer. wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","heladera"]', 'La Rioja 4647 N° 3', 'La Lucila del Mar', 'Buenos Aires', -36.664585, -56.6828271, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77596')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Para 5/6 Personas', '2 dormitorio - 1 baño - cocina comedor - tv cable',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   NULL, 'Costanera Y Entre Rios', 'La Lucila del Mar', 'Buenos Aires', -36.659544250392, -56.68039698833, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77600')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 7/8 Personas', '2 dormitorios ( mas un altillo ) - 2 baños - cocina comedor - patio con parrilla - entrada de auto - tv cable - microondas - heladera confreezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 8,
   '["wifi","parrilla","microondas","heladera"]', 'Sanaviron Entre C. La Argentina Y Rosales', 'Aguas Verdes', 'Buenos Aires', -36.63534890124, -56.686534881592, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77614')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 10 Personas', '4 dormitorios - 3 baños - cocina - living comedor - entrada de auto - patio con parrilla - tv cable - freezer - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 10,
   '["wifi","parrilla","heladera"]', 'Sanaviron Esquina Rosales', 'Aguas Verdes', 'Buenos Aires', -36.63546943203, -56.684861183167, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77617')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Para 6 Personas', '2 dormitorios - 1 baño - cocina - livingcomedor - lavadero - patio con parrilla -- fondo en la esquina - entrada de auto - tv cable - microondas - heladera con freezer',
   70000, 'USD', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","microondas","heladera"]', 'San Luis Esquina 9 De Julio', 'Aguas Verdes', 'Buenos Aires', -36.638499858505, -56.693058013916, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77625')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5 Personas', '2 dormitorios + uno pequeño- 2 baños (1 exterior) - cocina comedor - patio con parrilla y lavadero - entrada de auto -tv cable - microondas - heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["parrilla","lavarropas","microondas","heladera"]', 'Sanaviron Antesquina Rosales', 'Aguas Verdes', 'Buenos Aires', -36.635538306683, -56.68468952179, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77635')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 7 Personas', '3 dormitorios - 1 baño - cocina comedor - jardin con lavadero y parrilla - tv cable - heladera con freezer - microondas',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 7,
   '["parrilla","lavarropas","microondas","heladera"]', 'Espora Antesquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638258806217, -56.684432029724, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77638')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina - comedor diario - patio con parrilla y lavadero - espacio para el auto - tv cable - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","heladera"]', 'San Martin Y Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.636192612813, -56.686856746674, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77640')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', 'Muy buen Duplex', '2 dormitorios - 1 baño - cocina comedor - patio con parrilla - lavadero - entrada de auto - tv. cable - heladera con freezer - microondas - cafetera - tostadora',
   50000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas","microondas","heladera"]', 'Brown 1227', 'Aguas Verdes', 'Buenos Aires', -36.636674729563, -56.688380241394, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77645')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - patio con parrilla y lavadero - entrada de auto - tv cable - heladera con freezer - microondas - cafetera - tostadora',
   48000, 'USD', NULL, NULL, NULL, NULL, 5,
   '["parrilla","lavarropas","microondas","heladera"]', 'Diaguita 250', 'Aguas Verdes', 'Buenos Aires', -36.636433671565, -56.687865257263, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77646')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Y Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638568730449, -56.684045791626, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77652')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 2 - 4 Personas', 'Son 2 monoambientes (con cama matrimononial o con cama superpuesta) baño con ducha. tiene cocina con horno, tiene microondas y tv cable. patio al frente con pequeña parrrilla',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["microondas"]', 'Espora Antesquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638224370115, -56.684517860413, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77655')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', 'Lote Pinar', 'Lote pinar de 20 x 50',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Tucuman E/ Santa Fe Y Av.1', 'La Lucila del Mar', 'Buenos Aires', -36.653583144261, -56.688218495801, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77658')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Para 8/10 personas', '4 dormitorios - 3 baños - cocina - comedor - patio con parrilla - jardin de invierno living - cochera semicubierta - tv cable - microondas - heladera con freezer - wifi.-',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 10,
   '["wifi","parrilla","cochera","microondas","heladera"]', 'Salta Esquina Sgo Del Estero', 'La Lucila del Mar', 'Buenos Aires', -36.661878345292, -56.68662071228, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77671')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Il Posto Di Fratelli', 'Duplex (6 pax): 2 dormitorios - 2 baños (uno toilett) - cocina - living comedor - patio con parrilla y ducha - entrada de auto
servicio de limpieza , 1 por semana- servicio de blanco de cama (no toallas ni toallones)
en comun:
pileta no climatizada - zona wi fi.-
temporad...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","pileta"]', 'Mitre Entre Corrientes Y Cordoba', 'La Lucila del Mar', 'Buenos Aires', -36.655935681044, -56.686070940228, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77696')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Dto 4/5 personas PB', 'Dto planta baja, 1 dormitorio matrimonial- baño - cocina comedor - tv cable - heladera freezer - microondas.wifi
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["wifi","directv","microondas","heladera"]', 'Mendoza 4675 Pb 2', 'La Lucila del Mar', 'Buenos Aires', -36.664462016717, -56.680429360822, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77700')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', 'OPORTUNIDAD', '2 dormitorios - 1 baño - cocina comedor - entrada de auto - patio con parrilla - tv cable - microondas',
   37000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","microondas"]', 'Diaguita 254', 'Aguas Verdes', 'Buenos Aires', -36.636433671565, -56.687951087952, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77754')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', 'Duplex', '2 dormitorios - 1 baño - cocina comedor - patio con parrilla y lavadero - entrada de auto - tv cable - heladera con freezer - microondas - cafetera - tostadora',
   48000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas","microondas","heladera"]', 'Diaguita 256', 'Aguas Verdes', 'Buenos Aires', -36.636468108468, -56.687908172607, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77755')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5/6 Personas', '2 dormitorios - 2 baños - cocina - comedor -entrada de auto - patio con parrilla - tv cable - amplio jardin',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla"]', 'Alte Brown Entre Chiriguano Y Belgrano', 'Aguas Verdes', 'Buenos Aires', -36.63805218937, -56.688766479492, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77756')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Duplex', '2 dormitorios - 2 baños (1 toilette) - living - cocina comedor - entrada de auto - patio con parrilla - tiene 65 mts2 cubiertos',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla"]', 'Tucuman 2610', 'San Bernardo', 'Buenos Aires', -36.688725578292, -56.684947013855, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77782')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 8 Personas', 'Chalet en 2 plantas. pb 3 dormitorios con placard - baño principal - toilette - cocina - comedor - living en desnivel - pa sala de lectura, baño con ducha - entrada de auto pasante - amplio fondo libre con quincho y parrilla - tv cable - micrrondas - heladera con freezer - wifi
&nbs...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 8,
   '["wifi","parrilla","heladera"]', 'Yamana 39', 'Aguas Verdes', 'Buenos Aires', -36.639154139484, -56.683015823364, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77807')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Duplex Para 6 Personas', '2 dormitorios - 2 baños - cocina comedor - patio con parrilla y lavadero - entrada de auto - 2 tv cable - microondas - heladera con freezer - wi - fi-',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","microondas","heladera"]', 'Jujuy Antesquina Costanera', 'La Lucila del Mar', 'Buenos Aires', -36.6624815, -56.6802706, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77824')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'cabana', 'Cabaña', '2 dormitorios - 1 baño - cocina comedor - entrada de auto - patio con parrilla - tv cable',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla"]', 'Obligado Y La Rioja', 'San Bernardo', 'Buenos Aires', -36.6788886, -56.6807262, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77828')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 3/4 Personas', '1 dormitorio - 1 baño - cocina comedor - entrada de auto - patio con parrilla - tv cable - microondas -wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","microondas"]', 'Belgrano 1550', 'Aguas Verdes', 'Buenos Aires', -36.634753993095, -56.688872284656, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77847')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Para 7/8 Personas', 'Comodidades de 2 triplex: en planta baja living con sofa cama de 2 plazas y con tv de 29 - cocina comedor - toilette con ducha - en 1&deg; piso 2 dormitorios con 2 camas c/u, ambos con placard - baño - en 2&deg; piso dormitorio con somier matrimonial, tv cable, placard - patio propio con parr...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 8,
   NULL, 'Costanera Entre Rio Negro Y Belgrano', 'La Lucila del Mar', 'Buenos Aires', -36.665561789351, -56.679840087891, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77851')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Para 5/6 Personas', 'Comodidades de cada duplex: en planta baja cocina comedor - living con sofa cama de 2 plazas - toilette con ducha - planta alta: dormitorio con somier matrimonial, placard y otro dormitorio con 2 camas, placard - baño - patio propio con parrilla y ducha - tv cable - microondas - heladera con ...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","microondas","heladera"]', 'Costanera Entre Rio Negro Y Belgrano', 'La Lucila del Mar', 'Buenos Aires', -36.665596213231, -56.679840087891, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77852')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Para 3/4 Personas', 'Comodidades de cada departamento: 1 dormitorio con somier matrimonial, placard - 1 baño - cocina comedor con living integrado con sofa de 2 plazas - tv cable - microondas - heladera con freezer - gas natural - las 6 unidades disponen de entrada de auto propia, zona de wi-fi, solariu...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["gas","wifi","microondas","heladera"]', 'Costanera Entre Rio Negro Y Belgrano', 'La Lucila del Mar', 'Buenos Aires', -36.665527365456, -56.679840087891, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77853')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 6 personas', '2 dormitorios - 2 baños - cocina comedor - entrada de auto - patio con parrilla y lavadero - tv cable-hel freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","heladera"]', 'Rosales Antesquina Sanaviron', 'Aguas Verdes', 'Buenos Aires', -36.635366119935, -56.684947013855, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77861')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 6 personas', '2 dormitorios - 2 baños ( 1 es exterior)- cocina comedor - patio con parrilla y lavadero - entrada de auto - tv cable-heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","heladera"]', 'Rosales Entre Lancha Cormoran Y Sanaviron', 'Aguas Verdes', 'Buenos Aires', -36.635400557316, -56.684989929199, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77862')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 4 personas', '2 dormitorios - 2 baños (1 exterior) - cocina comedor - living - entrada de auto - patio con parrilla - tv cable - microondas - heladera freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","microondas","heladera"]', 'Crucero La Argentina Entre Yamana Y Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638844217608, -56.683745384216, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77873')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 7 personas', '2 dormitorios - 2 baños - cocina comedor - living - entrada de auto - patio con parrilla - tv cable - microondas - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 7,
   '["wifi","parrilla","microondas"]', 'Costanera Entre Sarmiento Y Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.637191279877, -56.682715415955, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77879')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 personas', 'Es en planta alta: 2 dormitorios - 1 baño - cocina comedor - entrada de auto - balcon con vista al mar - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","microondas","heladera"]', 'Costanera Entre Sarmiento Y Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.637294589524, -56.68267250061, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77880')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5 personas', '2 dromtiroios - 1 baños - cocina comedor - cochera - lavadero - fondo con parrilla - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","cochera","microondas","heladera"]', 'Yate Fortuna 95', 'Aguas Verdes', 'Buenos Aires', -36.639911721044, -56.683444976807, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77895')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas- heladera con freezer',
   39000, 'USD', NULL, NULL, NULL, NULL, 4,
   '["parrilla","lavarropas","microondas","heladera"]', 'Lancha Cormoran Y Costanera', 'Aguas Verdes', 'Buenos Aires', -36.635125057843, -56.682801246643, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77928')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 7 Personas', '3 dormitorios - 2 baños completos - cocina - living comedor - entrada de auto - parrilla - balcon con una inmejorable vista al mar - gas incluido - tv cable - microondas - heladera con freezer - wifi - amplio parque',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 7,
   '["wifi","parrilla","microondas","heladera"]', 'Costanera Y Lancha Cormoran', 'Aguas Verdes', 'Buenos Aires', -36.635228370261, -56.68267250061, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/77933')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'casa', 'Chalet Al frente', '3 dormitorios ( pb 1 dor con 2 camas individuales pa 2 dorm, 1 con cama matrimonial) 2 baños completos - cocina- living- comedor - quincho con parrilla - amplio fondo verde- jardin - cochera cubierta - 3 tv cable - microondas - wi-fi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["wifi","parrilla","cochera","microondas"]', 'Catamarca Y Obligado', 'Costa Azul', 'Buenos Aires', -36.678710590805, -56.682114601135, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/90046')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'cabana', 'Para 2/3 Personas', 'Cabaña monoambiente con cocina comedor integrada - baño - entrada de auto - tv cable',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 3,
   NULL, 'Fragata Sarmiento Entre Usuhaia Y Santa Fe', 'Aguas Verdes', 'Buenos Aires', -36.636468108468, -56.695976257324, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/102585')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'cabana', 'Para 5 Personas', '1 dormitorio - 1 baño - cocina comedor - entrada de auto techada - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Buenos Aires Y 9 De Julio', 'Aguas Verdes', 'Buenos Aires', -36.635917116172, -56.69340133667, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/102586')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', 'Es en planta baja: 2 dormitorios - 1 baño - cocina comedor - entrada de auto - patio con parrilla - tv cable - micronndas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","heladera"]', 'Costanera Entre Fgta Sarmiento Y Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.637225716441, -56.68267250061, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/104360')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'lote', 'Anticipo y cuotas', 'Medidas 15 x 20',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Duhau Y Tucuman', 'Costa Azul', 'Buenos Aires', -36.668109114842, -56.686577796936, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/105824')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Para 7/8 Personas', '3 dormitorios - 2 baños completos - cocina comedor - living - entrada de auto - quincho con parrilla y lavadero - 2 tv cable - microondas - heladera con freezer - gas natural - lavarropas - wi-fi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 8,
   '["gas","wifi","parrilla","lavarropas","microondas","heladera"]', 'Mendoza Entre Rio Negro Y Belgrano', 'La Lucila del Mar', 'Buenos Aires', -36.665561789351, -56.680526733398, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/105828')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'casa', '6 Personas', '2 chalet en ph. cada uno. 3 dorm en planta alta, baño completo
planta baja 1 baño (toilette). cocina-living comedor. parrilla. tv cable, hel confreezer, wifi
recarga directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, 4, NULL, NULL,
   '["wifi","parrilla","directv","heladera"]', 'Santa Fe Esq Catamarca', 'La Lucila del Mar', 'Buenos Aires', -36.65409778131, -56.684861183167, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/118315')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'EXCELENTE CHALET', 'Importante propiedad en dos plantas sobre lote propio a 50 mts del mar con detalles de categoria.
planta baja: cocina independiente - comedor - living en desnivel - tres amplios dormitorios con placard - 2 baños - lavadero - jardin - galeria.
planta alta: playroom - baño complet...',
   120000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["lavarropas"]', 'Yamana 39', 'Aguas Verdes', 'Buenos Aires', -36.639119703782, -56.68297290802, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/126211')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 6 Personas', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto techada - patio con parrilla y lavadero - 2 tv cable - microondas - heladera con freezer - aire acondicionado - balcon con vista al pinar - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","aire","lavarropas","microondas","heladera"]', 'Yate Fortuna 163', 'Aguas Verdes', 'Buenos Aires', -36.639842850301, -56.684303283691, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/134427')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Para 6 Personas', 'Tiene 2 dormitorios - 2 baños - cocina comedor - living - patio con lavadero - quincho con parrilla - entrada de auto - 2 tv cable - microondas - heladera con freezer - gas natural - lavarropas - wi-fi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["gas","wifi","parrilla","lavarropas","microondas","heladera"]', 'Mendoza Entre Rio Negro Y Belgrano', 'La Lucila del Mar', 'Buenos Aires', -36.665527365456, -56.680483818054, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/137603')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["parrilla","lavarropas","microondas","heladera"]', 'Belgrano Esquina Entre Rios', 'Aguas Verdes', 'Buenos Aires', -36.637880008241, -56.689624786377, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/137672')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 6 Personas', '2 dormitorios - 2 baños - cocina comedor - entrada de auto - patio con parrilla y lavadero - fondo libre - tv cable - heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","heladera"]', 'Rosales Y Sanaviron', 'Aguas Verdes', 'Buenos Aires', -36.635779367482, -56.684045791626, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/139510')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - entrada de auto - patio con parrilla - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","microondas","heladera"]', 'Entre Rios Entre 9 De Julio Y Usuhaia', 'Aguas Verdes', 'Buenos Aires', -36.637707826727, -56.694045066833, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/139517')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 7/8 Personas', '3 dormitorios - 2 baños - cocina comedor - entrada de auto - patio con parrilla - fondo - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 8,
   '["wifi","parrilla","microondas","heladera"]', 'Rosales Y Sanaviron', 'Aguas Verdes', 'Buenos Aires', -36.635400557316, -56.687479019165, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/139519')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   NULL, 'Yamana Entre Costanera Y Crucero La Argentina', 'Aguas Verdes', 'Buenos Aires', -36.639326317766, -56.683316230774, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/141645')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'casa', 'Para 8 Personas', '3 dormitorios - 2 baños - cocina - living comedor - cochera - amplio fondo con parrilla cubierta - lavadero- gas natural - wifi.-',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 8,
   '["gas","wifi","parrilla","lavarropas","cochera"]', 'Catamarca Entre Cordoba Y Corrientes', 'La Lucila del Mar', 'Buenos Aires', -36.655784784511, -56.684989929199, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/143566')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Il Posto Di Fratelli', 'Complejo il posto di fratelli
departamentos (4 pax): 1 dormitorio - 1 baño - cocina living comedor - espacio con parrilla - entrada de auto
servicios:
servicio de limpieza1 por semana - servicio de blanco de cama (no toallas ni toallones)
en comun:
pileta no ...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","pileta"]', 'Mitre Entre Cordoba Y Corrientes', 'La Lucila del Mar', 'Buenos Aires', -36.655991353791, -56.686191558838, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/143567')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 6/7 Personas', '3 dormitorios (dos en 1er piso y uno en 2do piso) - 2 baños (toilette en planta baja y en 1er piso baño compñeto) - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - 2 balcones con vista al mar - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 7,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Chiriguano 42', 'Aguas Verdes', 'Buenos Aires', -36.63877534591, -56.68297290802, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/143576')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Para 6 personas', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - balcon al frente - 2 tv cable - microondas - heladera con freezer -',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","microondas","heladera"]', 'Costanera 4230', 'Costa Azul', 'Buenos Aires', -36.669658122901, -56.679239273071, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/177801')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina - living comedor - emtrada de auto - patio con parrilla y lavadero - pequeño fondo libre - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Crucero La Argentina Antesquina Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.636123738745, -56.683745384216, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/181489')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Para 6/7 Personas', 'Duplex interno- 2 dormitorios mas estar- 2 baños - cocina comedor - living - patio con parrilla y lavadero - entrada de auto - tv cable -hel con freezer- microondas - wifi-entrada de auto- aire acondicionado consultar adicional',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 7,
   '["wifi","parrilla","aire","lavarropas","microondas","heladera"]', 'Costanera Entre Rebagliati Y Entre Rios', 'La Lucila del Mar', 'Buenos Aires', -36.658993423167, -56.680439903674, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/215008')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'cabana', 'Para 3/4 Personas', 'Cabaña monoambinte amplia y luminosa. tiene patio con parrilla y lavadero - entrada de auto - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Destructor Buenos Aires Entre Belgrano Y Libertad', 'Aguas Verdes', 'Buenos Aires', -36.636209732286, -56.690213434393, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/229193')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 6 Personas TODO A ESTRENAR', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Crucero La Argentina Antesquina Sanaviron', 'Aguas Verdes', 'Buenos Aires', -36.635501937335, -56.683926578821, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/240561')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 4 Personas', '2 dormitorios - 2 baños - cocina comedor - living - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - 2 aires acondicionados - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Destructor Buenos Aires Entre Belgrano Y Libertad', 'Aguas Verdes', 'Buenos Aires', -36.636003109943, -56.690170519049, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/241726')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - patio - tv cable',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   NULL, 'Yamana Entre Costanera Y Crucero La Argentina', 'Aguas Verdes', 'Buenos Aires', -36.639205693979, -56.683282606299, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/246779')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina - living comedor - entrada de auto cubierta - fondo con parrilla y lavadero - tv cable - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","heladera"]', 'Chiriguano Esquina Espora', 'Aguas Verdes', 'Buenos Aires', -36.638551413437, -56.684720270331, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/248656')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Departamento para 4 personas', '1 dormitorio - baño - cocina living comedor - tv cable - heladera con freezer - microondas',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["microondas","heladera"]', 'Hernandez 57 2° Piso B', 'San Bernardo', 'Buenos Aires', -36.6824171, -56.6780733, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/249223')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Departamento 4 Personas', '1 dormitorio - baño - cocina comedor - tv cable - heladera con freezer - dvd',
   NULL, 'ARS', NULL, NULL, 2, NULL, NULL,
   '["heladera"]', 'Chiozza Esquina Falkner', 'San Bernardo', 'Buenos Aires', -36.692771195204, -56.678012803613, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/272460')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 4 Personas', '2 dormitorios - 2 baños completos - cocina comedor con living integrado - entrada de auto pasante - espacio verde con parrilla y lavadero - tv cable - microondas - heladera con freezer - aire acondicionado -wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","aire","lavarropas","microondas","heladera"]', 'Espora Entre Yate Fortuna Y Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.63974573946, -56.684533642328, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/273102')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - patio con parrilla y lavadero - entrada de auto - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Crucero La Argentina Antesquina Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.636234163008, -56.683741066656, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/274313')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'local', 'Apart de Playa', 'Unico apart de playa --
son 10 unidades para 4 personas c/u
4 departamentos en planta baja: 1 dormitorio - 1 baño - cocina comedor - (2 unidades con puerta de acceso para personas con movilidad reducida)
4 departamentos en 1&ordm; piso: 1 dormitorio - 1 baño - cocin...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Costanera Y Yate Fortuna', 'Aguas Verdes', 'Buenos Aires', -36.639912135115, -56.682565688794, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/275253')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["parrilla","lavarropas","microondas","heladera"]', 'Destructor Brown 1223', 'Aguas Verdes', 'Buenos Aires', -36.636732759783, -56.688405076721, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/277426')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Duplex 4 cuadras del Mar', '2 dormitorios - baño - cocina - living comedor - patio c/parrilla - entrada de auto cerrada',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla"]', 'Catamarca 3315', 'San Bernardo', 'Buenos Aires', -36.679836538839, -56.68151260423, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/286554')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Hermosa ubicacion', 'Tiene una hermosa ubicacion, una zona muy tranquila. es un primer piso por escalera externa.tiene 1 dormitorio - 1 baño - cocina - comedor - entrada de auto - todos los servicios',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'La Rioja Entre Zuviria Y Hernandez', 'San Bernardo', 'Buenos Aires', -36.683198496344, -56.68034997876, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/296703')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor -tv cable - microondas - heladera con freezer - wifi - entrada de auto compartida - patio con parrilla y lacadero compartido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","microondas","heladera"]', 'Diaguita Entre Costanera Y Crucero La Argentina', 'Aguas Verdes', 'Buenos Aires', -36.636226905525, -56.684679665576, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/304203')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Departamento 3/4 Personas', '1 dormitorio - 1 baño - cocina - living comedor - heladera con freezer - microondas - tv cable - wi fi- - gas natural-2do piso por escalera-excelente estado
recarga directv a cargo inquilino.
uso del aire acondicionado tiene recargo extra',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","aire","directv","microondas","heladera"]', 'Duhau Entre Mendoza Y San Juan', 'Costa Azul', 'Buenos Aires', -36.667527744636, -56.68048854631, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/304798')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5/6 Personas', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - espacio verde - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Rompehielos San Martin Entre Belgrano Y Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.635404526037, -56.687998624359, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/310537')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Triplex 6 Personas', '3 dormitorios - 2 baños - livin comedor - cocina - patio con parrilla y lavadero - tv cable',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Tucuman Entre Zuviria Y Hernandarias', 'San Bernardo', 'Buenos Aires', -36.68437092283, -56.684627053967, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/313910')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'departamento', 'Departamento 4 Personas', '1 dormitorio - baño - cocina comedor - parrilla - 2do piso por escalera-contrafrente.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla"]', 'Mendoza 4675', 'La Lucila del Mar', 'Buenos Aires', -36.6642256, -56.6805098, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/341450')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', 'Para 5/6 Personas', '2 dormitorios - altillo - 2 baños - comedor - cocina - entrada de auto - fondo con parrilla - tv cable - microndas - heladera con freezer - wifi',
   48000, 'USD', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","heladera"]', 'Fragata Sarmiento Entre Brown Y San Martin', 'Aguas Verdes', 'Buenos Aires', -36.637260008695, -56.687469162952, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/345156')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Duplex 7 Personas', '3 dormitorios -2 baños c/secador de pelo- cocina - living comedor - entrada de auto - patio con parrilla - 3tv cable - heladera freezer - microondas - wi fi- gas natural- agua corriente- 4 ventiladores de techo- 100 mtrs cuadrados cubiertos- bicicleta- fondo.-',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","parrilla","microondas","heladera","ventilador"]', 'Rio Negro 292', 'La Lucila del Mar', 'Buenos Aires', -36.6653229, -56.6824259, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/382758')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5 Personas', '2 dormitorios - 1 baño- cocina - comedor diario - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Crucero La Argentina Antesquina Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.636108254432, -56.685373034326, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/387242')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5/6 personas', '2 dormitorios - 2 baños - cocina comedor - living - entrada de auto - patio con prrilla y lavadero - tv cable - microondas - heladera con freezer. wifi -',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","lavarropas","microondas","heladera"]', 'Rompehielos San Martin Entre Belgrano Y Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.635367854166, -56.688076701013, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/391096')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 4 personas', '2 dormitorios - 1 baño - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer -wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Destructor San Juan Entre Libertad Y 9 De Julio', 'Aguas Verdes', 'Buenos Aires', -36.635126792079, -56.692239489404, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/393689')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'SEPTIMO EMPRENDIMIENTO 6 CASAS TOTALMENTE V.ENDIDAS', 'Octavo proyecto y desarrollo en la zona. es un complejo de 6 unidades, de las cuales 2 ya fueron entregadas
quedan disponible las 2 unidades del fondo y las 2 unidades del frente.
unidad fondo: 2 dormitorios - 1 baño - cocina - comedor diario - entrada de auto - amplio fondo libre
unidad f...',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["cochera"]', 'Destructor Rosales Entre Yate Fortuna Y Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.639011970189, -56.687360965607, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/415411')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamento', 'Despartamento 2 ambientes, 700 metros del mar, planta baja',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Tucuman 2200', 'San Bernardo', 'Buenos Aires', -36.6939869, -56.6842715, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/428494')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5/6 Personas', '3 dormitorios - 2 baños - cocina comedor - living - entrada de auto - patio cubierto con lavadero - fondo con parrilla - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'San Martin Entre Diaguita Y Belgrano', 'Aguas Verdes', 'Buenos Aires', -36.635317248752, -56.688122477771, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/431176')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5 Personas', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Crucero La Argentina Antesquina Sanaviron', 'Aguas Verdes', 'Buenos Aires', -36.635271763649, -56.685473338098, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/433200')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina - comedor diario - living - entrada de auto - fondo con parrilla - tv cable - microondas - heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["parrilla","microondas","heladera"]', 'Chiriguano Esquina Espora', 'Aguas Verdes', 'Buenos Aires', -36.638293686105, -56.685950166687, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/435044')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5/6 Personas', '2 dormitorios mas altillo - 2 baños - living - cocina comedor - entrada de auto - patio propio con parrilla y lavadero - balcon al frente - fondo compartido - tv cable- microondas - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","lavarropas","microondas"]', 'Rompehielos San Martin Entre Sramiento Y Gaviota', 'Aguas Verdes', 'Buenos Aires', -36.637685373867, -56.686996188361, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/435949')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'departamento', 'EXCELENTE DEPARTAMENTO', '2 dormitorios - 1 baño - cocina comedor - living - entrada de auto - patio con parrilla y lavadero - terraza con vista al mar - impecable estado',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Yate Fortuna Entre Costanera Y Crucero La Argentina', 'Aguas Verdes', 'Buenos Aires', -36.640176799129, -56.683049682526, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/460503')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'OPORTUNIDAD', 'Medidas 15 x 36',
   15000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Yate Fortuna Entre Granville Y Seaver', 'Aguas Verdes', 'Buenos Aires', -36.638261727843, -56.704905145508, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/470590')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 4 Personas', '2 dormitorios - 1 baño - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - wifi - espacio verde',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas"]', 'San Juan Esquina Libertad', 'Aguas Verdes', 'Buenos Aires', -36.635054043726, -56.6907407, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/470742')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5/6 Personas', 'Duplex al fondo con: 2 dormitorios - 2 baños - cocina living comedor - entrada de auto - patio con quincho con parrilla y lavadero - tv cable - microondas - heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","microondas","heladera"]', 'Yamana 81', 'Aguas Verdes', 'Buenos Aires', NULL, NULL, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/474099')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5/6 Personas', '2 dormitorios - 2 baño - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Fragata Sarmiento Y Santa Fe', 'Aguas Verdes', 'Buenos Aires', -36.636374444611, -56.696293596295, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/475077')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 3/4 Personas', 'Ampio monoambiente con entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["parrilla","lavarropas","microondas","heladera"]', 'Destructor San Luis Antesquina 9 De Julio', 'Aguas Verdes', 'Buenos Aires', -36.638453951299, -56.692754443872, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/479563')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'FRENTE AL BOSQUE', 'Medidas: 15 x 45',
   47000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Lancha Cormoran Entre Rosales Y Belgrano', 'Aguas Verdes', 'Buenos Aires', -36.634702737692, -56.687825706885, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/484780')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Casa a 2 cuadras del mar', 'Hermosa casa a 2 cuadras del mar - 2 dormitorios - baño - cocina - living comedor - tv cable-wifi-amplio parque - entrada de autos - parrilla y lavadero
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["wifi","parrilla","lavarropas","directv"]', 'San Juan Y Rebagliati', 'La Lucila del Mar', 'Buenos Aires', -36.65814182626, -56.682386888361, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/486460')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'PH a 4 cuadras del mar', 'Ph a cuatro cuadras del mar, sobre calle principal - 2 dormitorios - 2 baños - cocina living comedor - entra de auto - patio con parrilla y lavadero. tv con directv a cargo inquilino- wifi.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["wifi","parrilla","lavarropas","directv"]', 'Rebagliati 400', 'La Lucila del Mar', 'Buenos Aires', -36.65899365368, -56.684877668787, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/486463')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Chalet en PH fdo 4/5 pers', '2 dormitorios- 1 en planta baja matrimonial- 2do dormitorio estar enplanta alta-living comedor-cocina-| baño-patio con parrilla-entrada de auto-tv cable-hel con freezer-microondas
recarga de dieectv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","microondas","heladera"]', 'San Juan 4700', 'La Lucila del Mar', 'Buenos Aires', -36.6639427, -56.6819356, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/504515')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Triplex para 6 pers', 'Triplex- 3 dormitorios en planta alta-2 baños-living-cocina comedor-lavadero-patio con parrilla-entrada de auto-3tv cable-hel con freezer-microondas-ventiladores-wifi-gas natural-',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","wifi","parrilla","lavarropas","microondas","heladera","ventilador"]', 'Salta Entre Costanera Y Mendoza', 'La Lucila del Mar', 'Buenos Aires', -36.6613184, -56.6799939, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/505097')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 5 Personas', '2 dormitorios - 2 baños - cocina comedor - living - entrada de auto - pariilla y lavadero - gran parque al frente - tv cable - microondas - heladera con feeezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","lavarropas","microondas","heladera"]', 'Fragata Sarmiento 685', 'Aguas Verdes', 'Buenos Aires', -36.636381694906, -56.696226939375, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/505169')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Chalet lote propio', 'Todo planta baja, 3 dormitorios-2 baños-cocina-comedor-living-patio con lavadero-amplio parque con parrilla-tv cable-hel con freezer-microondas-entrada de auto cerrada recarga de direc tv a corgo inquilino',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas","microondas","heladera"]', 'Misiones 155', 'La Lucila del Mar', 'Buenos Aires', -36.6573099, -56.681862, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/505819')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Duplex 5 pers.', '2 dorm- 2 baños- cocina- comedor-patio con parrilla-lavadero--garage cubierto- pequeña terraza- tv cable directv- gas natural',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","parrilla","lavarropas","cochera","directv"]', 'Zuviria 690', 'San Bernardo', 'Buenos Aires', -36.6840709, -56.684677, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/507332')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Complejo de cabañas 2-3-4 y 5 pers.', 'Cabañas para 2-3-4-y 5/6 pers. equipadas con anafe 2 hornallas-hel con freezer-microondas-tv cable-zona de wifi-hidromasaje y pequeña pileta con turnos-ropa blanca y toallas. opcional : desayuno-almuerzo-cena-servicio valet-estacionmiento cubierto en 10 de ellas-.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["wifi","pileta","amoblado","microondas","heladera"]', 'Costanera 4148', 'Costa Azul', 'Buenos Aires', -36.6706396, -56.6783284, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/507647')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Duplex 5 pers.', 'Planta baja living comedor-cocina- dormitorio matrimonial-en el living cama 1 plaza-planta alta estar con 2 camas individuales-patio con parrilla-entrada de auto-tv cable-heladera-microondas. wifi
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["wifi","parrilla","directv","microondas","heladera"]', 'Catamarca4624', 'La Lucila del Mar', 'Buenos Aires', -36.6649682, -56.683715, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/507943')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'OCTAVO EMPRENDIMIENTO 5 CASAS', 'Octavo proyecto en la zona. consta de 5 unidades funcionales.
1 casa al frente vendid@: 2 dormitorios - 2 baños - cocina comedor - entrada de auto - patio con parrilla y lavadero.
2 casas al medio (vendid@s): 1 dormitorio - 1 baño - cocina comedor - entrada de auto . patio con parril...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Lancha Cormoran Entre Rosales Y Belgrano', 'Aguas Verdes', 'Buenos Aires', -36.634685518848, -56.68797591059, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/518334')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Casa + Cabaña', 'Casa con 2 dormitorios - 1 baño - cocina comedor - entrada de auto - patio con parrilla y lavadero - jardin al frente.
cabaña monoambiente con baño - entrada de auto - patio con parrilla y lavadero.
medidas del lote 7.5 x 40',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Fragata Sarmiento 725', 'Aguas Verdes', 'Buenos Aires', -36.63624089254, -56.697367768787, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/518357')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Muy lindo lote', 'Medidas 15 x 36',
   20000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Yate Fortuna Entre Santa Fe Y Usuhaia', 'Aguas Verdes', 'Buenos Aires', -36.638932845384, -56.696029040259, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/518437')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'EXCELENTE UBICACION COMERCIAL SOBRE CALLE PRINCIPAL', 'Medidas: 15 x 30',
   85000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Fragata Sarmiento Antesquina Costanera', 'Aguas Verdes', 'Buenos Aires', -36.637437663546, -56.6834001, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/518438')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', 'Triplex sobre calle Principal', '3 dormitorios - 2 baños - cocina - living comedor - entrada de auto techada - patio con parrilla y lavadero',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Fragata Sarmiento Esquina Alte Brown', 'Aguas Verdes', 'Buenos Aires', -36.637183455781, -56.68785121052, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/518493')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Departamento', 'Departamento, 2do piso por escalera, 1 dormitorio con cama matrimonial y balcon -cocina-comedor con cama marinera-baño-tv cable en el dormitorio.
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["directv"]', 'Mendoza Esquina Neuquen', 'La Lucila del Mar', 'Buenos Aires', -36.6637892, -56.6806327, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/532466')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Complejo Apart (Frente al mar) La posada de Chiche', 'Complejo apart (frente al mar)
unidades para: 4-5-6-7 personas
incluye:
* servicio de limpieza
* ropa de cama
* toallas y toallones (recambio cada 5 dias)
* pileta recreativa climatizada
* espacio dentro del complejo para guardar auto
*wifi
*tv cable
* quincho con parrillas c...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["mascotas","wifi","parrilla","pileta"]', 'Costanera 4150', 'Costa Azul', 'Buenos Aires', -36.6706087, -56.6783332, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/534523')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Duplex 6 personas', 'Duplex al frente. 2 dorm, 2 baños, cocina comedor, living. patio con parrilla. entrada de auto. tv cable, hel con freezer, wifi
recarga de direcrv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, 2, 2, NULL,
   '["patio","wifi","parrilla","heladera"]', 'Costanera 5047', 'La Lucila del Mar', 'Buenos Aires', -36.6592481, -56.680109, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/541455')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Depto', 'Depto, 1er piso por escalera.1 dorm matrimonial, 2 camitas de 1 plaza en cocina comedor.heladera con freezer- tv cable. espacio para el auto dentro del complejo. parrilla compartida
recarga directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["patio","cochera","parrilla","directv","heladera"]', 'La Rioja 5339', 'La Lucila del Mar', 'Buenos Aires', -36.6558516, -56.6834209, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/541855')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Duplex', 'Duplex interno. 2 dorm, 2 baños, cocina comedor, living. patio con parrilla. espacio para autio. tv cable, hel con freezer. wifi
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, 3, 2, NULL,
   '["patio","wifi","parrilla","directv","heladera"]', 'Costanera 5037', 'La Lucila del Mar', 'Buenos Aires', -36.6593688, -56.6800988, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/541861')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Chalet', 'Chalet en ph, todo planta baja, 3 dorm, 2 baños, cocina living-comedor. patio con parrilla. tv cable, wifi, heladera con freezer
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, 4, 2, NULL,
   '["patio","cochera","wifi","parrilla","directv","heladera"]', 'Santa Fe 200', 'La Lucila del Mar', 'Buenos Aires', -36.6537891, -56.6828403, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/541863')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Depto para 4/5 personas', 'Vacaciones perfectas te esperan a una cuadra del mar,. este hermoso departamento, lleno de luz natural, te ofrece una experiencia costera inolvidable. en primer piso por escalera. terraza propia con parrilla, donde podras disfrutar de asombrosos amaneceres. cuenta con 1 dormitorio matrimonial (somie...',
   NULL, 'ARS', NULL, NULL, 2, 1, 5,
   '["patio","parrilla"]', 'Mendoza 4812', 'La Lucila del Mar', 'Buenos Aires', -36.6624007, -56.6810148, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/543897')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Casa a reciclar', 'Casa en lote de 16 x 30 a reciclar. tiene 1 dormitorio - 1 baño - cocina comedor - galeria con parrilla y lavadero - entrada de auto - fondo libre',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Granville Entre Yate Fortuna Y San Luis', 'Aguas Verdes', 'Buenos Aires', -36.637242790422, -56.704206147205, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/550307')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Duplex en San bernardo', NULL,
   50000, 'USD', NULL, NULL, 3, 1, NULL,
   '["patio"]', 'Obligado 400', 'San Bernardo', 'Buenos Aires', -36.679024, -56.6819041, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/551928')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', 'Lote sobre Tucuman', 'Lote en la esquina (tucuman/duhau). 10 x 20',
   33000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Tucuman Y Duhau', 'La Lucila del Mar', 'Buenos Aires', -36.6679636, -56.6866196, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/552040')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', 'Lote 12 X 27', 'Lote 12 x 27. santiago del estero entre corrientes y cordoba.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Santiago Del Estero 5350', 'La Lucila del Mar', 'Buenos Aires', -36.6559964, -56.6869031, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/552044')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', 'lote sobre Av 1 (Pinar)', 'Lote sobre av 1 a 50 mts de 9 de julio. 10 x 30',
   30000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Av 1 Y 9 De Julio', 'La Lucila del Mar', 'Buenos Aires', -36.651672297506, -56.692810437634, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/552047')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Duplex 6 personas', '2 dormitorios-2 baños-cocina-living comedor-patio con parrilla-entrada de auto-2tv por internet - wifi-heladera con freezer-microondas-gas natural',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","wifi","parrilla","microondas","heladera"]', 'Costanera 4948', 'La Lucila del Mar', 'Buenos Aires', -36.6605645, -56.6795691, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/563118')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'OPORTUNIDAD', 'Medidas 15 x 36',
   16000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'San Luis Entre Seaver Y Granville', 'Aguas Verdes', 'Buenos Aires', -36.637531921641, -56.705475167737, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/565857')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto para 5/6', 'Departamento, 2do piso por escalera, en excelentes condiciones. muy bien equipado, a 100mts del mar-2 dorm-1 baño-cocina comedor-2tv cable-hel con freezer-gas natural-wifi-espacio para el auto-. balcon con parrilla
directv a carga inquilino',
   NULL, 'ARS', NULL, NULL, 4, 1, NULL,
   '["gas","wifi","parrilla","amoblado","directv","heladera"]', 'Mendoza 4349', 'Costa Azul', 'Buenos Aires', -36.6685554, -56.6798947, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/566268')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Casa a 3 cuadras del mar', 'Casa para 4/5 personas, a 300 mts del mar. 1 dormitorio en pb (1 en en pa). cocina - living/comedor. baño. patio con parrilla. cochera cubierta.tv cable-hel con freezer-microondas-wifi-
recarga directv a cargo inquilino
no acepta mascotas',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["patio","parrilla","wifi","cochera","directv","mascotas","microondas","heladera"]', 'Entre Rios 299', 'La Lucila del Mar', 'Buenos Aires', -36.6600637, -56.6832213, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/567492')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 3 Personas', 'Monoambiente con cocina independiente - comedor - dormitorio - baño - tv cable - microondas - zona wifi - patio - fondo con parrilla y lavadero de uso compartido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 3,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638368320516, -56.684981963973, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568550')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638395612507, -56.685014568267, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568551')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.6383988577, -56.685005138626, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568552')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 star dormitorio en entrepiso - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.63830474706, -56.684954218564, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568553')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638372896155, -56.684950446708, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568554')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638356670186, -56.685007024554, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568555')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638379386542, -56.684954218564, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568556')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638428064427, -56.684988165272, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568557')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamentos a estrenar', 'Departamentos a estrenar en costa azul. 2 ambientes + altillo. 1 baño. cocina/comedor. balcon. espacio con parrilla.
a 1 cuadra del mar.',
   44000, 'USD', NULL, NULL, 2, 1, NULL,
   '["patio","parrilla"]', 'Mendoza 3836', 'Costa Azul', 'Buenos Aires', -36.6745841, -56.6795114, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568933')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Casa alpina para 5/6 personas', 'Alpina-3 dorm-1 baño-cocina comedor-patio con parrilla-hel con freezer-tv cable-wifi-aire acondicionado en 1 dormitorio matrimonial-entrada de auto',
   NULL, 'ARS', NULL, NULL, 4, 1, 6,
   '["wifi","parrilla","aire","heladera"]', 'Santiago Del Estero Y Cordoba', 'La Lucila del Mar', 'Buenos Aires', -36.6593154, -56.6837553, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568955')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Chalet para 4 personas (Pinar)', NULL,
   NULL, 'ARS', NULL, NULL, 2, 1, 4,
   NULL, 'Crucero 9 De Julio', 'La Lucila del Mar', 'Buenos Aires', -36.6440257, -56.6935604, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568959')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'casa', 'Chalet para 8 pers', 'Chalet en ph, 4 dormitorios-1 planta baja con cama matrimonial-3 planta alta--2 baños-cocina living comedor-.tv cable-heladera-wifi',
   NULL, 'ARS', NULL, NULL, 4, 2, NULL,
   '["wifi","heladera"]', 'Catamarca Y Obligado', 'Costa Azul', 'Buenos Aires', -36.678737643438, -56.681843339881, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/568961')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'departamento', 'Para 3/4 Personas', '1 dormitorio - 1 baño - cocina comedor - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer',
   40000, 'USD', NULL, NULL, NULL, NULL, 4,
   '["parrilla","lavarropas","microondas","heladera"]', 'Destructor Rosales Entre Yate Fortuna Y Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.639184148788, -56.687382423279, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/570183')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'casa', 'Chalet para 6 pers', 'Chalet en ph-2 dormitorios-1baño-cocina-living comedor-2tv cable-1 en living comedor-1 dormitorio matrimonial --hel con freezer-microondas-lavarropas semiautomatico-wifi-gas natural-espacio verde con parrilla-estacionamiento semicubierto-',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["gas","wifi","parrilla","lavarropas","microondas","heladera"]', 'Av 3 Y Las Rosas', 'Costa del Este', 'Buenos Aires', -36.6084708, -56.6953238, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/570344')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Departamento', 'Departamento primer piso-1 dormitorio matrimonial con tv cable-baño-cocina comedor con tv cable-heladera-freezer-deck con parrilla-wifi-gas narural-espacio para el auto-',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["wifi","parrilla","heladera"]', 'Av 3 Y Las Rosas', 'Costa del Este', 'Buenos Aires', -36.6084708, -56.6953238, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/570401')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 5 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638366405768, -56.685018340124, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/571067')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 4 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.638369650962, -56.68496930599, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/571071')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 5 Personas', '1 dormitorio - 1 baño - cocina comedor - tv cable - microondas - zona wifi (limitado) - parque con parrillas y lavaderos compartidos - gas incluido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas"]', 'Crucero La Argentina Esquina Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.6384378, -56.6849165, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/571073')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'Duplex 5/6 personas', 'Duplex interno, 2 dorm, 2 baños. cocina.living comedor. patio con parrilla. tv cable, hel con freezer, microondas. tv cable. wifi.
recarga de directv a cargo inquilino',
   NULL, 'ARS', NULL, NULL, 3, 2, NULL,
   '["wifi","parrilla","directv","microondas","heladera"]', 'Costanera 4230', 'La Lucila del Mar', 'Buenos Aires', -36.6694669, -56.6785212, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/575092')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Chalet para 5 personas', 'Casa en ph, todo planta baja, 2 dorm, baño, cocina comedor, patio con parrilla, tv cable, wifi, gas natural. espacio para auto al aire libre',
   NULL, 'ARS', NULL, NULL, 3, 1, 5,
   '["gas","wifi","parrilla"]', 'La Rioja Y Rebagliati', 'La Lucila del Mar', 'Buenos Aires', -36.6593154, -56.6837553, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/575095')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Oportunidad', '16 x 30',
   22000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Santiago Del Estero Entre San Luis Y Entre Rios', 'Aguas Verdes', 'Buenos Aires', -36.637919725005, -56.69861645378, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/576669')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Excelente Ph (Todo en PB)', NULL,
   NULL, 'ARS', NULL, NULL, 3, 2, NULL,
   NULL, 'Duhau 421', 'La Lucila del Mar', 'Buenos Aires', -36.6675941, -56.6836525, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/578272')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'duplex', 'Duplex', 'Duplex al frente. 2 dorm, 2 baños, cocina comedor, living. patio con parrilla. tv cable, hel con freezer. wifi. entrada de auto
recarga de directv a cargo inquilino',
   83000, 'USD', NULL, NULL, 3, 2, NULL,
   '["wifi","parrilla","directv","heladera"]', 'Cordoba 88', 'La Lucila del Mar', 'Buenos Aires', -36.6551991, -56.6815078, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/578274')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'ph', 'PH en muy buen estado', NULL,
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   NULL, 'Santiago Del Estero Y Salta', 'La Lucila del Mar', 'Buenos Aires', -36.662465376838, -56.68628730531, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/583024')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', 'Lote en el pinar', 'Lote en el pinar.
salta entre av 1 y av 2. (600 mts 2)',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Salta Y Av 1', 'La Lucila del Mar', 'Buenos Aires', -36.651121413961, -56.689913651898, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/583026')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', 'Lote', NULL,
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Tucuman Y Junco', 'La Lucila del Mar', 'Buenos Aires', -36.653256065747, -56.688368699506, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/583027')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Importante esquina comercial', 'Excelente esquina comercial sobre calle principal a 200 mts del mar. tiene plano aprobado para locales y departamentos.
medidas 17,77 x 35',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Fragata Sarmiento Esquina Espora', 'Aguas Verdes', 'Buenos Aires', -36.63743213097, -56.685838763995, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/584074')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'A 100 mts de la Plaza', 'Medidas 15 x 40',
   24000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Destructor Buenos Aires Entre Santa Fe Y Santiago Del Estero', 'Aguas Verdes', 'Buenos Aires', NULL, NULL, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/584080')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'EXCELENTE UBICACION', 'Lote de 750 mts2 a 30 mts del mar.
medidas 15 x 50',
   65000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Diaguita Entre Costanera Y Crucero La Argentina', 'Aguas Verdes', 'Buenos Aires', -36.636478981172, -56.683865018845, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/593932')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5/6 Personas', '2 dormtiorios mas altillo - 2 baños - cocina comedor - living - entrada de auto - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer-',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["parrilla","lavarropas","microondas","heladera"]', 'Diaguita 48', 'Aguas Verdes', 'Buenos Aires', -36.636366426149, -56.684622511639, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/596840')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'departamento', 'Depto', 'Depto, 1er piso por escalera. 1 dormitorio matrimonial. cocina comedor, bañi. tv cable, hel con freezer, wifi. espacio para guardar el auto',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["wifi","heladera"]', 'La Rioja 5339', 'La Lucila del Mar', 'Buenos Aires', -36.6558004, -56.6833781, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/597784')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'casa', 'Chalet', 'Chalet, todo planta baja. 2 dormitorios. 1 matrimonial con baño en suite, otro dormitorio con 2 camas cuchetas. 2 tv cable- hel con freezer-microondas-wifi-gas natural.',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["gas","wifi","microondas","heladera"]', 'Las Rosas Y Av 3', 'Costa del Este', 'Buenos Aires', -36.6084708, -56.6953238, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/600695')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'departamento', 'Para 3/4 Personas', '1 star dormitorio en entrepiso - 1 baño - cocina comedor - tv cable - balcon al frente. es un 1&ordm; piso por escalera y abajo hay bar de playa.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   NULL, 'Costanera Esquina Fragata Sarmiento', 'Aguas Verdes', 'Buenos Aires', -36.637552718741, -56.683188357364, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/602482')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Zona en Crecimiento', 'Medidas 15 x 36',
   16000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Destructor San Juan Entre Granville Y Seaver', 'Aguas Verdes', 'Buenos Aires', -36.633860994116, -56.704632869895, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/606667')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', 'Lote sobre Tucuman', 'Lote ubicado sobre la calle tucuman entre sarmiento y drago.
10x40.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Tucuman Y Drago', 'La Lucila del Mar', 'Buenos Aires', -36.673773247936, -56.6859868979, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/608792')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Triplex en excelente estado', 'Triplex,-3 dorm-2 baños-cocina comedor-patio con parrilla-entreada de auto-tv cable-hel con freezer-lavarropas',
   73000, 'USD', NULL, NULL, 4, 2, NULL,
   '["parrilla","lavarropas","heladera"]', 'Duhau Y San Juan', 'Costa Azul', 'Buenos Aires', -36.6676371, -56.6812467, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/608794')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Departamento para 5/6 personas con cochera', NULL,
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   NULL, 'Esquiu 173', 'San Bernardo', 'Buenos Aires', -36.693662, -56.6784895, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/623329')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Hermoso triplex para 6 personas', '3 dormitorios - 2 baños - cocina - living comedor - patio con parrilla y lavadero - entrada de auto - gas natural - 2 smart tv - microondas heladera con freezer - aire acondicionado - wifi',
   NULL, 'ARS', NULL, NULL, 4, 1, 6,
   '["gas","wifi","parrilla","aire","lavarropas","tv","microondas","heladera"]', 'Mitre 2834', 'San Bernardo', 'Buenos Aires', -36.6878543, -56.6823563, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/623346')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Hermoso Chalet cerca del Pinar', 'Chalet en ph, fondo derecho. todo planta baja
2 dorm- 1 baño completo-cocina comedor- living- patio abierto con parrilla- tv cable-hel con frerzer- wifi',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["wifi","parrilla"]', 'Catamarca 5444', 'La Lucila del Mar', 'Buenos Aires', -36.6546583, -56.6848733, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/623347')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'local', 'Excelente local sobre Chiozza', 'Excelente local ubicado sobre la calle chiozza al 3300. (15x20). apto para seguir edificando hacia arriba',
   NULL, 'ARS', NULL, NULL, NULL, 2, NULL,
   NULL, 'Chiozza Y Frias', 'San Bernardo', 'Buenos Aires', -36.679882734078, -56.67855094279, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/624027')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'casa', 'Hermosa cabaña en el Pinar', NULL,
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   NULL, 'Av 1 Y Mitre', 'La Lucila del Mar', 'Buenos Aires', -36.651421651278, -56.686597016796, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/624151')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'local', 'Excelente local sobre Chiozza (Oportunidad)', 'Excelente local de dos pisos, sobre chiozza. apto para construir arriba. 15x20',
   NULL, 'ARS', NULL, NULL, NULL, 2, NULL,
   NULL, 'Chiozza Y Frias', 'San Bernardo', 'Buenos Aires', -36.679884897774, -56.678640776492, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/624153')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto con cochera a 200 mts del mar', NULL,
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   NULL, 'Obligado Y San Juan', 'San Bernardo', 'Buenos Aires', -36.6863655, -56.6791979, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/624362')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'casa', 'PH Al frente', 'Ph al frente, 3 dormitorios con pequeño fondo.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Drago 600', 'La Lucila del Mar', 'Buenos Aires', -36.674255129424, -56.684956929639, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/624862')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'casa', 'Chalet en lote propio', 'Chalet en lote propio, todos los servicios
impecable estado.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Rebagliatti 500', 'La Lucila del Mar', 'Buenos Aires', -36.659052040215, -56.685869538098, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/624929')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Hermoso lote', 'Medidas 16 x 30',
   25000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Santa Fe Antesquina Fragata Sarmiento', 'Aguas Verdes', 'Buenos Aires', -36.636223239868, -56.696334534298, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/625056')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Importante Chalet', 'Excelente chalet sobre lote de 15 x 40.
tiene 4 dormitorios - 3 baños - cocina comedor - living comedor - cochera para 2 autos - parrilla - lavadero cubierto - horno de barro - amplio fondo',
   120000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas","cochera"]', 'Fragata Sarmiento 333', 'Aguas Verdes', 'Buenos Aires', -36.636952202922, -56.689360506654, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/625060')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Zona en crecimiento', 'Medidas 15 x 30',
   16000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Bouchard Entre San Juan Y Lancha Cromoran', 'Aguas Verdes', 'Buenos Aires', -36.634259632345, -56.699839177832, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/625082')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Triplex para 8 personas', 'Triplex, 3 dormitorios-2 baños completos-cocina comedor-patio con parrilla-entrada de auto-hel con freezer-tv cable-wifi',
   58000, 'USD', NULL, NULL, 4, 2, 8,
   '["wifi","parrilla","heladera"]', 'Catamarca 4081', 'Costa Azul', 'Buenos Aires', -36.6719052, -56.6826868, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/626092')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'cabana', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - entrada de auto techada - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Buenos Aires 538', 'Aguas Verdes', 'Buenos Aires', -36.635848097559, -56.693520226489, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/626849')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'cabana', 'Para 5 Personas', '1 dormitorio - 1 baño - cocina comedor - entrada de auto techada - patio con parrilla y lavadero - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Buenos Aires 538', 'Aguas Verdes', 'Buenos Aires', -36.635865316144, -56.693455853473, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/626850')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Depto 2 ambientes con balcón', 'Departamento 2 ambientes con balcon a la calle. terraza compartida con parrillas.',
   30000, 'USD', NULL, NULL, 1, 1, NULL,
   '["patio","parrilla"]', 'Mitre 2800', 'San Bernardo', 'Buenos Aires', -36.6859218, -56.682468, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/626997')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto con vista al mar', NULL,
   NULL, 'ARS', NULL, NULL, 3, 2, NULL,
   NULL, 'Costanera 2000', 'San Bernardo', 'Buenos Aires', -36.6958327, -56.6769754, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/627100')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'ph', 'PH sobre calle San Juan', 'Ph fondo, todo planta baja
2 dormitorios
1 baño
cocina
living comedor
para 6 personas.
tv cable
wifi
espacio verde con parrilla',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["wifi","parrilla"]', 'San Juan Entre Cordoba Y Santa Fe', 'La Lucila del Mar', 'Buenos Aires', -36.654152851072, -56.682720385458, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/627163')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto con vista al mar', NULL,
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   NULL, 'Costanera 2900', 'San Bernardo', 'Buenos Aires', -36.685824530399, -56.677082265725, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/627200')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'casa', 'COPO 1', '3 unidades de 58mt2s cubiertos cada una.
entrega en septiembre del 2025.
financiacion directa.',
   58000, 'USD', NULL, NULL, 3, 2, NULL,
   NULL, 'Santiago Del Estero', 'La Lucila del Mar', 'Buenos Aires', -36.655863587159, -56.68673100741, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/632528')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'TRIPLEX FRENTE AL MAR', 'Triplex 2 dorm mas altillo- 2 baños- living- cocina comedor integrada- patio con parrilla- tv cable- hel con freezer- wifi- entrada de auto dentro del complejo',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["patio","parrilla","wifi","heladera"]', 'Costanera 5324', 'La Lucila del Mar', 'Buenos Aires', -36.6558532, -56.6807944, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/637950')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'TRIPLEX PARA 5/6 PERSONAS', 'Duplex- 2 dorm- 2 baños- cocina comedor-living- patio con parrilla- entrada de auto- tv cable- hel con freezer- wifi - gas natural',
   NULL, 'ARS', NULL, NULL, 2, 2, 6,
   '["gas","wifi","parrilla","heladera"]', 'Rio Negro 284', 'La Lucila del Mar', 'Buenos Aires', -36.6653572, -56.6823089, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638192')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'DEPARTAMENTOS SOBRE CALLE MENDOZA', '4 deptos en dos plantas-detalles de categoria- 2 dorm en planta alta--2 baños (1 toilette en planta baja, el otro completo en planta alta)-cocina living comedor integrada-tv cable-zona de wifi- ventiladores- espacio verde en comun con churrasquera compartida-hel con freezer- microondas- gas e...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["wifi","microondas","heladera","ventilador"]', 'Mendoza 5037', 'La Lucila del Mar', 'Buenos Aires', -36.6595014, -56.6809664, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638196')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'DUPLEX FRENTE AL MAR', 'Duplex al frente-2 dorm-2 baños (1 toilette)- living-cocina comedor- patio con oarrilla-entrada de auto-tv cable-hel cin freezer-wifi-gas natural',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["gas","wifi","heladera"]', 'Costanera 4894', 'La Lucila del Mar', 'Buenos Aires', -36.661460838508, -56.680054221496, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638329')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'local', 'LOCAL SOBRE REBAGLIATTI A 50 MTS DEL MUELLE AQLUILAD@', NULL,
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Rebagliatti 26', 'La Lucila del Mar', 'Buenos Aires', -36.658681237222, -56.68072039266, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638331')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Excelente depto con vista al mar', NULL,
   NULL, 'ARS', NULL, NULL, 1, 1, NULL,
   NULL, 'Costanera 3370', 'San Bernardo', 'Buenos Aires', -36.6791534, -56.6773647, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638403')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto con vista al mar', 'Depto 2 ambientes con balcón (vista al mar). tercer piso por ascensor, para 4 personas. cuenta con wifi, tv con cable.',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["wifi"]', 'Falkner 120', 'San Bernardo', 'Buenos Aires', -36.6926744, -56.6782234, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638405')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Duplex para 6 personas', NULL,
   NULL, 'ARS', NULL, NULL, 3, 2, 6,
   NULL, 'Santiago Del Estero Y Oro', 'San Bernardo', 'Buenos Aires', -36.689006084717, -56.683240460631, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638406')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'local', 'Local de 30 mts2 sobre Chiozza', NULL,
   35000, 'USD', NULL, NULL, NULL, 1, NULL,
   NULL, 'Chiozza 3332', 'San Bernardo', 'Buenos Aires', -36.6794005, -56.6787208, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/638407')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Depto 2 ambientes (Todo en Planta baja)', NULL,
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   NULL, 'Catamarca Y Obligado', 'Costa Azul', 'Buenos Aires', -36.678122864705, -56.682015203602, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640647')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto para 5 personas con cochera', 'Amplio departamento con 2 dormitorios. 1 baño.',
   NULL, 'ARS', NULL, NULL, 3, 1, 5,
   '["cochera","parrilla"]', 'Catamarca 2051', 'San Bernardo', 'Buenos Aires', -36.6958776, -56.6804916, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640774')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 4/5 Personas', '2 dormitorios (matrimonial en planta alta y el de los chicos en planta baja) - 2 baños completos - cocina comedor - entrada de auto techada - patio propio con parrilla y lavadero - balcon - tv cable - microondas - heladera con freezer - wifi - parque compartido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Chiriguano 35', 'Aguas Verdes', 'Buenos Aires', -36.638516598328, -56.683407928209, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640785')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 4/5 Personas', '2 dormitorios (matrimonial en planta alta y el de los chicos en planta baja) - 2 baños completos - cocina comedor - entrada de auto techada - patio propio con parrilla y lavadero - balcon - tv cable - microondas - heladera con freezer - wifi - parque compartido.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Chiriguano 35', 'Aguas Verdes', 'Buenos Aires', -36.638498749795, -56.683452247522, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640786')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 4 Personas', '2 dormitorios (matrimonial en planta alta y el de los chicos en planta baja) - 2 baños completos - cocina comedor - entrada de auto techada - patio propio con parrilla y lavadero - balcon - tv cable - microondas - heladera con freezer - wifi - parque compartido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 4,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Chiriguano 35', 'Aguas Verdes', 'Buenos Aires', -36.638509296656, -56.68347763945, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640788')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 4/5 Personas', '2 dormitorios (matrimonial en planta alta y el de los chicos en planta baja) - 2 baños completos - cocina comedor - entrada de auto techada - patio propio con parrilla y lavadero - balcon - tv cable - microondas - heladera con freezer - wifi - parque compartido',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Chiriguano 35', 'Aguas Verdes', 'Buenos Aires', -36.638509296656, -56.683299487337, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640789')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'NOVENO EMPRENDIMIENTO 3 CASAS A 40 MTS DEL MAR', 'Son 3 casas que se encuentran a 40 mts del mar con detalles de calidad
unidad 1 frente (vendid0) 2 dormitorios - 2 baños - cocina con living comedor integrado - entrada de auto - patio con parrilla y lavadero.
unidad 2 fondo 2 dormitorios - 2 baños - cocina con living comedor integ...',
   75000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Chiriguano 38', 'Aguas Verdes', 'Buenos Aires', -36.638582115186, -56.683336761902, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640791')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamento sobre Chiozza (con Balcón al frente)', 'Depto 3 ambientes con un balcón amplio al frente. ubicado sobre la calle principal (chiozza). 2 dormitorios. 1 baño. cocina/comedor. 1er piso por ascensor',
   44000, 'USD', NULL, NULL, 2, 1, NULL,
   NULL, 'Chiozza 3332', 'San Bernardo', 'Buenos Aires', -36.6794005, -56.6787208, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640966')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Hermoso triplex para 9/10 personas', 'Hermoso triplex para 10 personas. 3 dormitorios, 2 baños, cocina/comedor, living. tv con cable, wifi, patio con parrilla',
   NULL, 'ARS', NULL, NULL, 3, 1, 10,
   '["wifi","parrilla"]', 'Catamarca 3418', 'San Bernardo', 'Buenos Aires', -36.6787185, -56.6821319, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640969')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Hermoso depto 2 ambientes con terraza', 'Hermoso departamento (2do piso) por escalera, con terraza y parrilla. 1 dormitorio, 1 baño. cocina/comedor.. tv cable. wifi. hel con freezer. entrada de auto.',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["wifi","parrilla","heladera"]', 'Catamarca 3447', 'San Bernardo', 'Buenos Aires', -36.6784783, -56.6816425, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/640971')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 6 Personas', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto techada - patio con parrilla y lavadero - 2 tv cable - microondas - heladera con freezer - aire acondicionado - balcon con vista al pinar - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 6,
   '["wifi","parrilla","aire","lavarropas","microondas","heladera"]', 'Yate Fortuna 163', 'Aguas Verdes', 'Buenos Aires', -36.639834714435, -56.685601317367, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/641229')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto con vista al mar', 'Depto 2 ambientes (tercer piso). balcón con vista al mar. 1 dormitorio matrimonial y 1 cama marinera. luminoso, en buen estado y con una hermosa vista !',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   NULL, 'Costanera 3124', 'San Bernardo', 'Buenos Aires', -36.6820363, -56.6774978, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/641268')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Depto muy lindo para 5/6 personas', 'Muy lindo depto a 100 mts de av san bernardo. cuenta con 2 dormitorios, 1 baño, cocina comedor. tiene wifi y tv con cable. equipado para 6 personas',
   NULL, 'ARS', NULL, NULL, 2, 1, 6,
   '["wifi","amoblado"]', 'Mitre Y Garay', 'San Bernardo', 'Buenos Aires', -36.6881463, -56.6894412, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/641520')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Duplex 4 ambientes', 'Duplex sobre calle tucumán (dentro de zona comercial) con 3 dormitorios, 1 baño, cocina, living/comedor, patio con parrilla, entrada de auto.',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["parrilla"]', 'Tucumán 3143', 'San Bernardo', 'Buenos Aires', -36.682348753195, -56.68481472873, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/641930')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'PH con 3 dormitorios', 'Ph con entrada de auto. cuenta con 3 dormitorios + 1 de estar. 2 baños, cocina, living/comedor, patio con parrilla, wifi, tv con cable, etc.',
   NULL, 'ARS', NULL, NULL, 4, 2, NULL,
   '["wifi","parrilla"]', 'Salta 2052', 'San Bernardo', 'Buenos Aires', -36.6959414, -56.6852494, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/642222')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'PH con 3 dormitorios', 'Ph con 3 dormitorios + 1 dormitorio de estar. cocina, living/comedor, patio con parrilla, entrada de auto, etc',
   52000, 'USD', NULL, NULL, 4, 2, NULL,
   '["patio","cochera","parrilla"]', 'Salta 2045', 'San Bernardo', 'Buenos Aires', -36.6959414, -56.6852494, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/642331')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'HERMOSO LOTE', 'Medidas 16 x 30',
   35000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Belgrano Entre Fragata Sarmiento Y Buenos Aires', 'Aguas Verdes', 'Buenos Aires', -36.636718144111, -56.68904003638, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/642362')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'DEPARTAMENTO', 'Departamento 2do piso por escalera
dos dormitorios, baño, cocina comedor
espacio para el auto
heladera con frezzer
tv con cable
wifi',
   NULL, 'ARS', NULL, NULL, 2, NULL, NULL,
   '["wifi","heladera"]', 'Mendoza 5400', 'La Lucila del Mar', 'Buenos Aires', -36.654306049705, -56.681791210451, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/642400')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamento 3 ambientes con cochera', 'Departamento muy lindo con 2 dormitorios. 1 baño. cocina, living/comedor. cochera cubierta. a 150 mts del mar y 50 metros del centro',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["cochera"]', 'Hernandez 180', 'San Bernardo', 'Buenos Aires', -36.6826045, -56.6792623, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/642499')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Excelente triplex con cochera propia', 'Excelente triplex con 3 dormitorios. 3 baños completos (1 en suite). cocina, living/comedor. patio amplio con parrilla, cochera cubierta (capacidad para 2 autos). gas natural. 195 mts cuadrados cubiertos',
   NULL, 'ARS', NULL, 195, 4, 3, NULL,
   '["gas","parrilla","cochera"]', 'Obligado 417', 'San Bernardo', 'Buenos Aires', -36.6787769, -56.6820727, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/642501')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamento frente al mar (Todo en Planta baja)', 'Departamento frente al mar (a 20 mts de av san bernardo). todo en planta baja. 2 dormitorios. 1 baño. cocina/comedor. tv con cable, wifi, etc.',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["wifi"]', 'Costanera 2864', 'San Bernardo', 'Buenos Aires', -36.6855293, -56.676868, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/643239')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', '2 Duplex en Block en lote de 816mts2', 'Lote de 816 mts2 con 2 duplex.
cada duplex consta de 2 dormitorios - 2 baños - cocina - living comedor- entrada de auto y patioy con parrilla y lavadero. cada unidad tiene 65 mts2 cubiertos.',
   115000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Almirante Brown 1210', 'Aguas Verdes', 'Buenos Aires', NULL, NULL, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/643462')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Depto muy lindo con balcón', 'Departamento en excelentes condiciones. 2 ambientes. 1 dormitorio, 1 baño, balcón de 7 metros. a 200 mts del mar y a 100 mts del centro comercial',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   NULL, 'San Juan Y Zuviria', 'San Bernardo', 'Buenos Aires', -36.6841571, -56.690445, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/643510')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamento con balcón', 'Departamento en excelentes condiciones. 1 dormitorio, 1 baño. balcón de 7 metros. a 200 mts del mar y a 100 mts del centro comercial',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   NULL, 'San Juan Y Zuviria', 'San Bernardo', 'Buenos Aires', -36.6841571, -56.690445, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/643512')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Lote arbolado', 'Circunscripcion iv - sección aa - manzana 178 - lote 18 - medidas 15 x 40',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Buenos Aires Entre Bouchard Y Santiago Del Estero', 'Aguas Verdes', 'Buenos Aires', -36.635187175938, -56.699756854886, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/643865')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamento con balcón', NULL,
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   NULL, 'San Juan Y Zuviria', 'San Bernardo', 'Buenos Aires', -36.683862231283, -56.690453166789, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/645127')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Duplex para 5/6 personas', NULL,
   NULL, 'ARS', NULL, NULL, 3, 2, 6,
   NULL, 'Mitre 3122', 'San Bernardo', 'Buenos Aires', -36.6822404, -56.6829893, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/645681')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'departamento', 'Departamentos sobre Tucumán y Av San Bernardo', 'Departamentos 2 ambientes sobre calle tucumán. a 20 mts de avenida san bernardo.',
   32000, 'USD', NULL, NULL, 2, 1, NULL,
   '["cochera","parrilla"]', 'Tucumán 2943', 'San Bernardo', 'Buenos Aires', -36.6863655, -56.6791979, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/653188')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'local', 'Local con excelente ubicación (cuadra comercial)', 'Local sobre calle tucumán a 20 mts de av san bernardo. excelente estado y muy buena ubicación.',
   44000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Tucumán 2943', 'San Bernardo', 'Buenos Aires', -36.6863655, -56.6791979, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/653191')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'duplex', 'Hermoso Duplex', 'Living - cocina comedor - 2 dormitorios - altillo - 2 baños - entrada de auto- patio con parrilla y lavadero - balcon al frente',
   60000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Rompehielos San Martin 1231', 'Aguas Verdes', 'Buenos Aires', -36.63779880921, -56.687002458583, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/656086')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Excelente ubicacion', '2 dormitorios - 1 baño - cocina - living comedor - entrada de auto - patio con parrilla',
   49000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla"]', 'Buenos Aires Entre Usuhaia Y Santa Fe', 'Aguas Verdes', 'Buenos Aires', NULL, NULL, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/656942')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Duplex al frente', 'Duplex al frente. 2 dormitorios. 1 baño. patio con parrilla. entrada de auto',
   49000, 'USD', NULL, 50, 3, 1, NULL,
   '["parrilla"]', 'Mitre Y Rocha', 'Costa Azul', 'Buenos Aires', -36.678403295628, -56.68317986421, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/658422')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'departamento', 'Departamento con terraza (vista al mar)', 'Departamento frente al mar. terraza con parrilla (vista al mar). primer piso. 2 dormitorios. 1 baño..cocina/comedor.',
   48000, 'USD', NULL, NULL, 3, 1, NULL,
   '["parrilla"]', 'Costanera Y Cordoba', 'La Lucila del Mar', 'Buenos Aires', -36.654391261618, -56.680644496945, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/658426')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'casa', 'Chalet en PH a estrenar', 'Chalet en ph a estrenar. 2 dormitorios, 2 baños, cocina/comedor. patio con parrilla, entrada de auto.
3 unidades',
   64000, 'USD', NULL, 65, 3, 2, NULL,
   '["patio","cochera","parrilla"]', 'Santiago Del Estero Y Corrientes', 'La Lucila del Mar', 'Buenos Aires', -36.65699324011, -56.684624832474, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/658437')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Sobre calle Principal', '15 x 50',
   65000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Fragata Sarmiento Al 100', 'Aguas Verdes', 'Buenos Aires', -36.637286063095, -56.685559555862, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/661333')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Frente a la Sociedad de Fomento', 'Medidas 15 x 40',
   35000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'San Juan Entre 9 De Julio Y Ushuaia', 'Aguas Verdes', 'Buenos Aires', -36.634923020005, -56.693550658256, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/661537')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Hermosa Casa', '2 dormitorios- 2 baños - cocina comedor - living - entrada de auto - patio cubierto con parrilla y lavadero. impecable estado',
   65000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Espora Antes Quina Yate Fortuna', 'Aguas Verdes', 'Buenos Aires', -36.639773429681, -56.686221403354, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/661538')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Excelente Propiedad', '2 dormitorios - 2 baños - living - cocina comedor - entrada de auto - patio con parrilla y lavadero.',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Yate Fortuna Esquina Espora', 'Aguas Verdes', 'Buenos Aires', -36.639794523053, -56.68620306794, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/664409')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'departamento', 'Departamento con vista al mar', 'Muy lindo departamento con vista al mar. 2 dormitorios, 1 baño, cocina, living/comedor, balcón frente y contrafrente.',
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   NULL, 'Costa Era 3306', 'San Bernardo', 'Buenos Aires', -36.6863655, -56.6791979, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/670061')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'OPORTUNIDAD', 'Medidas 15 x 50',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Diaguita 37', 'Aguas Verdes', 'Buenos Aires', -36.636413560266, -56.683933498637, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/673909')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'casa', 'Para 4/5 Personas', '2 dormitorios- 1 baño - cocina - living comedor - entrada de auto - jardín - patio techado con parrilla y lavadero - findo libre - tv cable - microondas - heladera con freezer - lavarropa - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","microondas","heladera"]', 'Yate Fortuna 661', 'Aguas Verdes', 'Buenos Aires', -36.6388967, -56.6958643, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/678823')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'Excelente Propiedad', '2 dormitorios - 2 baños - cocina comedor - living - entrada de auto - patio cubierto con parrilla y lavadero - fondo libre',
   72000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Crucero La Argentina Entre Sanaviron Y Lancha Cormoran', 'Aguas Verdes', 'Buenos Aires', -36.635134970086, -56.685466216891, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/679867')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'casa', 'Chalet en PH 5 personas Fondo', 'Chalet en ph al fondo
todo planta baja
2 dorm, baño, cocina comedor, patio con parrilla, espacio verde
tv cable, hel con freezer, microondas, gas natural, wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","wifi","parrilla","microondas","heladera"]', 'Catamarca 4384', 'Costa Azul', 'Buenos Aires', -36.6683368, -56.6834823, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/680044')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'casa', 'Chalet PH Frente, 5 personas', 'Chalet en ph frente
2 dorm, baño, cocina comedor, living, patio con parrilla.
tv cable, hel con freezer, microondas, gas natural, wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","wifi","parrilla","microondas","heladera"]', 'Catamarca 4384', 'Costa Azul', 'Buenos Aires', -36.6683368, -56.6834823, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/680045')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'casa', 'Chalet en PH', NULL,
   NULL, 'ARS', NULL, NULL, 3, 1, NULL,
   '["patio","parrilla"]', 'Tucuman Y Rebagliatti', 'La Lucila del Mar', 'Buenos Aires', -36.658924, -56.687656366162, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/680750')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'venta', 'lote', '2 LOTES', NULL,
   NULL, 'ARS', NULL, 4000, NULL, NULL, NULL,
   NULL, 'Tucuman Y 5', 'La Lucila del Mar', 'Buenos Aires', -36.648323897637, -56.68876566644, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/680795')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'duplex', 'DUPLEX', NULL,
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Santa Fe', 'La Lucila del Mar', 'Buenos Aires', -36.654138217902, -56.687114250818, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/680808')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 4/5 Personas', '2 dormitorios - 1 baño - cocina - living comedor - entrada de auto - patio con parrilla y lavadero - fondo libre compartido - tv cable - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","parrilla","lavarropas","heladera"]', 'Yate Fortuna 71', 'Aguas Verdes', 'Buenos Aires', -36.639978738997, -56.683876489694, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/684480')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'DECIMO EMPRENDIMIENTO', 'Emprendimiento de 5 propiedades a 30 mts del mar. (2 unidades vendid@s)
cada unidad tiene 2 dormitorios - 2 baños completos - cocina - living comedor - entrada de auto - patio con parrilla y lavadero. se entrega el 40% al boleto y el saldo en 18 cuotas!
detalle constructivo diaguita 32
f...',
   75000, 'USD', NULL, 62, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Diaguita 32', 'Aguas Verdes', 'Buenos Aires', -36.636377537783, -56.68393779401, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/685145')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', 'COMPLEJO DE 4 UNIDADES', '2 dormitorios - 2 baños - cocina - living comedor - entrada de auto - patio con parrilla y lavadero.
ficha tecnica:
termotanque electrico 50 lts marca peisa
cocina con horno a gas
agua fria/caliente con cañeria de termofusion
tanque de agua de 500 lts
puertas de interiores "...',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'San Martin Entre Fragata Sarmiento Y Diaguita', 'Aguas Verdes', 'Buenos Aires', -36.636663879803, -56.68703480213, 'vendida', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/685745')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', '2 Propiedades en Block (Casa + Departamento)', 'Sobre lote de 17 x 26 son 2 propiedades juntas.
la casa tiene 2 dormitoros - 1 baño - cocina - living comedor - entrada de auto - parque con parrilla y lavader. el departamento tiene 1 dormitorio - 1 baño - cocina comedor - lavdero - parque con parrilla',
   98000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Chiriguano Esquina Espora', 'Aguas Verdes', 'Buenos Aires', -36.638381841455, -56.686161044983, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/686226')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Excelente ubicacion', 'Medidas 15 x 45',
   70000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Crucero La Argentina Entre Yate Fortuna Y Chiriguano', 'Aguas Verdes', 'Buenos Aires', -36.639183200263, -56.684873975931, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/686508')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'temporario', 'duplex', 'Para 5 Personas', '2 dormitorios - 1 baño - cocina comedor - living - quincho cerrado - entrada de auto - parque libre compartido - balcon - tv cable - microondas - heladera con freezer - wifi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, 5,
   '["wifi","microondas","heladera"]', 'Yate Fortuna 71', 'Aguas Verdes', 'Buenos Aires', -36.639962296883, -56.684069105828, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/687261')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'temporario', 'duplex', 'Triplex a 300 mts del mar', 'Triplex muy bien ubicado, con el mejor equipamiento y a 300 mts del mar.',
   NULL, 'ARS', NULL, NULL, 4, 2, NULL,
   NULL, 'La Rioja 3315', 'San Bernardo', 'Buenos Aires', -36.6798641, -56.6805263, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/688762')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'alquiler', 'departamento', 'Departamento a 200 mts del mar', 'Departamento a 200 mts del mar y a 100 mts del centro comercial. 2 ambientes (para 4 personas).',
   NULL, 'ARS', NULL, NULL, 2, 1, NULL,
   '["mascotas"]', 'San Juan 3260', 'San Bernardo', 'Buenos Aires', -36.6805517, -56.6796828, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/689348')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Muy buena esquina', 'Medidas 16 x 30',
   25000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Entre Ríos Esquina Ushuaia', 'Aguas Verdes', 'Buenos Aires', -36.637408409994, -56.69476150253, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/689430')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 1, 'temporario', 'departamento', 'Excelente Departamento Planta Baja', 'Departamento 3 ambientes
dormitorio con cama matrimonial
dormitorio con 2 camas individuales
cocina comedor, baño, patio propio con parrilla
tv cable, hel con freezer, microondas, wifi, aire acondicionado
gas natural
entrada de auto, frente al complejo
en comun pileta y jaquzzi',
   NULL, 'ARS', NULL, NULL, NULL, NULL, NULL,
   '["gas","wifi","parrilla","pileta","aire","microondas","heladera"]', 'San Juan 5155', 'La Lucila del Mar', 'Buenos Aires', -36.6579959, -56.6821962, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/691129')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Hermosa Esquina', 'Medidas 16 x 30',
   25000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Fragata Sarmiento Esquina Santiago Del Estero', 'Aguas Verdes', 'Buenos Aires', -36.636195543811, -56.698321632083, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/693394')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'casa', '11° EMPRENDIMIENTO', 'Complejo de 4 unidades (1 vendid@)
2 dormitorios - 2 baños - cocina comedor - entrada de auto - patio con parrilla y lavadero.
se puede entregar un anticipo y cuotas!',
   60000, 'USD', NULL, NULL, NULL, NULL, NULL,
   '["parrilla","lavarropas"]', 'Belgrano Esquina Brown', 'Aguas Verdes', 'Buenos Aires', -36.637969615668, -56.689084104236, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/704256')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 3, 'venta', 'lote', 'Zona en crecimiento', 'Medidas 18 x 22',
   15000, 'USD', NULL, NULL, NULL, NULL, NULL,
   NULL, 'Lancha Cormoran Esquina Seaver', 'Aguas Verdes', 'Buenos Aires', -36.633280065786, -56.705490990367, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/704311')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');

INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', 1, 2, 'venta', 'duplex', 'Duplex a 400 mts del mar', NULL,
   NULL, 'ARS', NULL, 55, 3, 2, NULL,
   NULL, 'Catamarca 3100', 'San Bernardo', 'Buenos Aires', -36.6825957, -56.6816016, 'disponible', 1, 'https://www.elmuellepropiedades.com.ar/propiedad/704495')
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');
