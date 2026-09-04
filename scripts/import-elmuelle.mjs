#!/usr/bin/env node
// Importador one-shot de la cartera de El Muelle desde su sitio de BuscadorProp
// (elmuellepropiedades.com.ar) a CoopenPlaces. NO es sync: se corre una vez para
// traer las ~251 propiedades publicadas. Idempotente por `external_url`.
//
//   node scripts/import-elmuelle.mjs scrape          # baja las fichas -> listings.json (+ cache)
//   node scripts/import-elmuelle.mjs stats           # resumen para revisar el mapeo
//   node scripts/import-elmuelle.mjs sql             # listings.json -> db/seed/elmuelle-import.sql
//   node scripts/import-elmuelle.mjs photos --local  # sube las fotos a R2 + property_media
//
// Flags: --fresh (ignora la cache), --limit=N (solo N fichas, para probar), --agency=1
//
// El sitio carga el listado con scroll infinito: GET /propiedades?infinito=1&pagina=N
// devuelve un JSON array con el HTML de cada card. La ficha /propiedad/<id> es HTML
// server-rendered y parseable. Las fotos tienen URL predecible en staticbp.com.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKDIR = resolve(ROOT, 'scripts/.import-elmuelle');
const CACHE = resolve(WORKDIR, 'cache');
const LISTINGS = resolve(WORKDIR, 'listings.json');
const SQL_OUT = resolve(ROOT, 'db/seed/elmuelle-import.sql');

const BASE = 'https://www.elmuellepropiedades.com.ar';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const args = process.argv.slice(2);
const cmd = args[0];
const FRESH = args.includes('--fresh');
const LOCAL = args.includes('--local') ? '--local' : '--remote';
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0;
const AGENCY_ID = Number((args.find((a) => a.startsWith('--agency=')) || '').split('=')[1]) || 1;
const isWin = process.platform === 'win32';

// ── util ──────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// El JSON-LD del sitio a veces viene doblemente escapado (&amp;ntilde; en vez de &ntilde;),
// así que las entidades se resuelven en dos pasadas: la 1ra saca &amp; -> &, dejando
// &ntilde; al descubierto; la 2da ya lo convierte en la letra con tilde.
function decodeOnce(s) {
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é').replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó').replace(/&uacute;/gi, 'ú').replace(/&uuml;/gi, 'ü')
    .replace(/&Ntilde;/g, 'Ñ').replace(/&ntilde;/gi, 'ñ')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/gi, '&');
}
function decode(s) {
  if (s == null) return null;
  return decodeOnce(decodeOnce(String(s)))
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim() || null;
}
const digits = (s) => {
  const n = parseInt(String(s || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

async function grab(url, { json = false } = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'es-AR,es;q=0.9', ...(json ? { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } : {}) },
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return json ? await r.json() : await r.text();
    } catch (e) {
      if (i === 2) throw e;
      await sleep(600 * (i + 1));
    }
  }
}

