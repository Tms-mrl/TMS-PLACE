-- CoopenPlaces · 0017 · link externo del aviso + texto para compartir por WhatsApp
--
-- El cliente (El Muelle) tiene su cartera cargada en un sitio propio: lo que se comparte
-- por WhatsApp desde el panel tiene que ser la URL de ESE aviso, no la ficha interna.
-- `external_url` la llena la importación de la cartera (o se edita a mano en el form).
--
-- `share_message` es el texto que la inmobiliaria escribe una vez en Configuración; al
-- compartir se manda ese texto y debajo el/los link(s). Singleton igual que `brand_name`.
-- Default NULL: sin configurar, el mensaje es solo el link.
ALTER TABLE properties ADD COLUMN external_url TEXT;
ALTER TABLE site_settings ADD COLUMN share_message TEXT;
