import { MONTHS_ES, type SeasonPrice } from './types';

const DAY_MS = 86_400_000;

function parseRows(seasonJson: string | null | undefined): SeasonPrice[] {
  try { return JSON.parse(seasonJson || '[]') as SeasonPrice[]; } catch { return []; }
}

/** Redondeo "lindo" para un precio COTIZADO (calculado, no cargado a mano — acordado con
 *  el usuario, 2026-09-14, al principio solo para el mensaje de "Compartir"; sumado acá
 *  2026-09-22 para que la tarjeta del Inventario muestre lo mismo): primero se pierde todo
 *  lo que esté debajo de los $1.000 (trunca), y ese resto en miles siempre sube al múltiplo
 *  de 50 más cercano — o sea, redondea para arriba a los $50.000.
 *  Ej: 1.049.001 → 1.050.000 · 1.051.000 → 1.100.000 · 1.050.500 → 1.050.000 ·
 *      1.542.857,14 (prorrateo de semana) → 1.550.000.
 *  Solo se aplica a precios COTIZADOS (`quoteForRange`, ej. semana ÷ 7 × N con decimales);
 *  una tarifa cargada tal cual (día/semana/quincena/mes de `nearestRate`) o el precio fijo
 *  de la propiedad se muestran exactos, nunca redondeados — son números que el usuario
 *  escribió a mano, no calculados. */
export function roundPrice(amount: number): number {
  const thousands = Math.floor(amount / 1000);
  return Math.ceil(thousands / 50) * 50 * 1000;
}

/** Noches del rango [from, to), CHECK-OUT EXCLUIDO: el último día del filtro es el de
 *  salida (~10am, no se cobra como noche — mismo criterio "half-open" que ya rige los
 *  solapamientos de reservas, ver `bookedInRange` en properties-panel.tsx y el fix de
 *  Calendario del 2026-09-12; sumado acá el 2026-09-22 a pedido del usuario: "del 1 al 8"
 *  son 7 noches, no 8). Sin `to` (o `to === from`, el atajo de "un solo día" clickeado en
 *  el selector de fechas) se cuenta como 1 noche esa noche — no 0. `null` si las fechas no
 *  parsean o `to` < `from`. La usa `quoteForRange` (indirectamente, ver `effectiveCheckout`)
 *  y el label "N días x $..." del mensaje de "Compartir" (`properties-panel.tsx`) — ahí solo
 *  como chequeo de "hay rango válido", nunca se muestra el número. */
export function rangeNights(from: string, to: string): number | null {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to || from}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
}

/** [from, checkout) partido en tramos que no cruzan un mes calendario, todos medio-abiertos
 *  (fin excluido) — el fin de cada tramo intermedio es el 1° del mes siguiente (un corte de
 *  tabla de tarifas, NO un checkout real: la persona sigue ahí); el fin del ÚLTIMO tramo es
 *  el `checkout` real de toda la estadía, el único que de verdad no se cobra. Así un rango
 *  que cruza de mes (ej. 29/12 al 15/1, checkout 15/1) se cotiza mes a mes y se suma, sin
 *  perder una noche de más en cada corte de mes (antes del fix de 2026-09-22 `quoteForRange`
 *  solo miraba el mes de `from` y cotizaba TODO el rango con esa fila). */
function splitByMonth(from: Date, checkout: Date): { start: Date; endExclusive: Date }[] {
  const segments: { start: Date; endExclusive: Date }[] = [];
  let cur = from;
  while (cur.getTime() < checkout.getTime()) {
    const firstOfNextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const segEnd = firstOfNextMonth.getTime() < checkout.getTime() ? firstOfNextMonth : checkout;
    segments.push({ start: cur, endExclusive: segEnd });
    cur = segEnd;
  }
  return segments;
}

/** Día en que ENTRA la 2ª quincena, por mes. Por defecto el 16; febrero es la excepción: la
 *  1ª sale el 15 y la 2ª entra ese mismo 15 (acordado con el dueño, 2026-09-25 — es una tabla
 *  a propósito: si cambia una fecha, se edita acá y listo). */
const Q2_IN_DAY: Partial<Record<number, number>> = { 2: 15 };

