// Importador de Argenprop: parsea el HTML del aviso (JSON-LD + inputs + meta) y
// extrae los datos + las fotos. Validado contra avisos reales. Scraping = frágil:
// si Argenprop cambia el markup o bloquea el acceso, degradar con gracia.

export type ImportDraft = {
  title: string | null;
  operation: string | null;
  kind: string | null;
  price: number | null;
  currency: string;
  rooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  city: string | null;
  province: string | null;
  address: string | null;
  description: string | null;
  amenities: string[];
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toInt(v: string | undefined | null): number | null {
  if (v == null) return null;
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

// Comodidades detectadas SOLO en la descripción del aviso (evita falsos positivos
// de leer toda la página). "Sin garage" no cuenta como cochera.
function amenitiesFromText(desc: string): string[] {
  const low = ` ${desc.toLowerCase()} `;
  const found: string[] = [];
  const push = (k: string) => { if (!found.includes(k)) found.push(k); };
  if (/gas\s+natural/.test(low)) push('gas');
  if (/\bwi-?fi\b|internet/.test(low)) push('wifi');
  if (/parrilla|asador/.test(low)) push('parrilla');
  if (/pileta|piscina/.test(low)) push('pileta');
  if (/aire\s+acond/.test(low)) push('aire');
  if (/calefacc/.test(low)) push('calefaccion');
  if (/amoblad|amueblad/.test(low)) push('amoblado');
  if (/seguridad|vigilancia|24\s?h/.test(low)) push('seguridad');
  if (/patio|jard[ií]n|terraza/.test(low)) push('patio');
  if (/(cochera|garage|garaje)/.test(low) && !/sin\s+(cochera|garage|garaje)/.test(low)) push('cochera');
  if (/lavarropas|lavader/.test(low)) push('lavarropas');
  if (/acepta.{0,10}mascota|pet\s?friendly/.test(low)) push('mascotas');
  return found;
}

export function parseArgenprop(html: string, url: string): { draft: ImportDraft; images: string[] } {
  let ld: Record<string, any> = {};
  const ldm = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldm && ldm[1]) { try { ld = JSON.parse(ldm[1]); } catch { /* ignora */ } }

  const operation = /en-alquiler-temporario/.test(url) ? 'temporario'
    : /en-venta/.test(url) ? 'venta'
    : /en-alquiler/.test(url) ? 'alquiler' : null;

  const typeMap: Record<string, string> = { Apartment: 'departamento', House: 'casa', SingleFamilyResidence: 'casa' };
  const kind = ld['@type']
    ? (typeMap[ld['@type'] as string] || String(ld['@type']).toLowerCase())
    : ((url.match(/\/([a-z]+)-en-/) || [])[1] || null);

  const price = toInt((html.match(/name="Precio"[^>]*value="([0-9]+)"/i) || [])[1]);
  const monedaM = html.match(/name="Moneda"[^>]*value="([^"]+)"/i);
  const currency = monedaM && /USD|U\$S/i.test(monedaM[1] || '') ? 'USD' : 'ARS';

  const text = decodeEntities(html);
  const rooms = toInt((text.match(/([0-9]+)\s*ambiente/i) || [])[1])
    ?? (ld.numberOfBedrooms != null ? Number(ld.numberOfBedrooms) : toInt((text.match(/([0-9]+)\s*dormitorio/i) || [])[1]));
  const bathrooms = toInt((text.match(/([0-9]+)\s*ba[ñn]o/i) || [])[1]);
  const area_m2 = toInt((text.match(/([0-9]+)\s*m²/i) || text.match(/([0-9]+)\s*m2\b/i) || [])[1]);

  const descRaw = (html.match(/<meta content="([^"]+)"\s+name="description">/i)
    || html.match(/<meta name="description"\s+content="([^"]+)"/i) || [])[1] || String(ld.description || '');
  const description = decodeEntities(descRaw) || null;

  const addr = (ld.address || {}) as Record<string, any>;
  const city = ((String(addr.addressLocality || '').split(',')[0]) || '').trim() || null;
  const address = [addr.streetAddress, addr.addressRegion].filter(Boolean).map((x) => decodeEntities(String(x))).join(', ') || null;

  const title = decodeEntities(String(ld.name || (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '')).replace(/\s*\|\s*Argenprop\s*$/i, '') || null;

  // Galería: static-content/<mediaId>/<uuid> → variante _u_medium.jpg. Únicas.
  const uuids = [...new Set(html.match(/static-content\/\d+\/[a-f0-9-]{36}/gi) || [])];
  const images = uuids.map((u) => `https://www.argenprop.com/${u}_u_medium.jpg`);

  return {
    draft: { title, operation, kind, price, currency, rooms, bathrooms, area_m2, city, province: null, address, description, amenities: amenitiesFromText(description || '') },
    images,
  };
}
