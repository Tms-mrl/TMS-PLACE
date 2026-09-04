-- CoopenPlaces · 0002 · consultas por WhatsApp (click-to-chat)
-- WhatsApp del publicante: a nivel inmobiliaria y a nivel propietario particular.
-- El migrate script tolera "duplicate column" → re-ejecutable.

ALTER TABLE agencies ADD COLUMN whatsapp TEXT;
ALTER TABLE places_profiles ADD COLUMN whatsapp TEXT;
-- Origen de la consulta (whatsapp | web) para el registro en inquiries.
ALTER TABLE inquiries ADD COLUMN source TEXT;
