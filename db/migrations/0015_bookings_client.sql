-- CoopenPlaces · 0015 · la reserva apunta a un contacto del CRM, no a un texto suelto.
-- El "huésped / referencia" escrito a mano no servía para nada después (no se podía
-- cruzar con el contacto, ni con sus operaciones ni con sus contratos). Ahora la reserva
-- guarda client_id; guest_name se conserva para las filas viejas y como fallback de
-- display. Default NULL: requisito de SQLite para ADD COLUMN con REFERENCES.
ALTER TABLE bookings ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings (client_id);
