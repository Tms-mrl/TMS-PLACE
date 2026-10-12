// Trae el "Código" (ej. AV-CAS-72) de cada ficha de elmuellepropiedades.com.ar y genera
//   db/seed/elmuelle-codes.sql   → un UPDATE por propiedad, emparejado por external_url
//   db/seed/elmuelle-codes.report.json → resumen para REVISAR antes de aplicar
//
// NO toca ninguna base: solo lee el sitio público y escribe esos dos archivos. Los ids salen
// de db/seed/elmuelle-import.sql (los mismos external_url del import original). Las
// propiedades sin ficha (cargadas a mano) no se emparejan: se les carga el código a mano.
//
// Uso: node scripts/import-codes.mjs [--limit=N]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.elmuellepropiedades.com.ar';
const UA = 'Mozilla/5.0 (compatible; elmuelle-codes/1.0)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&#x2F;|&#47;/g, '/').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/ /g, ' ');

async function grab(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-AR,es;q=0.9' }, signal: AbortSignal.timeout(25000) });
      if (r.status === 404) return { status: 404, html: '' };
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { status: 200, html: await r.text() };
    } catch (e) {
      if (i === 2) throw e;
      await sleep(600 * (i + 1));
    }
  }
}

// La ficha trae su PROPIO código como "Código XXX" (las tarjetas de "propiedades
// similares" usan "Cod." y NO se toman: son de otras propiedades).
function extractCode(html) {
  const m = html.match(/class="gallery__tag"[^>]*>\s*C[oó]digo\s+([^<\n\r]+)/i);
  const v = m ? decode(m[1]).replace(/\s+/g, ' ').trim() : '';
  return v || null;
}

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const seed = await readFile(join(ROOT, 'db/seed/elmuelle-import.sql'), 'utf8');
const urls = [...new Set([...seed.matchAll(/https:\/\/www\.elmuellepropiedades\.com\.ar\/propiedad\/(\d+)/g)].map((m) => m[1]))].slice(0, limit);
console.log(`${urls.length} fichas a leer`);

const found = [], missing = [], gone = [], failed = [];
for (const [i, id] of urls.entries()) {
  const external_url = `${BASE}/propiedad/${id}`;
  try {
    const { status, html } = await grab(external_url);
    if (status === 404) gone.push({ id, external_url });
    else {
      const code = extractCode(html);
      (code ? found : missing).push({ id, external_url, code });
    }
  } catch (e) { failed.push({ id, external_url, error: e.message }); }
  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${urls.length}`);
  await sleep(250);
}

// Códigos repetidos: se avisan, pero igual se cargan (la columna no es única).
const byCode = new Map();
for (const x of found) byCode.set(x.code, [...(byCode.get(x.code) || []), x.external_url]);
const duplicated = [...byCode].filter(([, u]) => u.length > 1).map(([code, u]) => ({ code, urls: u }));

const sql = [
  '-- Generado por scripts/import-codes.mjs. Empareja por external_url; los que no existen no hacen nada.',
  ...found.map((x) => `UPDATE properties SET code = ${sqlStr(x.code)} WHERE external_url = ${sqlStr(x.external_url)} AND (code IS NULL OR code = '');`),
].join('\n') + '\n';
await writeFile(join(ROOT, 'db/seed/elmuelle-codes.sql'), sql);
const report = { total: urls.length, with_code: found.length, without_code: missing, gone, failed, duplicated, sample: found.slice(0, 15) };
await writeFile(join(ROOT, 'db/seed/elmuelle-codes.report.json'), JSON.stringify(report, null, 2));
console.log(`con código: ${found.length} · sin código: ${missing.length} · ficha dada de baja: ${gone.length} · fallaron: ${failed.length} · códigos repetidos: ${duplicated.length}`);
