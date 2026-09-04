import { useEffect, useState } from 'react';

// Recuerda qué claves (tabs) ya se visitaron, para poder mantener esos paneles
// montados y ocultos (en vez de desmontarlos) al cambiar de tab — así no pierden su
// estado/datos ya cargados ni vuelven a pedirle todo a la API al volver.
export function useVisited<T>(current: T): Set<T> {
  const [visited, setVisited] = useState<Set<T>>(() => new Set([current]));
  useEffect(() => {
    setVisited((v) => (v.has(current) ? v : new Set(v).add(current)));
  }, [current]);
  return visited;
}
