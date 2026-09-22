import { MONTHS_ES, type SeasonPrice } from './types';

const DAY_MS = 86_400_000;

function parseRows(seasonJson: string | null | undefined): SeasonPrice[] {
  try { return JSON.parse(seasonJson || '[]') as SeasonPrice[]; } catch { return []; }
}

/** Días del rango [from, to] (YYYY-MM-DD), inclusive → "del 1 al 4" = 4. `null` si las
 *  fechas no parsean o `to` < `from`. La usa `quoteForRange` y el label "N días x $..."
 *  del mensaje de "Compartir" (`properties-panel.tsx`). */
export function rangeNights(from: string, to: string): number | null {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to || from}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parte [from, to] en tramos que no cruzan un mes calendario. La tarifa vive por mes
 *  (una fila de `property_season_prices` por mes), así que un rango que cruza de mes —
 *  ej. 29/12 al 15/1 — hay que cotizarlo mes a mes y sumar; antes del fix (2026-09-22)
 *  `quoteForRange` solo miraba el mes de `from` y cotizaba TODO el rango con esa fila
 *  (18 noches cobradas como si fueran todas de la quincena de diciembre). */
function splitByMonth(from: string, to: string): { from: string; to: string }[] {
  const segments: { from: string; to: string }[] = [];
  let cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur.getTime() <= end.getTime()) {
    const lastOfMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const segEnd = lastOfMonth.getTime() < end.getTime() ? lastOfMonth : end;
    segments.push({ from: fmtDate(cur), to: fmtDate(segEnd) });
    cur = new Date(segEnd.getTime() + DAY_MS);
  }
  return segments;
}

/** Cotiza un tramo QUE NO CRUZA DE MES (ver reglas abajo). Falla (`null`) si no hay fila
 *  para ese mes o falta el precio del tramo que corresponde. */
function quoteMonthSegment(rows: SeasonPrice[], from: string, to: string): number | null {
  const n = rangeNights(from, to);
  if (n == null) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const row = rows.find((r) => r.month === start.getMonth() + 1);
  if (!row) return null;

  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const isFullMonth = start.getDate() === 1 && end.getDate() === lastDay;
  if (isFullMonth && row.price_month != null) return row.price_month;

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

/**
 * Precio a cotizar para un rango de fechas [from, to] (YYYY-MM-DD, inclusive), a partir
 * de las tarifas por temporada de la propiedad (`Property.season_prices`, JSON que trae
 * /mine). Devuelve el monto en ARS, o `null` si no se puede calcular: sin fecha `from`,
 * o sin precio cargado en algún tramo del rango (si el rango cruza de mes y falta la
 * tarifa de UNO de los meses, se devuelve `null` para todo el rango — mejor no mostrar
 * precio que mostrar uno incompleto).
 *
 * Reglas por tramo dentro de un mismo mes (acordadas con el usuario, 2026-09-08;
 * prorrateo de semana sumado 2026-09-11; mes completo → price_month sumado 2026-09-18;
 * split por mes al cruzar de mes sumado 2026-09-22, ver `splitByMonth`):
 *  - N = días del tramo contados inclusive → "del 1 al 4" = 4.
 *  - Quincena: 1ª = días 1-15, 2ª = 16-fin. Si el tramo cruza la mitad de mes, se usa la
 *    2ª quincena cuando le caen 3 días o más.
 *  - Del día 1 al último del mes (mismo mes): precio de mes fijo (`price_month`), si
 *    está cargado — sin esto, un mes de 30/31 días caía en la regla de abajo (N ≥ 14)
 *    y devolvía la tarifa de la 2ª quincena, no la del mes entero.
 *  - Tramo por bloques (el resto de los casos): N ≤ 6 → precio por día × N · 7 ≤ N ≤ 13
 *    → precio semana ÷ 7 × N (prorrateado) · N ≥ 14 → precio quincena (fijo).
 *  - Un rango que cruza de mes (ej. 29/12 al 15/1) se parte en un tramo por mes y se
 *    suman: 29-31/12 (3 noches, por día) + 1-15/1 (15 noches, = la 1ª quincena entera).
 */
export function quoteForRange(seasonJson: string | null | undefined, from: string, to: string): number | null {
  if (!from) return null;
  const rows = parseRows(seasonJson);
  if (!rows.length) return null;
  if (rangeNights(from, to || from) == null) return null;

  let total = 0;
  for (const seg of splitByMonth(from, to || from)) {
    const amount = quoteMonthSegment(rows, seg.from, seg.to);
    if (amount == null) return null;
    total += amount;
  }
  return total;
}

/** Tarifa más próxima a `today` (sin filtro de fechas): recorre las quincenas desde la
 *  actual hacia adelante (con vuelta al año) y toma la primera que tenga algún precio. Dentro
 *  de esa quincena prefiere la unidad más chica: día → semana → quincena → mes. `null` si no
 *  hay ninguna tarifa con importe. */
export function nearestRate(
  seasonJson: string | null | undefined,
  today: Date = new Date(),
): { amount: number; unit: 'día' | 'semana' | 'quincena' | 'mes'; label: string } | null {
  const byMonth = new Map(parseRows(seasonJson).map((r) => [r.month, r]));
  if (!byMonth.size) return null;
  const firstHalf = today.getDate() >= 16 ? 1 : 0;
  for (let i = 0; i < 24; i++) {
    const idx = today.getMonth() * 2 + firstHalf + i;
    const month = (Math.floor(idx / 2) % 12) + 1;
    const q2 = idx % 2 === 1;
    const r = byMonth.get(month);
    if (!r) continue;
    const label = `${MONTHS_ES[month - 1]!.slice(0, 3).toLowerCase()} ${q2 ? 2 : 1}ª quinc.`;
    const day = q2 ? r.price_day_q2 : r.price_day_q1;
    const week = q2 ? r.price_week_q2 : r.price_week_q1;
    const fortnight = q2 ? r.price_fortnight_q2 : r.price_fortnight_q1;
    if (day != null) return { amount: day, unit: 'día', label };
    if (week != null) return { amount: week, unit: 'semana', label };
    if (fortnight != null) return { amount: fortnight, unit: 'quincena', label };
    if (r.price_month != null) return { amount: r.price_month, unit: 'mes', label };
  }
  return null;
}

/** Qué precio muestra la tarjeta del Inventario (y por cuál se ordena). `null` = la propiedad
 *  no tiene tarifas por temporada → se usa el precio fijo (`p.price`, ej. una venta).
 *  Con tarifas: con fechas filtradas → la cotización de ese rango ('quote'); sin fechas → la
 *  tarifa más próxima a hoy ('nearest'); si ninguna aplica → 'none' (NO se cae al precio
 *  fijo: en una propiedad de temporada ese es el de venta y confunde). Todo en ARS. */
export type SeasonDisplay =
  | { kind: 'quote'; amount: number }
  | { kind: 'nearest'; amount: number; unit: string; label: string }
  | { kind: 'none' };

export function seasonDisplay(seasonJson: string | null | undefined, from: string, to: string, today?: Date): SeasonDisplay | null {
  if (!parseRows(seasonJson).length) return null;
  if (from) {
    const amount = quoteForRange(seasonJson, from, to);
    return amount != null ? { kind: 'quote', amount } : { kind: 'none' };
  }
  const n = nearestRate(seasonJson, today);
  return n ? { kind: 'nearest', ...n } : { kind: 'none' };
}
