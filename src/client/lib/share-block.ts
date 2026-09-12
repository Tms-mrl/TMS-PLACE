import { quoteForRange, rangeNights } from './season-price';
import type { Property } from './types';

// Armador del bloque "Compartir": nació adentro de `shareProps` (properties-panel.tsx,
// Inventario → WhatsApp) y se extrajo acá para reusarlo tal cual en el composer del
// apartado "Correo" (adjuntar propiedades a una respuesta de mail). Mismo formato:
//   🏡<nombre> - 📍<dirección, ciudad>
//   <link del aviso>
//   <N días x $precio>   ← calculado desde "Precios por temporada" según el rango [from, to]
// La línea de precio se omite si no hay `from` o la propiedad no tiene esa tarifa.

type ShareableProperty = Pick<Property, 'title' | 'address' | 'city' | 'external_url' | 'season_prices'>;

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
    const days = n ? `${n} día${n === 1 ? '' : 's'} x ` : '';
    lines.push(`${days}$${Math.round(price).toLocaleString('es-AR')}`);
  }
  return lines.join('\n');
}

/** Varias propiedades → un bloque por propiedad, separados por un renglón en blanco. */
export function shareBlocks(list: ShareableProperty[], from?: string, to?: string): string {
  return list.map((p) => shareBlock(p, from, to)).join('\n\n');
}
