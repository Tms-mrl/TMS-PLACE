-- CoopenPlaces · 0008 · contratos + recibos + alerta de búsquedas guardadas
-- Módulos A (inmobiliaria) y B (propietario): alquileres/ventas con vencimientos,
-- aumentos por índice y cobros/recibos con estado de mora.

-- Contrato de alquiler/venta sobre una propiedad. owner_kind = agency | particular:
-- lo puede llevar una inmobiliaria (agency_id) o un propietario particular (owner_user_id).
CREATE TABLE IF NOT EXISTS contracts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_kind    TEXT NOT NULL,                     -- 'agency' | 'particular'
  agency_id     INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id   INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  client_id     INTEGER REFERENCES clients(id) ON DELETE SET NULL, -- inquilino/comprador (CRM de la agencia)
  tenant_name   TEXT,                              -- por si no está en el CRM (propietario particular)
  tenant_phone  TEXT,
  operation     TEXT NOT NULL DEFAULT 'alquiler',  -- 'alquiler' | 'venta'
  amount        REAL,                              -- monto (mensual si alquiler, total si venta)
  currency      TEXT NOT NULL DEFAULT 'ARS',
  deposit       REAL,                              -- depósito/garantía
  start_date    TEXT,                              -- YYYY-MM-DD
  end_date      TEXT,                              -- vencimiento del contrato
  adjust_months INTEGER,                           -- cada cuántos meses ajusta (ICL/trimestral/etc)
  adjust_index  TEXT,                              -- nombre del índice (ICL, IPC, %, libre)
  status        TEXT NOT NULL DEFAULT 'activo',    -- activo | vencido | rescindido | finalizado
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contracts_agency ON contracts (agency_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_owner  ON contracts (owner_user_id, status);

-- Recibo/cobro de un contrato (una cuota o el pago total).
CREATE TABLE IF NOT EXISTS receipts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  period      TEXT,                                -- 'YYYY-MM' que cubre (alquiler) o 'seña'/'total'
  amount      REAL NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'ARS',
  paid_at     TEXT,                                -- fecha de cobro (NULL = pendiente/mora)
  method      TEXT,                                -- efectivo | transferencia | ...
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_receipts_contract ON receipts (contract_id);

-- Alerta de búsquedas guardadas: marca de la última notificación por email enviada
-- (el cron manda solo las propiedades nuevas desde esta fecha).
ALTER TABLE saved_searches ADD COLUMN last_notified_at TEXT;
