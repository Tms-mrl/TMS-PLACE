-- CoopenPlaces · 0028 · Correo: asignar un hilo a una persona del equipo (ej. "esto es
-- para Nico"), no solo a una sucursal — caso real: alguien del equipo recibe correo
-- personal por la misma casilla compartida. assigned_by/assigned_at (0023) son la
-- provenance de reasignar SUCURSAL, un concepto distinto; esto es aparte.
ALTER TABLE mail_threads ADD COLUMN assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_mail_threads_assigned_user ON mail_threads (assigned_user_id);