/** Calendario de "paquetes" del dueño para un mes: cada período es una tarifa de `SeasonPrice`
 *  con fecha de entrada y de salida FIJAS (la salida es el día que se van ~10am, no se cobra
 *  como noche). Todos los meses siguen el patrón de enero — mes 1→último día · 1ª quincena
 *  1→15 · 2ª quincena 16→último día — con la excepción de `Q2_IN_DAY`. El dueño dictó dic (2ª
 *  16→31), ene, feb y mar (1ª 1→15); el resto de los meses se asumió por el mismo patrón.
 *  "Último día" se calcula (feb 2027 = 28; en bisiesto sería 29, no confirmado).
 *  Orden = prioridad: el mes va primero (feb 1→1/3 es "mes + 1 día", no 1ª + 2ª quincena). */
function periodsOf(y: number, month: number) {
  const m0 = month - 1;
  const at = (day: number) => new Date(y, m0, day);
  const last = new Date(y, m0 + 1, 0);
  return [
    { field: 'price_month', start: at(1), out: last },
    { field: 'price_fortnight_q1', start: at(1), out: at(15) },
    { field: 'price_fortnight_q2', start: at(Q2_IN_DAY[month] ?? 16), out: last },
  ] as const;
}

/** Reconoce si el tramo [start, endExclusive) (que no cruza de mes) es un período de
 *  `periodsOf` — entra en su fecha de entrada, sale en la de salida — y devuelve su precio,
 *  sin importar cuántas noches sean. Si el tramo es un período + 1 día más hasta el 1° del
 *  mes siguiente (ej. 1/2 al 1/3 con el mes de febrero 1→28, o 16/1 al 1/2 con la 2ª quincena
 *  16→31), suma ese día: se cobra a la tarifa por día de la 1ª quincena del mes SIGUIENTE
 *  ("1 mes + 1 día, por el de marzo" — el dueño, 2026-09-25); si falta esa tarifa devuelve
 *  `null` (mejor sin precio que incompleto). `undefined` = ningún período aplica (o el período
 *  no tiene precio cargado): seguir con las reglas genéricas por noches. */
function quotePeriod(rows: SeasonPrice[], row: SeasonPrice, start: Date, endExclusive: Date): number | null | undefined {
  const firstOfNextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  for (const p of periodsOf(start.getFullYear(), row.month)) {
    const price = row[p.field];
    if (price == null || start.getTime() !== p.start.getTime()) continue;
    if (endExclusive.getTime() === p.out.getTime()) return price;
    if (endExclusive.getTime() === firstOfNextMonth.getTime() && Math.round((firstOfNextMonth.getTime() - p.out.getTime()) / DAY_MS) === 1) {
      const dayNext = rows.find((r) => r.month === firstOfNextMonth.getMonth() + 1)?.price_day_q1;
      return dayNext != null ? price + dayNext : null;
    }
  }
  return undefined;
}

/** Cotiza un tramo [start, endExclusive) QUE NO CRUZA DE MES. Falla (`null`) si no hay fila
 *  para ese mes o falta el precio del tramo que corresponde. */
function quoteMonthSegment(rows: SeasonPrice[], start: Date, endExclusive: Date): number | null {
  const n = Math.round((endExclusive.getTime() - start.getTime()) / DAY_MS);
  if (n <= 0) return null;
  const row = rows.find((r) => r.month === start.getMonth() + 1);
  if (!row) return null;

  // Período exacto del calendario del dueño (mes / 1ª / 2ª quincena) — antes que cualquier
  // regla por noches. La quincena y el mes SOLO se cobran así, por fecha exacta.
  const byPeriod = quotePeriod(rows, row, start, endExclusive);
  if (byPeriod !== undefined) return byPeriod;

  let nightsInQ2 = 0;
  const q2From = Q2_IN_DAY[row.month] ?? 16;
  for (let t = start.getTime(); t < endExclusive.getTime(); t += DAY_MS) {
    if (new Date(t).getDate() >= q2From) nightsInQ2++;
  }
  const q2 = nightsInQ2 >= 3;
  const day = q2 ? row.price_day_q2 : row.price_day_q1;
  const week = q2 ? row.price_week_q2 : row.price_week_q1;

  // Semana = 7 noches ("se tiene en cuenta semana cuando tiene 7 noches", el dueño,
  // 2026-09-25): cada bloque completo de 7 noches cobra la tarifa de semana y las noches que
  // sobran van a la tarifa por día — ya no se prorratea la semana ni hay un precio fijo de
  // quincena para "14 noches o más" (eso hacía que 15 y 16 noches dieran lo mismo). Si falta la
  // tarifa que hace falta → `null`.
  const weeks = Math.floor(n / 7);
  const rest = n % 7;
  if (weeks > 0 && week == null) return null;
  if (rest > 0 && day == null) return null;
  return weeks * (week ?? 0) + rest * (day ?? 0);
}

