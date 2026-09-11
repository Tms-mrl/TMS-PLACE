import type { SeasonPrice } from './types';

const DAY_MS = 86_400_000;

/** Días del rango [from, to] (YYYY-MM-DD), inclusive → "del 1 al 4" = 4. `null` si las
 *  fechas no parsean o `to` < `from`. La usa `quoteForRange` y el label "N días x $..."
 *  del mensaje de "Compartir" (`properties-panel.tsx`). */
export function rangeNights(from: string, to: string): number | null {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to || from}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

/**
 * Precio a cotizar para un rango de fechas [from, to] (YYYY-MM-DD, inclusive), a partir
 * de las tarifas por temporada de la propiedad (`Property.season_prices`, JSON que trae
 * /mine). Devuelve el monto en ARS, o `null` si no se puede calcular: sin fecha `from`,
 * sin tarifa para ese mes, o sin precio cargado en el tramo que corresponde.
 *
 * Reglas (acordadas con el usuario, 2026-09-08; prorrateo de semana sumado 2026-09-11):
 *  - N = días del rango contados inclusive → "del 1 al 4" = 4.
 *  - Mes = el de la fecha de inicio. Quincena: 1ª = días 1-15, 2ª = 16-fin. Si el rango
 *    cruza la mitad de mes, se usa la 2ª quincena cuando le caen 3 días o más.
 *  - Tramo por bloques: N ≤ 6 → precio por día × N · 7 ≤ N ≤ 13 → precio semana ÷ 7 × N
 *    (prorrateado) · N ≥ 14 → precio quincena (fijo).
 */
export function quoteForRange(seasonJson: string | null | undefined, from: string, to: string): number | null {
  if (!from) return null;
  let rows: SeasonPrice[];
  try { rows = JSON.parse(seasonJson || '[]') as SeasonPrice[]; } catch { return null; }
  if (!rows.length) return null;

  const n = rangeNights(from, to);
  if (n == null) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to || from}T00:00:00`);
  const row = rows.find((r) => r.month === start.getMonth() + 1);
  if (!row) return null;

  let daysInQ2 = 0;
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    if (new Date(t).getDate() >= 16) daysInQ2++;
  }
  const q2 = daysInQ2 >= 3;
  const day = q2 ? row.price_day_q2 : row.price_day_q1;
  const week = q2 ? row.price_week_q2 : row.price_week_q1;
  const fortnight = q2 ? row.price_fortnight_q2 : row.price_fortnight_q1;

  if (n >= 14) return fortnight ?? null;
  if (n >= 7) return week != null ? (week / 7) * n : null;
  return day != null ? day * n : null;
}
