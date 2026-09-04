// Catálogo de comodidades (espejo del worker). Se guardan como JSON array de keys.
export const AMENITIES: { key: string; label: string; icon: string }[] = [
  { key: 'wifi', label: 'WiFi', icon: '📶' },
  { key: 'gas', label: 'Gas natural', icon: '🔥' },
  { key: 'gas_envasado', label: 'Gas envasado (a cargo del inquilino)', icon: '🛢️' },
  { key: 'tv', label: 'TV / Cable', icon: '📺' },
  { key: 'directv', label: 'TV por DirecTV prepago', icon: '📡' },
  { key: 'aire', label: 'Aire acond.', icon: '❄️' },
  { key: 'calefaccion', label: 'Calefacción', icon: '🌡️' },
  { key: 'cochera', label: 'Cochera', icon: '🚗' },
  { key: 'pileta', label: 'Pileta', icon: '🏊' },
  { key: 'parrilla', label: 'Parrilla', icon: '🍖' },
  { key: 'patio', label: 'Patio / Jardín', icon: '🌳' },
  { key: 'lavarropas', label: 'Lavarropas', icon: '🧺' },
  { key: 'amoblado', label: 'Amoblado', icon: '🛋️' },
  { key: 'mascotas', label: 'Acepta mascotas', icon: '🐾' },
  { key: 'seguridad', label: 'Seguridad', icon: '🛡️' },
  { key: 'heladera', label: 'Heladera/freezer', icon: '🧊' },
  { key: 'microondas', label: 'Microondas', icon: '⏲️' },
  { key: 'ventilador', label: 'Ventilador', icon: '🌀' },
];

export function parseAmenities(json: string | null | undefined): string[] {
  if (!json) return [];
  try { const a = JSON.parse(json); return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []; } catch { return []; }
}
