-- CoopenPlaces · 0014 · el calendario pasa a gobernar el estado de la propiedad
-- bookings.kind distingue reserva/alquiler (antes todo era un bloqueo sin tipo); el
-- estado disponible/reservada/alquilada se calcula desde acá, no se guarda más.
-- properties.archived_at: propiedades vendidas y cerradas salen de la lista activa
-- sin borrarse (quedan como historial).

ALTER TABLE bookings ADD COLUMN kind TEXT NOT NULL DEFAULT 'reserva';
ALTER TABLE properties ADD COLUMN archived_at TEXT;
