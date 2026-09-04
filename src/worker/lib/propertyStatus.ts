// El estado general de una propiedad (disponible/reservada/alquilada) se calcula
// desde sus bookings, no se guarda a mano — solo 'vendida' es una decisión manual
// (properties.status guarda únicamente 'vendida' | 'disponible' como sentinel).
export const BOOKING_KINDS = ['reserva', 'alquiler'];

// Interpolar como `${COMPUTED_STATUS_SQL} AS status` en cualquier SELECT que tenga
// la propiedad aliaseada como "p". Sin params: las fechas se comparan contra
// date('now') adentro del propio SQL.
// El WHEN p.id IS NULL importa cuando "p" viene de un LEFT JOIN sin match (ej. una
// sucursal sin propiedades): sin esa guarda, una fila toda NULL cae en el ELSE y
// se cuenta como 'disponible' fantasma en vez de quedar NULL como el resto de p.*.
export const COMPUTED_STATUS_SQL = `
  CASE
    WHEN p.id IS NULL THEN NULL
    WHEN p.status = 'vendida' THEN 'vendida'
    WHEN EXISTS (
      SELECT 1 FROM bookings bk WHERE bk.property_id = p.id
        AND bk.kind = 'alquiler' AND bk.from_date <= date('now') AND bk.to_date >= date('now')
    ) THEN 'alquilada'
    WHEN EXISTS (
      SELECT 1 FROM bookings bk WHERE bk.property_id = p.id
        AND ((bk.from_date <= date('now') AND bk.to_date >= date('now')) OR bk.from_date > date('now'))
    ) THEN 'reservada'
    ELSE 'disponible'
  END
`;
