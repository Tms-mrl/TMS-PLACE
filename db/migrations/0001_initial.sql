-- CoopenPlaces · 0001 · esquema inicial
-- Gestión inmobiliaria (inmobiliarias + propietarios) + marketplace público.
-- SQLite/D1. El coopen_sub de CoopenAuth se guarda como TEXT (regla root §3).

-- Usuario = espejo local de la identidad CoopenAuth.
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  coopen_sub  TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL,
  name        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rol(es) del user DENTRO de Places (no en la identidad global). Un mismo user
-- puede ser propietario particular Y buscador/inquilino. La pertenencia a una
-- inmobiliaria va aparte (agency_members).
CREATE TABLE IF NOT EXISTS places_profiles (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_owner   INTEGER NOT NULL DEFAULT 0,  -- propietario particular
  is_tenant  INTEGER NOT NULL DEFAULT 0,  -- busca alquiler/compra
  onboarded  INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Inmobiliaria (organización B2B). El creador queda como owner/admin.
CREATE TABLE IF NOT EXISTS agencies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  legal_name    TEXT,
  tax_id        TEXT,
  logo_key      TEXT,               -- key en R2 (MEDIA)
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Suscripción 1:1 por agencia. Gobierna el gate de acceso a la gestión.
-- status: trial | active | blocked. En v0 lo maneja Charly a mano (Admin de Coopen).
CREATE TABLE IF NOT EXISTS subscriptions (
  agency_id     INTEGER PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TEXT,               -- datetime del fin del trial (30d por defecto)
  active_until  TEXT,               -- si status=active y se pagó hasta cierta fecha
  notes         TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branches (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id  INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Miembro de una agencia (agente). role: admin | manager | agent.
CREATE TABLE IF NOT EXISTS agency_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id  INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'agent',
  branch_id  INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (agency_id, user_id)
);

-- Propiedad. owner_kind: agency | particular. Publicada = aparece en el marketplace.
CREATE TABLE IF NOT EXISTS properties (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_kind    TEXT NOT NULL,                 -- 'agency' | 'particular'
  agency_id     INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  branch_id     INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  owner_user_id INTEGER REFERENCES users(id),  -- dueño particular o creador
  operation     TEXT NOT NULL,                 -- 'venta' | 'alquiler' | 'temporario'
  kind          TEXT,                          -- casa | departamento | ph | local | terreno...
  title         TEXT NOT NULL,
  description    TEXT,
  price         REAL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  area_m2       REAL,
  rooms         INTEGER,
  amenities     TEXT,                          -- JSON array
  address       TEXT,
  city          TEXT,
  province      TEXT,
  lat           REAL,
  lng           REAL,
  status        TEXT NOT NULL DEFAULT 'disponible', -- disponible|reservada|alquilada|vendida
  published     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_properties_public
  ON properties (published, operation, city);
CREATE INDEX IF NOT EXISTS idx_properties_agency ON properties (agency_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner  ON properties (owner_user_id);

-- Fotos / planos / documentos de la propiedad (el binario vive en R2).
CREATE TABLE IF NOT EXISTS property_media (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  r2_key      TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'photo',  -- photo | plan | doc
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_property ON property_media (property_id, sort);

-- CRM de la agencia: propietarios en consignación + interesados.
CREATE TABLE IF NOT EXISTS clients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id  INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'interesado', -- propietario | interesado
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  notes      TEXT,
  prefs      TEXT,                               -- JSON: preferencias de búsqueda
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clients_agency ON clients (agency_id);

-- Encargo/mandato: relación agencia ↔ propietario sobre una propiedad.
CREATE TABLE IF NOT EXISTS mandates (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id      INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  property_id    INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id      INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  exclusive      INTEGER NOT NULL DEFAULT 0,
  commission_pct REAL,
  ends_at        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pipeline de operaciones (embudo).
CREATE TABLE IF NOT EXISTS deals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id     INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  property_id   INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  client_id     INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  agent_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  stage         TEXT NOT NULL DEFAULT 'visita', -- visita|oferta|reserva|firma|cerrada|perdida
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_deals_agency ON deals (agency_id, stage);

-- Consulta del marketplace (interesado → publicante) + agenda de visita.
CREATE TABLE IF NOT EXISTS inquiries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id  INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT,
  email        TEXT,
  phone        TEXT,
  message      TEXT,
  visit_at     TEXT,
  status       TEXT NOT NULL DEFAULT 'nueva',  -- nueva|contactado|agendada|cerrada
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries (property_id, status);

-- Favoritos y búsquedas guardadas del turista/inquilino.
CREATE TABLE IF NOT EXISTS favorites (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_json TEXT NOT NULL,
  notify     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
