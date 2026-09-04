import { parseAmenities } from './amenities';
import type { Property } from './types';

/**
 * Qué tan completo está un aviso, y qué le falta.
 *
 * No es una barra decorativa: cada punto es una cosa que, si falta, hace que el aviso
 * rinda menos en el marketplace (sin fotos nadie clickea, sin ubicación no sale en el
 * mapa, sin descripción no aparece en la búsqueda por texto). Por eso devuelve también
 * la LISTA de lo que falta — una barra al 60% sin decir qué falta no sirve para nada.
 *
 * Todos los ítems pesan igual a propósito: así el porcentaje se puede explicar
 * ("te faltan 2 de 7") en vez de ser un número que sale de una fórmula que nadie ve.
 */
export type Completeness = { pct: number; done: number; total: number; missing: string[] };

/** Una descripción de menos de esto es un placeholder, no una descripción. */
const MIN_DESC = 120;
/** Con menos de 3 fotos el aviso se ve vacío en la ficha pública. */
const MIN_PHOTOS = 3;

export function completeness(p: Property): Completeness {
  const amen = parseAmenities(p.amenities);
  const specs = [p.rooms, p.bathrooms, p.area_m2].filter((v) => v != null && Number(v) > 0).length;

  const checks: { ok: boolean; falta: string }[] = [
    { ok: (p.photos ?? 0) >= MIN_PHOTOS, falta: `fotos (al menos ${MIN_PHOTOS})` },
    { ok: p.price != null && p.price > 0, falta: 'precio' },
    { ok: !!p.city, falta: 'ciudad' },
    { ok: !!p.address, falta: 'dirección' },
    { ok: p.lat != null && p.lng != null, falta: 'ubicación en el mapa' },
    { ok: (p.description || '').trim().length >= MIN_DESC, falta: 'descripción' },
    { ok: specs >= 2, falta: 'ambientes / baños / superficie' },
    { ok: amen.length >= 3, falta: 'comodidades' },
  ];

  const missing = checks.filter((c) => !c.ok).map((c) => c.falta);
  const total = checks.length;
  const done = total - missing.length;
  return { pct: Math.round((done / total) * 100), done, total, missing };
}

/** Tono de la barra. El corte en 100 es a propósito: "casi listo" no es "listo". */
export function completenessTone(pct: number): 'low' | 'mid' | 'full' {
  if (pct >= 100) return 'full';
  if (pct >= 50) return 'mid';
  return 'low';
}

/** Texto del tooltip: qué le falta a este aviso, en una línea. */
export function completenessHint(c: Completeness): string {
  if (!c.missing.length) return 'Aviso completo ✓';
  return `${c.done} de ${c.total} · falta ${c.missing.join(', ')}`;
}
