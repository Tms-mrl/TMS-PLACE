-- CoopenPlaces · 0029 · código de la propiedad (ej. "AV-CAS-72")
--
-- El código con el que el cliente identifica cada aviso en BuscadorProp. Texto libre (los
-- formatos varían: "AV-CAS-72", "SB DTO 620", "624"), editable, NO único: dos avisos
-- pueden repetirlo y no queremos que eso bloquee una carga. Se muestra en la tarjeta del
-- Inventario y el buscador de texto lo incluye. No viaja en mensajes de WhatsApp/correo.
ALTER TABLE properties ADD COLUMN code TEXT;
