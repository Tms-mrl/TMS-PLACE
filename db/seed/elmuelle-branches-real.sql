-- El Muelle · las 3 sucursales/oficinas REALES (Partido de la Costa).
-- La seed vieja (ElMuelle/seed/01-agencia.sql) tenía sucursales ficticias de otra zona
-- (Villa Gesell / Mar de las Pampas / Pinamar). El import de cartera asigna branch_id por
-- localidad contra estos ids:  1 = La Lucila del Mar · 2 = San Bernardo · 3 = Aguas Verdes
--
--   npx wrangler d1 execute coopen-places-db --local --file=db/seed/elmuelle-branches-real.sql
--
-- Datos de contacto tomados del sitio público (elmuellepropiedades.com.ar). Idempotente.

UPDATE agencies SET name='El Muelle Propiedades', whatsapp='+54 2257 46-2498'
  WHERE id=1;

INSERT INTO branches (id, agency_id, name, address, phone) VALUES
  (1, 1, 'La Lucila del Mar', 'Rebagliati 12, La Lucila del Mar', '02257 46-2498'),
  (2, 1, 'San Bernardo',      'Chiozza 3332, San Bernardo',       '02257 46-2498'),
  (3, 1, 'Aguas Verdes',      'Fragata Sarmiento 12, Aguas Verdes','02257 46-2498')
ON CONFLICT(id) DO UPDATE SET
  name=excluded.name, address=excluded.address, phone=excluded.phone;

-- El seed viejo dejaba al usuario dueño en branch 1; sigue válido (ahora es La Lucila).