/**
 * Precio a cotizar para un rango de fechas [from, to] (YYYY-MM-DD), a partir de las
 * tarifas por temporada de la propiedad (`Property.season_prices`, JSON que trae /mine).
 * `to` es el día de CHECKOUT — no se cobra como noche (ver `rangeNights`). Devuelve el
 * monto en ARS, o `null` si no se puede calcular: sin fecha `from`, o sin precio cargado
 * en algún tramo del rango (si el rango cruza de mes y falta la tarifa de UNO de los
 * meses, se devuelve `null` para todo el rango — mejor no mostrar precio que uno incompleto).
 *
 * Reglas por tramo dentro de un mismo mes (acordadas con el usuario y el dueño; split por mes
 * y checkout excluido 2026-09-22 — ver `splitByMonth`/`rangeNights`; períodos por fecha y
 * semana = 7 noches 2026-09-25, que reemplazaron al prorrateo de semana, al precio fijo de
 * quincena para "14 noches o más" y al mes completo por 1°→1°):
 *  - N = noches del tramo, checkout EXCLUIDO → "del 1 al 8" son 7 noches, no 8.
 *  - Períodos (`periodsOf`): un tramo que entra y sale EXACTO en las fechas de un período cobra
 *    la tarifa de ese período (mes / 1ª quincena / 2ª quincena), sin importar cuántas noches
 *    sean. Ej. enero: 1ª = 1 al 15, 2ª = 16 al 31, mes = 1 al 31; febrero: 1ª = 1 al 15, 2ª = 15
 *    al 28, mes = 1 al 28. Período + 1 día hasta el 1° del mes siguiente (ej. 1/2 al 1/3) =
 *    precio del período + 1 día a la tarifa por día de la 1ª quincena del mes siguiente.
 *    Ver `quotePeriod`. Quincena y mes NO se cobran de ninguna otra forma.
 *  - Todo lo demás (estadía que no es un período): bloques de 7 noches a la tarifa de semana +
 *    las noches sobrantes a la tarifa por día. N ≤ 6 → día × N. 10 noches = semana + 3 días.
 *    La quincena (1ª = días 1-15, 2ª = 16-fin; en feb la 2ª entra el 15) sale de qué quincena
 *    le caen 3 noches o más al tramo — una sola para todo el tramo.
 *  - Un rango que cruza de mes (ej. 29/12 al 15/1, checkout 15/1) se parte en un tramo por
 *    mes y se suman: 29-31/12 (3 noches, por día) + 1-14/1 (14 noches, = la 1ª quincena).
 */
export function quoteForRange(seasonJson: string | null | undefined, from: string, to: string): number | null {
  if (!from) return null;
  const rows = parseRows(seasonJson);
  if (!rows.length) return null;

  const start = new Date(`${from}T00:00:00`);
  const rawTo = new Date(`${to || from}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(rawTo.getTime()) || rawTo.getTime() < start.getTime()) return null;
  // Checkout efectivo: si to===from (un solo día clickeado en el selector — mismo atajo que
  // el resto del panel, ver `dFrom`/`dTo` en properties-panel.tsx), es 1 noche esa noche;
  // si no, `to` YA es el día de salida real (no se cobra), igual que bookedInRange.
  const checkout = rawTo.getTime() === start.getTime() ? new Date(start.getTime() + DAY_MS) : rawTo;

  let total = 0;
  for (const seg of splitByMonth(start, checkout)) {
    const amount = quoteMonthSegment(rows, seg.start, seg.endExclusive);
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
    // Redondeado acá (no dentro de quoteForRange): la cotización cruda la siguen usando
    // el filtro "Con precio" (solo mira si hay tarifa, != null) y el orden por precio, a
    // los que no les importa el redondeo. Lo que se muestra en pantalla sí va redondeado.
    return amount != null ? { kind: 'quote', amount: roundPrice(amount) } : { kind: 'none' };
  }
  const n = nearestRate(seasonJson, today);
  return n ? { kind: 'nearest', ...n } : { kind: 'none' };
}
