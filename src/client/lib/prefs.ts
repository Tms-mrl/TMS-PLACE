// Preferencias del interesado (lo que busca) — lectura compartida por la lista de
// contactos, la ficha y el modal de coincidencias.
//
// Hay DOS escrituras dando vueltas en las bases: el form del CRM guardaba
// `max_price`/`min_rooms` y las carteras cargadas por seed (El Muelle) tienen
// `maxPrice`/`rooms`/`capacity`/`currency`. Leer solo una hacía que el presupuesto y las
// personas no se vieran en pantalla ni se usaran en el cruce. Se aceptan las dos acá y en
// el worker (`routes/clients.ts`) en vez de migrar el JSON en producción.
export type Prefs = {
  operation: string | null;
  city: string | null;
  max_price: number | null;
  currency: string | null;
  min_rooms: number | null;
  capacity: number | null;
};

export function readPrefs(raw: string | null): Prefs {
  let p: Record<string, unknown> = {};
  try { p = JSON.parse(raw || '{}') as Record<string, unknown>; } catch { /* prefs rotas → sin criterios */ }
  const n = (...keys: string[]) => {
    for (const k of keys) { const v = Number(p[k]); if (p[k] != null && Number.isFinite(v)) return v; }
    return null;
  };
  const s = (k: string) => (typeof p[k] === 'string' && p[k] ? String(p[k]) : null);
  const cur = s('currency')?.toUpperCase() || null;
  return {
    operation: s('operation'),
    city: s('city'),
    max_price: n('max_price', 'maxPrice'),
    currency: cur === 'ARS' || cur === 'USD' ? cur : null,
    min_rooms: n('min_rooms', 'minRooms', 'rooms'),
    capacity: n('capacity'),
  };
}

/** Los criterios en una línea: "temporario · Mar de las Pampas · 4 personas · hasta $ 160.000". */
export function prefsSummary(raw: string | null): string {
  const p = readPrefs(raw);
  const sym = p.currency === 'USD' ? 'US$ ' : p.currency === 'ARS' ? '$ ' : '';
  const bits = [
    p.operation,
    p.city,
    p.capacity ? `${p.capacity} personas` : null,
    p.min_rooms ? `${p.min_rooms}+ amb` : null,
    p.max_price ? `hasta ${sym}${p.max_price.toLocaleString('es-AR')}` : null,
  ].filter(Boolean);
  return bits.length ? bits.join(' · ') : 'Sin preferencias cargadas';
}
