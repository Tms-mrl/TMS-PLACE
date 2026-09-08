-- CoopenPlaces · 0021 · saca site_settings.share_message.
-- El mensaje de "Compartir por WhatsApp" ahora se arma solo en el panel (título +
-- ubicación + link + precio calculado por temporada), sin apartado en Configuración.
ALTER TABLE site_settings DROP COLUMN share_message;
