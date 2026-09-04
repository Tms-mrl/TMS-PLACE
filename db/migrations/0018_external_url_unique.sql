-- CoopenPlaces · 0018 · external_url único (para el import idempotente de cartera)
--
-- El import masivo de la cartera de un cliente (ver scripts/import-elmuelle.mjs) usa
-- `INSERT ... ON CONFLICT(external_url) DO UPDATE`, que necesita un índice único sobre
-- la columna. Parcial (`WHERE external_url IS NOT NULL`): las propiedades cargadas a mano
-- no tienen link externo y no deben chocar entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_external_url
  ON properties (external_url) WHERE external_url IS NOT NULL;
