-- CoopenPlaces · 0025 · operación secundaria de la propiedad.
-- `operation` sigue siendo la operación PRINCIPAL (alquiler | venta | temporario); esta
-- columna guarda una segunda, opcional. Caso de uso (El Muelle): propiedades de temporario
-- que además están en venta → operation='temporario', operation_secondary='venta'. Los
-- filtros/búsquedas matchean cualquiera de las dos. NULL = solo la principal.
-- Solo el ALTER: el runner re-ejecuta todo, así que el pase de datos (venta → temporario
-- + venta) NO va acá — se hizo una sola vez a mano.
ALTER TABLE properties ADD COLUMN operation_secondary TEXT;
