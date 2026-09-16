import { quoteForRange, rangeNights } from './season-price';
import type { Property } from './types';

// Armador del bloque "Compartir": nació adentro de `shareProps` (properties-panel.tsx,
// Inventario → WhatsApp) y se extrajo acá para reusarlo tal cual en el composer del
// apartado "Correo" (adjuntar propiedades a una respuesta de mail). Mismo formato:
//   🏡<nombre> - 📍<dirección, ciudad>
//   <link del aviso>
//   <día X al Y x $precio>   ← calculado desde "Precios por temporada" según el rango [from, to]
// La línea de precio se omite si no hay `from` o la propiedad no tiene esa tarifa.

type ShareableProperty = Pick<Property, 'title' | 'address' | 'city' | 'external_url' | 'season_prices'>;

/** "Del 1/1 al 5/1" — siempre con el mes al lado del día, mismo mes o cruzando de mes
 *  (ej. "Del 28/1 al 3/2"). `to` ya viene resuelto (= from si es un solo día). Devuelve
 *  "El D/M" si el rango es de un único día. */
function dayRangeLabel(from: string, to: string): string {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const d1 = `${start.getDate()}/${start.getMonth() + 1}`;
  const d2 = `${end.getDate()}/${end.getMonth() + 1}`;
  return d1 === d2 ? `El ${d1}` : `Del ${d1} al ${d2}`;
}

/** Redondeo "lindo" para el precio del mensaje (acordado con el usuario, 2026-09-14):
 *  primero se pierde todo lo que esté debajo de los $1.000 (trunca), y ese resto en
 *  miles siempre sube al múltiplo de 50 más cercano — o sea, redondea para arriba a
 *  los $50.000. Ej: 1.049.001 → 1.050.000 · 1.051.000 → 1.100.000 · 1.050.500 → 1.050.000. */
function roundPrice(amount: number): number {
  const thousands = Math.floor(amount / 1000);
  return Math.ceil(thousands / 50) * 50 * 1000;
}

export function shareBlock(p: ShareableProperty, from?: string, to?: string): string {
  const where = [p.address, p.city].filter(Boolean).join(', ');
  // Base = título (que ya suele traer "- dirección, ciudad", ver migración 0022); si es
  // una propiedad sin eso, se lo sumamos. Después partimos en el último " - " para meter
  // 🏡 antes del nombre y 📍 antes de la ubicación.
  const base = where && p.address && !p.title.includes(p.address) ? `${p.title} - ${where}` : p.title;
  const cut = base.lastIndexOf(' - ');
  const l1 = cut === -1 ? `🏡${base}` : `🏡${base.slice(0, cut)} - 📍${base.slice(cut + 3)}`;
  const lines = [l1];
  if (p.external_url) lines.push(p.external_url);
  const price = from ? quoteForRange(p.season_prices ?? null, from, to || from) : null;
  if (price != null) {
    const n = rangeNights(from!, to || from!);
    const range = n ? `${dayRangeLabel(from!, to || from!)} x ` : '';
    lines.push(`${range}$${roundPrice(price).toLocaleString('es-AR')}`);
  }
  return lines.join('\n');
}

/** Varias propiedades → un bloque por propiedad, separados por un renglón en blanco. */
export function shareBlocks(list: ShareableProperty[], from?: string, to?: string): string {
  return list.map((p) => shareBlock(p, from, to)).join('\n\n');
}