// ── mapeos ────────────────────────────────────────────────────────────────────
const KIND_MAP = {
  'casas': 'casa', 'casa': 'casa', 'chalets': 'casa', 'chalet': 'casa',
  'cabañas': 'cabana', 'cabanas': 'cabana', 'cabaña': 'cabana',
  'departamentos': 'departamento', 'departamento': 'departamento',
  'departamentos tipo casa': 'departamento', 'ph': 'ph',
  'dúplex/tríplex': 'duplex', 'duplex/triplex': 'duplex', 'dúplex': 'duplex', 'tríplex': 'duplex',
  'lotes/terrenos': 'lote', 'lotes': 'lote', 'terrenos': 'lote', 'lote': 'lote',
  'locales': 'local', 'local': 'local', 'inmuebles comerciales': 'local', 'hoteles': 'local',
};
// localidad -> branch_id (las 3 oficinas reales; ver db/seed/elmuelle-branches-real.sql)
//   1 = Rebagliati 12 (La Lucila del Mar) · 2 = Chiozza 3332 (San Bernardo) · 3 = Fragata Sarmiento 12 (Aguas Verdes)
const BRANCH_BY_CITY = {
  'la lucila del mar': 1,
  'san bernardo': 2, 'costa azul': 2, 'costa del este': 2, 'mar del tuyú': 2, 'mar del tuyu': 2, 'mar de ajó': 2, 'mar de ajo': 2,
  'aguas verdes': 3, 'lucila del mar': 1,
};
// texto de la comodidad (BuscadorProp) -> key nuestra (worker/lib/amenities.ts)
const AMEN_MAP = {
  'con patio': 'patio', 'con jardín': 'patio', 'con jardin': 'patio',
  'con parrilla': 'parrilla', 'parrilla': 'parrilla',
  'con cochera': 'cochera', 'con cochera/estacionamiento': 'cochera', 'cochera': 'cochera',
  'con pileta': 'pileta', 'pileta': 'pileta',
  'acepta mascotas': 'mascotas',
  'con wifi': 'wifi', 'con wi-fi': 'wifi', 'wifi': 'wifi',
  'con aire acondicionado': 'aire',
  'con calefacción': 'calefaccion', 'con calefaccion': 'calefaccion',
};
// comodidades inferidas desde la descripción (además de las marcadas en la ficha)
function amenitiesFromText(desc) {
  const low = ` ${(desc || '').toLowerCase()} `;
  const out = [];
  const add = (k) => { if (!out.includes(k)) out.push(k); };
  if (/gas\s+natural/.test(low)) add('gas');
  if (/gas\s+envasad|garrafa|zeppelin/.test(low)) add('gas_envasado');
  if (/wi-?fi|internet/.test(low)) add('wifi');
  if (/parrilla|asador/.test(low)) add('parrilla');
  if (/pileta|piscina/.test(low)) add('pileta');
  if (/aire\s+acond/.test(low)) add('aire');
  if (/calefacc|losa radiante|split fr[ií]o.calor/.test(low)) add('calefaccion');
  if (/amoblad|amueblad|equipad[oa]/.test(low)) add('amoblado');
  if (/lavarropas|lavader/.test(low)) add('lavarropas');
  if (/(cochera|garage|garaje)/.test(low) && !/sin\s+(cochera|garage|garaje)/.test(low)) add('cochera');
  if (/directv|direct tv/.test(low)) add('directv');
  if (/(smart\s?tv|tv por cable|cablevision|tv led|televis)/.test(low)) add('tv');
  if (/acepta.{0,12}mascota|pet\s?friendly|se admiten mascotas/.test(low)) add('mascotas');
  if (/microondas/.test(low)) add('microondas');
  if (/heladera|freezer/.test(low)) add('heladera');
  if (/ventilador/.test(low)) add('ventilador');
  if (/vigilancia|seguridad 24|barrio cerrado|country/.test(low)) add('seguridad');
  return out;
}
const OP_MAP = (label) => {
  const l = (label || '').toLowerCase();
  if (/temporal|temporari/.test(l)) return 'temporario';
  if (/alquiler/.test(l)) return 'alquiler';
  if (/venta/.test(l)) return 'venta';
  return null;
};
const PERIOD_MAP = (s) => {
  const l = (s || '').toLowerCase();
  if (/noche/.test(l)) return 'noche';
  if (/semana|quincena/.test(l)) return 'semana';
  if (/d[ií]a/.test(l)) return 'dia';
  if (/mes/.test(l)) return 'mes';
  return '';
};
// El <meta name="description"> trae la localidad en minúsculas ("aguas verdes", "la
// lucila del mar"): esto la deja legible sin inventar una lista cerrada de localidades.
const CITY_LOWER_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
function titleCaseCity(s) {
  return s.trim().toLowerCase().split(/\s+/)
    .map((w, i) => (i > 0 && CITY_LOWER_WORDS.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── parseo de una ficha ───────────────────────────────────────────────────────
function parseFicha(id, html) {
  const w = [];
  const external_url = `${BASE}/propiedad/${id}`;
  const pick = (re) => { const m = html.match(re); return m ? m[1] : null; };

  const titleRaw = decode(pick(/<h1[^>]*class="[^"]*prop-details__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i))
    || decode(pick(/<meta property="og:title" content="([^"]*)"/i))?.replace(/\s*-\s*El Muelle Propiedades\s*$/i, '')
    || `Propiedad ${id}`;
  // La ficha pública no tiene un badge de "Vendida": la única señal es que alguien de
  // El Muelle escribió "VENDID@"/"VENDID0" (leet, con o sin paréntesis) en el título a
  // mano. Se detecta, se marca el estado, y se limpia el título para no duplicarlo.
  const SOLD_RE = /\(?\s*(?:totalmente\s+)?vendid\s*[oa0@]s?\s*\)?/i;
  const isSold = SOLD_RE.test(titleRaw);
  const title = isSold
    ? (titleRaw.replace(new RegExp(SOLD_RE, 'gi'), ' ').replace(/\(\s*\)/g, '')
        .replace(/\s+[0@]+\s*$/, '') // resto de un "VENDID00"/"VENDID@@" con más de un dígito/arroba
        .replace(/\s{2,}/g, ' ').trim() || titleRaw)
    : titleRaw;

  // Precio + operación: la ficha ya elige UNA operación para mostrar.
  const priceSec = (html.match(/<section id="Precio"[\s\S]{0,1200}?<\/section>/i) || [''])[0];
  const opLabel = decode(pick(/class="price__label-text"[^>]*>([\s\S]*?)</i)) || '';
  const priceVal = decode((priceSec.match(/class="price__value"[^>]*>([\s\S]*?)</i) || [])[1]) || '';
  let operation = OP_MAP(opLabel);
  if (!operation) { operation = 'alquiler'; w.push(`operación desconocida ("${opLabel}") -> alquiler`); }
  let price = /consultar|desde|^\s*$/i.test(priceVal) ? null : digits(priceVal);
  let currency = /u\$s|usd|d[óo]lar/i.test(priceVal) ? 'USD' : /€|euro/i.test(priceVal) ? 'USD' : 'ARS';
  if (/€|euro/i.test(priceVal)) w.push('precio en €: se marcó USD');
  if (price == null) w.push('sin precio (Consultar)');
  const price_period = operation === 'temporario' ? PERIOD_MAP(opLabel + ' ' + priceSec) : '';

  // Personas (temporario): "Para 5 Personas" / "Para 5/6 Personas" -> capacidad (la mayor).
  let capacity = null;
  const capM = title.match(/Para\s+(\d+)(?:\/(\d+))?\s+Personas/i);
  if (capM) capacity = Math.max(+capM[1], +(capM[2] || capM[1]));

  // Tipo + localidad: el <meta name="description"> sigue el patrón fijo
  // "<Título> - <Tipo> en <Localidad> - El Muelle Propiedades" (confirmado contra 250+ fichas).
  const metaDesc = decode(pick(/<meta name="description" content="([^"]*)"/i)) || '';
  const md = metaDesc.match(/-\s*([^-]+?)\s+en\s+([^-]+?)\s*-\s*El Muelle/i);
  const kindRaw = (md ? md[1] : '').trim();
  // "Lotes / Terrenos" -> "lotes/terrenos" antes de buscar en KIND_MAP (el sitio a veces
  // pone espacios alrededor de la barra en el nombre de la categoría).
  const kindNorm = kindRaw.toLowerCase().replace(/\s*\/\s*/g, '/');
  const kind = KIND_MAP[kindNorm] || (kindRaw ? kindRaw.toLowerCase() : null);
  if (!kind) w.push('sin tipo');

  // Features: "4 Ambientes", "2 baños", "3 Dormitorios", "120 m² ...", "Estado ..."
  let rooms = null, bathrooms = null, bedrooms = null, area_m2 = null, area_kind = null;
  const featList = (html.match(/prop-details__features-list[\s\S]{0,2500}?<\/ul>/i) || [''])[0];
  for (const m of featList.matchAll(/prop-details__feature-text"?\s*>([\s\S]*?)<\/span>/gi)) {
    const t = decode(m[1]) || '';
    let mm;
    if ((mm = t.match(/^(\d+)\s*ambiente/i))) rooms = +mm[1];
    else if ((mm = t.match(/^(\d+)\s*(?:ba[ñn]o|toilet)/i))) bathrooms = +mm[1];
    else if ((mm = t.match(/^(\d+)\s*dormitorio/i))) bedrooms = +mm[1];
    else if ((mm = t.match(/([\d.,]+)\s*m(?:²|2)\s*(cubiert|total|terreno)?/i))) {
      const v = digits(mm[1]);
      if (v && (area_m2 == null || /total/i.test(mm[2] || ''))) { area_m2 = v; area_kind = (mm[2] || 'total').toLowerCase(); }
    }
  }
  if (rooms == null && bedrooms != null) { rooms = bedrooms; }
  if (area_m2 == null) w.push('sin m²');

  // Ubicación: el JSON-LD (streetAddress/addressRegion/lat/lng) es más confiable que el
  // bloque visible "Ubicación" (que solo trae la dirección, sin separar la localidad).
  const cityRaw = (md ? md[2] : '').trim();
  const city = cityRaw ? titleCaseCity(cityRaw) : null;
  const province = decode(pick(/"addressRegion"\s*:\s*"([^"]+)"/i)) || 'Buenos Aires';
  let address = decode(pick(/"streetAddress"\s*:\s*"([^"]+)"/i));
  if (address && city && address.toLowerCase().endsWith(`, ${city.toLowerCase()}`)) {
    address = address.slice(0, address.length - city.length - 2).trim();
  }
  const lat = Number(pick(/"lat(?:itude)?"\s*:\s*"?(-?\d{1,3}\.\d{3,})"?/i)) || null;
  const lng = Number(pick(/"(?:lng|lon|longitude)"\s*:\s*"?(-?\d{1,3}\.\d{3,})"?/i)) || null;
  if (lat == null || lng == null) w.push('sin coordenadas');
  const branch_id = BRANCH_BY_CITY[(city || '').toLowerCase().trim()] ?? null;
  if (branch_id == null) w.push(`localidad sin sucursal ("${city}")`);

  // Descripción
  const description = decode(pick(/<meta property="og:description" content="([^"]*)"/i))
    || decode(pick(/class="prop-details__description"[^>]*>([\s\S]*?)<\/div>/i));

  // Comodidades marcadas + inferidas de la descripción
  const amenSec = (html.match(/id="Comodidades"[\s\S]{0,4000}?<\/section>/i) || [''])[0];
  const amenRaw = [...amenSec.matchAll(/class="amenities__text"[^>]*>([\s\S]*?)<\/span>/gi)].map((m) => decode(m[1])).filter(Boolean);
  const amenKeys = new Set();
  for (const a of amenRaw) { const k = AMEN_MAP[a.toLowerCase().trim()]; if (k) amenKeys.add(k); }
  for (const k of amenitiesFromText(description)) amenKeys.add(k);

  // Estado comercial: sin badge visible en la ficha pública, así que se apoya en el
  // "VENDID@" detectado en el título (arriba) más cualquier badge que sí exista.
  const badge = (html.match(/prop-details__(?:status|badge)[^>]*>\s*([A-Za-zÁÉÍÓÚñ ]+?)\s*</i) || [])[1] || '';
  let status = 'disponible';
  if (isSold || /vendid/i.test(badge)) status = 'vendida';
  else if (/alquilad/i.test(badge)) status = 'alquilada';
  else if (/reservad/i.test(badge)) status = 'reservada';
  if (isSold) w.push('marcada VENDIDA en el título');

  // Fotos: todas las apariciones de <id8>-NN.jpg en la página
  const id8 = String(id).padStart(8, '0');
  const nums = [...new Set([...html.matchAll(new RegExp(`${id8}-(\\d{2})\\.jpg`, 'g'))].map((m) => m[1]))].sort();
  const pre = id8.slice(0, 3);
  const photos = nums.map((n) => `https://staticbp.com/img/prop_new/${pre}/${id8}-${n}.jpg`);
  if (!photos.length) w.push('sin fotos');

  return {
    source_id: id, external_url, title, operation, price, currency, price_period,
    kind, kind_raw: kindRaw || null, rooms, bedrooms, bathrooms, area_m2, area_kind, capacity,
    address, city, province, lat, lng, description,
    amenities: [...amenKeys], amenities_raw: amenRaw,
    status, branch_id, photos, photo_count: photos.length,
    warnings: w,
  };
}

// ── comandos ──────────────────────────────────────────────────────────────────
async function scrape() {
  await mkdir(CACHE, { recursive: true });
  process.stdout.write('Enumerando el listado…\n');
  const page1 = await grab(`${BASE}/propiedades`);
  const pageTotal = Number((page1.match(/pageTotal\s*=\s*parseInt\("(\d+)"\)/) || [])[1]) || 21;
  const ids = new Set([...page1.matchAll(/\/propiedad\/(\d+)/g)].map((m) => m[1]));
  for (let p = 2; p <= pageTotal; p++) {
    try {
      const arr = await grab(`${BASE}/propiedades?infinito=1&pagina=${p}`, { json: true });
      const html = Array.isArray(arr) ? arr.join('') : String(arr);
      [...html.matchAll(/\/propiedad\/(\d+)/g)].forEach((m) => ids.add(m[1]));
      process.stdout.write(`\r  página ${p}/${pageTotal} · ${ids.size} ids`);
      await sleep(120);
    } catch (e) { process.stdout.write(`\n  ⚠ página ${p}: ${e.message}\n`); }
  }
  // Descarta ids espurios (ej. "/propiedad/0" de algún link plantilla sin resolver):
  // los ids reales de BuscadorProp tienen 5+ dígitos.
  let list = [...ids].filter((id) => id.length >= 5 && Number(id) > 0);
  if (LIMIT) list = list.slice(0, LIMIT);
  process.stdout.write(`\n${list.length} fichas a bajar${LIMIT ? ` (--limit=${LIMIT})` : ''}.\n`);

  const out = [];
  let done = 0, failed = 0;
  const CONC = 5;
  async function worker(queue) {
    for (const id of queue) {
      const cf = resolve(CACHE, `${id}.html`);
      let html;
      try {
        if (!FRESH && existsSync(cf)) html = await readFile(cf, 'utf8');
        else { html = await grab(`${BASE}/propiedad/${id}`); await writeFile(cf, html); await sleep(150); }
        out.push(parseFicha(id, html));
      } catch (e) { failed++; out.push({ source_id: id, external_url: `${BASE}/propiedad/${id}`, error: e.message, warnings: ['no se pudo bajar'] }); }
      done++;
      if (done % 10 === 0 || done === list.length) process.stdout.write(`\r  ${done}/${list.length} (${failed} fallidas)`);
    }
  }
  const chunks = Array.from({ length: CONC }, (_, i) => list.filter((_, j) => j % CONC === i));
  await Promise.all(chunks.map(worker));
  out.sort((a, b) => Number(a.source_id) - Number(b.source_id));
  await writeFile(LISTINGS, JSON.stringify(out, null, 2));
  process.stdout.write(`\n✓ ${out.length} propiedades → ${LISTINGS}\n`);
  stats(out);
}

function stats(list) {
  list = list || JSON.parse(readFileSyncSafe(LISTINGS) || '[]');
  const ok = list.filter((x) => !x.error);
  const by = (f) => ok.reduce((a, x) => ((a[x[f] ?? '—'] = (a[x[f] ?? '—'] || 0) + 1), a), {});
  const count = (pred) => ok.filter(pred).length;
  const amenFreq = {};
  ok.forEach((x) => (x.amenities || []).forEach((k) => (amenFreq[k] = (amenFreq[k] || 0) + 1)));
  const warnFreq = {};
  list.forEach((x) => (x.warnings || []).forEach((wtxt) => {
    const key = wtxt.replace(/\("[^"]*"\)/, '(…)');
    warnFreq[key] = (warnFreq[key] || 0) + 1;
  }));
  const p = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `    ${k}: ${v}`).join('\n');
  console.log(`
── RESUMEN (${list.length} propiedades, ${list.length - ok.length} con error de descarga) ──
Operación:\n${p(by('operation'))}
Tipo (kind):\n${p(by('kind'))}
Sucursal (branch_id):\n${p(by('branch_id'))}
Provincia:\n${p(by('province'))}

Sin precio:        ${count((x) => x.price == null)}
Sin m²:            ${count((x) => x.area_m2 == null)}
Sin coordenadas:   ${count((x) => x.lat == null || x.lng == null)}
Sin comodidades:   ${count((x) => !x.amenities || !x.amenities.length)}
Fotos: total ${ok.reduce((a, x) => a + (x.photo_count || 0), 0)} · promedio ${(ok.reduce((a, x) => a + (x.photo_count || 0), 0) / (ok.length || 1)).toFixed(1)} · sin fotos ${count((x) => !x.photo_count)}

Comodidades (frecuencia):\n${p(amenFreq)}

Advertencias:\n${p(warnFreq)}

── 3 EJEMPLOS ──`);
  [ok[0], ok[Math.floor(ok.length / 2)], ok[ok.length - 1]].filter(Boolean).forEach((x) => console.log(JSON.stringify(x, null, 2)));
}

function readFileSyncSafe(p) { try { return existsSync(p) ? readFileSync(p, 'utf8') : null; } catch { return null; } }

const sqlStr = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const sqlNum = (v) => (v == null || Number.isNaN(Number(v)) ? 'NULL' : Number(v));

async function buildSql() {
  const list = JSON.parse(await readFile(LISTINGS, 'utf8')).filter((x) => !x.error);
  const rows = list.map((x) => {
    const amen = x.amenities && x.amenities.length ? JSON.stringify(x.amenities) : null;
    return `INSERT INTO properties
  (owner_kind, agency_id, branch_id, operation, kind, title, description, price, currency, price_period,
   area_m2, rooms, bathrooms, capacity, amenities, address, city, province, lat, lng, status, published, external_url)
VALUES ('agency', ${AGENCY_ID}, ${sqlNum(x.branch_id)}, ${sqlStr(x.operation)}, ${sqlStr(x.kind)}, ${sqlStr(x.title)}, ${sqlStr(x.description)},
   ${sqlNum(x.price)}, ${sqlStr(x.currency)}, ${sqlStr(x.price_period || null)}, ${sqlNum(x.area_m2)}, ${sqlNum(x.rooms)}, ${sqlNum(x.bathrooms)}, ${sqlNum(x.capacity)},
   ${sqlStr(amen)}, ${sqlStr(x.address)}, ${sqlStr(x.city)}, ${sqlStr(x.province)}, ${sqlNum(x.lat)}, ${sqlNum(x.lng)}, ${sqlStr(x.status)}, 1, ${sqlStr(x.external_url)})
ON CONFLICT(external_url) DO UPDATE SET
  branch_id=excluded.branch_id, operation=excluded.operation, kind=excluded.kind, title=excluded.title,
  description=excluded.description, price=excluded.price, currency=excluded.currency, price_period=excluded.price_period,
  area_m2=excluded.area_m2, rooms=excluded.rooms, bathrooms=excluded.bathrooms, capacity=excluded.capacity, amenities=excluded.amenities,
  address=excluded.address, city=excluded.city, province=excluded.province, lat=excluded.lat, lng=excluded.lng,
  status=excluded.status, published=1, updated_at=datetime('now');`;
  }).join('\n\n');
  const header = `-- El Muelle · import de cartera desde elmuellepropiedades.com.ar (BuscadorProp)
-- Generado por scripts/import-elmuelle.mjs — ${new Date().toISOString().slice(0, 10)} — ${list.length} propiedades.
-- Idempotente: ON CONFLICT(external_url). Requiere la migración 0018 (índice único parcial)
-- y las 3 sucursales reales (db/seed/elmuelle-branches-real.sql). Las fotos van aparte:
--   node scripts/import-elmuelle.mjs photos --local
\n`;
  // Las propiedades de prueba (seed) NO tienen external_url; las importadas SÍ. Así el
  // borrado es exacto y re-ejecutable (tras el 1er import, las reales ya no matchean).
  const cleanup = `-- Baja los datos de prueba (todo lo que no venga de este import).
DELETE FROM contracts WHERE property_id IN (SELECT id FROM properties WHERE external_url IS NULL);
DELETE FROM expenses  WHERE property_id IN (SELECT id FROM properties WHERE external_url IS NULL);
DELETE FROM deals     WHERE property_id IN (SELECT id FROM properties WHERE external_url IS NULL);
DELETE FROM properties WHERE external_url IS NULL;  -- cascade: property_media, bookings, mandates, property_views
\n`;
  await writeFile(SQL_OUT, header + cleanup + rows + '\n');
  console.log(`✓ ${list.length} filas → ${SQL_OUT}`);
}

function d1(sqlOrFile, { file = false } = {}) {
  const a = ['wrangler', 'd1', 'execute', 'elmuelle-places-db', LOCAL, '--yes', file ? `--file=${sqlOrFile}` : `--command=${sqlOrFile}`];
  const r = spawnSync('npx', a, { cwd: ROOT, encoding: 'utf8', shell: isWin });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || '').split('\n').filter((l) => /error/i.test(l))[0] || 'd1 falló');
  return r.stdout || '';
}
function d1json(sql) {
  const a = ['wrangler', 'd1', 'execute', 'elmuelle-places-db', LOCAL, '--yes', '--json', `--command=${sql}`];
  const r = spawnSync('npx', a, { cwd: ROOT, encoding: 'utf8', shell: isWin });
  const i = (r.stdout || '').indexOf('[');
  try { return JSON.parse(r.stdout.slice(i))[0].results; } catch { return []; }
}
function r2put(key, buf) {
  const tmp = resolve(WORKDIR, 'tmp.bin');
  writeFileSync(tmp, buf);
  const r = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `elmuelle-places-media/${key}`, LOCAL, `--file=${tmp}`, '--content-type=image/jpeg'], { cwd: ROOT, encoding: 'utf8', shell: isWin });
  return r.status === 0;
}

