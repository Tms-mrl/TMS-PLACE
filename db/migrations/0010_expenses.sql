-- CoopenPlaces · 0010 · gastos por propiedad (reparaciones, limpieza, impuestos, servicios…)
-- Módulos A (inmobiliaria) y B (propietario particular): registrar egresos por propiedad
-- para gestionar ingresos vs gastos (P&L). Espeja el scope de contracts:
-- owner_kind = agency | particular (agency_id ó owner_user_id). Los ingresos ya viven
-- en receipts (recibos cobrados); esta tabla es el lado de los egresos.

CREATE TABLE IF NOT EXISTS expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_kind    TEXT NOT NULL,                       -- 'agency' | 'particular'
  agency_id     INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id   INTEGER REFERENCES properties(id) ON DELETE SET NULL, -- NULL = gasto general (sin propiedad)
  category      TEXT NOT NULL DEFAULT 'otro',        -- reparacion|limpieza|impuestos|servicios|expensas|mantenimiento|comision|seguro|otro
  description   TEXT,                                -- detalle corto ("Arreglo de canilla del 2º")
  amount        REAL NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'ARS',
  incurred_on   TEXT,                                -- YYYY-MM-DD (fecha del gasto)
  paid          INTEGER NOT NULL DEFAULT 1,          -- 1 pagado / 0 pendiente
  vendor        TEXT,                                -- proveedor (opcional)
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_expenses_agency   ON expenses (agency_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner    ON expenses (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses (property_id);