async function photos() {
  const list = JSON.parse(await readFile(LISTINGS, 'utf8')).filter((x) => !x.error && x.photo_count);
  const map = new Map(d1json('SELECT id, external_url FROM properties WHERE external_url IS NOT NULL').map((r) => [r.external_url, r.id]));
  let up = 0, skipRows = 0;
  for (const x of list) {
    const pid = map.get(x.external_url);
    if (!pid) { skipRows++; continue; }
    d1(`DELETE FROM property_media WHERE property_id = ${pid}`);
    let sort = 0;
    for (const url of x.photos) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
        if (!r.ok) continue;
        const key = `prop/${pid}/${String(sort + 1).padStart(2, '0')}.jpg`;
        if (r2put(key, Buffer.from(await r.arrayBuffer()))) {
          d1(`INSERT INTO property_media (property_id, r2_key, kind, sort) VALUES (${pid}, '${key}', 'photo', ${sort})`);
          sort++; up++;
        }
      } catch { /* salta la foto */ }
    }
    process.stdout.write(`\r  ${x.external_url.split('/').pop()} → ${sort} fotos · ${up} subidas`);
  }
  process.stdout.write(`\n✓ ${up} fotos subidas${skipRows ? ` · ${skipRows} propiedades sin fila (corré 'sql' + migrate primero)` : ''}\n`);
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  if (cmd === 'scrape') await scrape();
  else if (cmd === 'stats') stats();
  else if (cmd === 'sql') await buildSql();
  else if (cmd === 'photos') await photos();
  else {
    console.log('uso: node scripts/import-elmuelle.mjs <scrape|stats|sql|photos> [--fresh] [--local] [--limit=N] [--agency=1]');
    process.exit(1);
  }
})().catch((e) => { console.error('✗', e.stack || e.message); process.exit(1); });
