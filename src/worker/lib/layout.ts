// SSR del marketplace público (indexable). HTML por template strings — el tsconfig
// del worker no tiene JSX a propósito (esto no es la SPA de gestión).
// Estética: "warm editorial real estate" — papel crema, tinta profunda, acento
// verde bosque. Tipografía: Inter (texto) + JetBrains Mono (monoespaciado). Photo-forward.
import { amenitySummary } from './amenities';

export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PERIOD_LABEL: Record<string, string> = { mes: '/mes', noche: '/noche', dia: '/día', semana: '/semana', total: '' };

export function money(price: number | null, currency = 'USD', period?: string | null): string {
  if (price == null) return 'Consultar';
  const suf = period ? PERIOD_LABEL[period] ?? '' : '';
  return `${currency} ${price.toLocaleString('es-AR')}${suf ? ' ' + suf : ''}`;
}

/** "/noche", "/mes"… suelto, para poder maquetarlo aparte del número. */
export function periodLabel(period?: string | null): string {
  return period ? PERIOD_LABEL[period] ?? '' : '';
}

/** URL pública de una foto en R2. */
export function mediaUrl(key: string): string {
  return `/media/${key.split('/').map(encodeURIComponent).join('/')}`;
}

const DEFAULT_BRAND = 'Coopen Places';

export type Brand = { name: string; logoKey: string | null };

// La marca la pide TODA página del SSR y cambia una vez cada muerte de obispo, así que
// se cachea en memoria del isolate. Es seguro con white-label porque 1 deploy = 1 Worker
// = 1 agencia: nunca hay dos marcas conviviendo en el mismo isolate. El TTL corto acota
// lo que tarda en verse un cambio en un isolate ya calentado; el guardado la invalida.
const BRAND_TTL_MS = 60_000;
let brandCache: { at: number; val: Brand } | null = null;

/** Se llama al guardar la marca o el logo: el cambio se ve en el acto, sin esperar el TTL. */
export function invalidateBrand(): void {
  brandCache = null;
}

/** Marca del sitio (white-label): nombre + logo en UN solo viaje a D1 (batch). */
export async function getBrand(db: D1Database): Promise<Brand> {
  const now = Date.now();
  if (brandCache && now - brandCache.at < BRAND_TTL_MS) return brandCache.val;
  const [settings, agency] = await db.batch<{ brand_name?: string | null; logo_key?: string | null }>([
    db.prepare('SELECT brand_name FROM site_settings WHERE id = 1'),
    db.prepare('SELECT logo_key FROM agencies WHERE logo_key IS NOT NULL AND logo_key <> "" ORDER BY id LIMIT 1'),
  ]);
  const val: Brand = {
    name: settings?.results?.[0]?.brand_name || DEFAULT_BRAND,
    logoKey: agency?.results?.[0]?.logo_key || null,
  };
  brandCache = { at: now, val };
  return val;
}

/** Marca del sitio (white-label): editable por deploy desde Configuración. */
export async function getBrandName(db: D1Database): Promise<string> {
  return (await getBrand(db)).name;
}

/**
 * Logo del sitio (white-label): key de R2 en `agencies.logo_key` de la inmobiliaria del
 * deploy — 1 deploy = 1 agencia, igual criterio que `resolveSiteWhatsapp`. Se reusa esa
 * columna, que ya existía para esto, en vez de sumar una a `site_settings`.
 * null = todavía no cargó logo → se muestra el nombre en texto (nunca un <img> roto).
 */
export async function getBrandLogoKey(db: D1Database): Promise<string | null> {
  return (await getBrand(db)).logoKey;
}

/** Marca del header/footer: el logo si hay, si no el nombre. El alt SIEMPRE es el nombre. */
export function brandMark(brandName: string, logoKey: string | null): string {
  return logoKey
    ? `<img class="brand-logo" src="${esc(mediaUrl(logoKey))}" alt="${esc(brandName)}">`
    : esc(brandName);
}

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">';

const STYLES = `
:root{
  --paper:#f6f1e8; --surface:#fffdf9; --ink:#221d17; --muted:#7c7264; --line:#e7ddcd;
  --accent:#1f3a31; --accent-d:#16281f; --forest:#1f3a31; --ok:#2f7d57; --wa:#1fab54;
  --shadow:0 1px 2px rgba(34,29,23,.05),0 14px 32px -18px rgba(34,29,23,.28);
  --shadow-lg:0 2px 6px rgba(34,29,23,.06),0 30px 60px -28px rgba(34,29,23,.34);
  --radius:16px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:var(--paper);color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.55}
code,.mono{font-family:"JetBrains Mono",ui-monospace,"SFMono-Regular",monospace}
h1,h2,h3,.serif{font-weight:700;letter-spacing:-.01em}
a{color:inherit;text-decoration:none}
img{max-width:100%}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}

header.site{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--paper) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
header.site .wrap{display:flex;align-items:center;justify-content:space-between;height:68px;gap:16px}
.brand{font-weight:600;font-size:22px;letter-spacing:-.02em;display:flex;align-items:center;gap:2px}
/* Logo de marca: se acota por ALTURA y el ancho sale del aspect-ratio, así entra
   cualquier logo (apaisado o cuadrado) sin deformarse ni romper el header de 68px.
   48px deja ~10px de aire arriba y abajo; menos que eso y un logo con texto adentro
   (como el de El Muelle, 300x150) queda ilegible. */
.brand-logo{height:48px;width:auto;max-width:240px;object-fit:contain;display:block}
@media(max-width:600px){.brand-logo{height:38px;max-width:160px}}
/* En el footer, sobre fondo oscuro, el logo no necesita tanto peso visual. */
footer.site .brand-logo{height:40px}
header.site nav{display:flex;align-items:center;gap:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:11px 20px;border-radius:999px;background:var(--accent);color:#fff;font-weight:600;font-size:15px;border:0;cursor:pointer;transition:transform .12s ease,box-shadow .2s ease,background .2s}
.btn:hover{background:var(--accent-d);transform:translateY(-1px)}
.btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
.btn.ghost:hover{background:var(--surface);border-color:var(--muted)}
.btn.wa{background:var(--wa)}.btn.wa:hover{background:#189449}
.btn.dark{background:var(--forest)}.btn.dark:hover{background:#152a23}
.wa-fab{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--wa);box-shadow:var(--shadow);flex-shrink:0;transition:transform .15s ease,background .2s}
.wa-fab:hover{background:#189449;transform:translateY(-2px)}

.hero{padding:52px 0 30px}
.hero h1{font-size:clamp(30px,5.5vw,52px);line-height:1.04;margin:0 0 14px}
.hero p{color:var(--muted);font-size:19px;max-width:600px;margin:0}

/* Filtros: lo esencial arriba, el resto plegado (ver searchForm en routes/public.ts). */
form.search{margin:24px 0 12px;background:var(--surface);padding:12px;border-radius:var(--radius);border:1px solid var(--line);box-shadow:var(--shadow)}
form.search select,form.search input{padding:13px 14px;border-radius:10px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font:inherit;font-size:15px;min-width:0;width:100%}
form.search .s-main{display:grid;grid-template-columns:minmax(140px,.7fr) minmax(180px,1.6fr) auto;gap:10px}
form.search .s-adv{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding-top:11px}
form.search .s-more{margin-top:0}
form.search .s-more summary{list-style:none;cursor:pointer;color:var(--muted);font-size:14px;font-weight:600;padding:11px 2px 0;display:flex;align-items:center;gap:6px;min-height:40px}
form.search .s-more summary::-webkit-details-marker{display:none}
form.search .s-more summary::before{content:"";width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translate(-2px,-2px);transition:transform .18s ease}
form.search .s-more[open] summary::before{transform:rotate(-135deg) translate(-3px,-3px)}
form.search .s-more summary b{color:var(--accent)}
@media(max-width:640px){
  form.search .s-main{grid-template-columns:1fr;gap:9px}
  form.search .s-main .btn{width:100%;padding:13px 18px}
  form.search .s-adv{grid-template-columns:1fr 1fr}
}

.section-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:8px 0 16px}
.section-h h2{font-size:26px;margin:0}
.section-h a{color:var(--accent);font-weight:600;font-size:15px}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;margin:0 0 52px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow);transition:transform .18s ease,box-shadow .25s ease}
.card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
/* La foto manda menos que antes (16/10 en vez de 4/3): la card entra más veces en
   pantalla, que es lo que se pidió. El outline interno le da borde propio sobre
   cualquier foto clara sin ensuciarla con un borde tintado. */
.card .ph{position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#efe6d6,#e4d7c1);overflow:hidden;outline:1px solid rgba(0,0,0,.06);outline-offset:-1px}
.card .ph img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.card:hover .ph img{transform:scale(1.05)}
.card .ph .empty-ic{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.5),transparent 60%)}
.card .op{position:absolute;top:10px;left:10px;background:color-mix(in srgb,var(--forest) 92%,transparent);color:#f6f1e8;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;text-transform:capitalize;letter-spacing:.02em}
.card .body{padding:12px 13px 13px}
/* tabular-nums: los precios de una grilla quedan alineados entre cards. */
.card .price{font-weight:600;font-size:19px;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.card .price .per{font-size:.7em;font-weight:500;color:var(--muted);margin-left:3px}
/* Título a 2 líneas como máximo: un título largo no puede empujar la card al doble de
   alto que su vecina — la grilla se ve pareja. */
.card .ttl{margin:2px 0 0;font-weight:600;font-size:15px;line-height:1.3;text-wrap:pretty;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card .meta{color:var(--muted);font-size:13px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* 🔴 Cada dato es un chip que NO se parte (nowrap): el corte de línea cae entre datos y
   nunca entre el ícono y su número. Antes eran texto suelto con "·" y los emojis de las
   comodidades empujaban hasta romperlo a mitad de dato. */
.card .facts{color:var(--muted);font-size:12.5px;margin-top:9px;padding-top:9px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:4px 12px;font-variant-numeric:tabular-nums}
.card .facts .f{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.card .facts svg{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:.75}
/* Comodidades en texto y en UNA línea: si no entran, se recortan con "…". */
.card .amen-sum{color:var(--muted);font-size:12.5px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* Mobile-first: apilado por defecto (evita grid blowout que ensancha el viewport en el cel).
   El panel de precio/CTA va justo después del título (área "panel"). 2 columnas solo en desktop. */
.detail{display:grid;grid-template-columns:1fr;grid-template-areas:"gallery" "head" "panel" "body";margin:24px 0 48px;align-items:start}
.d-gallery{grid-area:gallery;min-width:0}.d-head{grid-area:head;min-width:0}.d-body{grid-area:body;min-width:0}
.detail .gallery{position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#efe6d6,#e4d7c1);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;color:#b3a58c;box-shadow:var(--shadow)}
.detail .gallery img{width:100%;height:100%;object-fit:cover}
.detail [data-gidx]{cursor:zoom-in}
.gal-count{position:absolute;bottom:12px;right:12px;background:rgba(34,29,23,.82);color:#fff;font-size:13px;font-weight:600;padding:5px 11px;border-radius:999px;pointer-events:none}
.thumbs{display:flex;gap:9px;margin-top:10px;flex-wrap:wrap}
.thumbs img{width:92px;height:66px;object-fit:cover;border-radius:10px;border:1px solid var(--line);transition:transform .12s,border-color .12s}
.thumbs img:hover{transform:translateY(-2px);border-color:var(--accent)}
.thumb-more{width:92px;height:66px;display:inline-flex;align-items:center;justify-content:center;background:var(--paper);border:1px solid var(--line);border-radius:10px;font-weight:600;color:var(--muted)}
.detail h1{font-size:clamp(24px,4vw,36px);margin:16px 0 4px}
.detail .lead{color:var(--muted);font-size:16px}
.detail .desc{margin-top:14px;color:#42392e}
.aside-card{grid-area:panel;min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);position:static;margin:16px 0}
.aside-card .big-price{font-size:30px;font-weight:600}
.facts-list{list-style:none;padding:0;margin:14px 0 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.facts-list li{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:14px}
.facts-list b{display:block;color:var(--muted);font-weight:500;font-size:12px;margin-bottom:1px}
.aside-specs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
.aside-specs .spec{padding:7px 11px;box-shadow:none;background:var(--paper)}
.aside-specs .spec b{font-size:14px}
.aside-amen{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 6px;padding-top:12px;border-top:1px solid var(--line)}
.aside-card .btn{display:flex;width:100%;margin-top:9px}
/* Lightbox de la galería (SSR). z-index MUY alto: Leaflet usa hasta ~1000 en sus controles. */
.glb{display:none;position:fixed;inset:0;z-index:100000;background:rgba(20,16,12,.93);align-items:center;justify-content:center}
.glb img{max-width:92vw;max-height:84vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.glb-x{position:absolute;top:16px;right:22px;background:none;border:0;color:#fff;font-size:30px;cursor:pointer;line-height:1}
.glb-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.14);border:0;color:#fff;font-size:32px;width:52px;height:52px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
.glb-nav:hover{background:rgba(255,255,255,.28)}.glb-prev{left:20px}.glb-next{right:20px}
.glb-count{position:absolute;bottom:20px;color:#fff;font-size:14px;font-weight:600;background:rgba(0,0,0,.4);padding:5px 12px;border-radius:999px}

footer.site{border-top:1px solid var(--line);background:var(--forest);color:#e8ddc8;padding:36px 0;margin-top:20px}
footer.site .brand{color:#f6f1e8}
footer.site p{margin:8px 0 0;color:#b6ab93;font-size:14px}
footer.site .credit{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;color:#b6ab93}
footer.site .credit b{color:#e8ddc8}
.empty{color:var(--muted);padding:48px 0;text-align:center;background:var(--surface);border:1px dashed var(--line);border-radius:var(--radius)}

.specs{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}
.spec{display:inline-flex;align-items:center;gap:7px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:9px 14px;font-size:14px;box-shadow:var(--shadow)}
.spec b{font-size:16px}
.amen{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.amen-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-weight:500}
.map-sec{margin-top:28px}
.map-sec h3{font-size:22px;margin:0 0 10px}
.ficha-map{height:320px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow)}
.ficha-map #fmap{width:100%;height:100%;background:#e9e0d0}
.nearby-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-top:16px}
.nearby-grid.hidden{display:none}

@media(min-width:900px){
  .detail{grid-template-columns:1.55fr 1fr;grid-template-areas:"gallery panel" "head panel" "body panel";column-gap:32px}
  .aside-card{position:sticky;top:88px;margin:0}
}
@media(max-width:640px){
  .wrap{padding:0 15px}
  header.site .wrap{height:60px}
  header.site nav .btn{padding:9px 14px;font-size:14px}
  .hero{padding:34px 0 20px}
  .hero p{font-size:17px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
  /* 16px: a 2 columnas en un cel, "ARS 300.000 /mes" a 17px se parte en dos renglones. */
  .card .price{font-size:16px}.card .body{padding:10px 11px 11px}
  .card .ttl{font-size:14px}
  /* A 155px de ancho no entran 4 datos: se muestran los 3 que definen la búsqueda
     (ambientes, personas, superficie) y baños queda para la ficha. */
  .card .facts{gap:3px 9px;font-size:12px}
  .card .facts .f[title="baños"]{display:none}
  .facts-list{grid-template-columns:1fr 1fr}
}
`;

export type PageOpts = {
  title: string;
  description: string;
  /** Origen absoluto de la request (ej: https://tu-dominio.com), para canonical/og. */
  origin: string;
  canonicalPath?: string;
  body: string;
  /** Assets extra en el <head> (ej: Leaflet, JSON-LD). */
  head?: string;
  /** Imagen absoluta para og:image / twitter (preview al compartir). */
  ogImage?: string;
  /** Sesión activa: cambia el CTA "Ingresar" del header por "Ir a mi panel". */
  authed?: boolean;
  /** Marca del sitio (white-label por deploy): getBrandName(c.env.DB). */
  brandName: string;
  /** Logo del sitio (key R2): getBrandLogoKey(c.env.DB). null = se muestra el nombre. */
  brandLogoKey?: string | null;
};

export function pageShell(o: PageOpts): string {
  const canonical = o.canonicalPath ? `${o.origin}${o.canonicalPath}` : o.origin;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}"><meta property="og:url" content="${esc(canonical)}">
${o.ogImage ? `<meta property="og:image" content="${esc(o.ogImage)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(o.ogImage)}">` : ''}
<meta name="theme-color" content="#f6f1e8">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8F%A1%3C/text%3E%3C/svg%3E">
${FONTS}
<style>${STYLES}</style>
${o.head || ''}
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand" href="/">${brandMark(o.brandName, o.brandLogoKey ?? null)}</a>
  <nav><a class="btn ghost" href="/buscar">Buscar</a> <a class="btn" href="/app">${o.authed ? 'Ir a mi panel' : 'Ingresar'}</a></nav>
</div></header>
<main class="wrap">${o.body}</main>
<footer class="site"><div class="wrap">
  <a class="brand" href="/">${brandMark(o.brandName, o.brandLogoKey ?? null)}</a>
  <p>Gestión inmobiliaria y marketplace de propiedades</p>
  <div class="credit">
    <span>Desarrollado por <b>CoopenStudio.com</b></span>
    <a class="wa-fab" href="https://wa.me/34895554449" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp" title="Contactar por WhatsApp">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.45 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9a9.83 9.83 0 00-2.9-7.01A9.82 9.82 0 0012.04 2m0 1.67a8.2 8.2 0 018.23 8.24c0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 01-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38 8.2 8.2 0 018.26-8.24M8.53 6.9c-.16 0-.42.06-.64.31s-.85.83-.85 2.02.87 2.34 1 2.5c.11.16 1.68 2.68 4.13 3.68 2.05.83 2.47.66 2.92.62s1.45-.59 1.66-1.16.21-1.06.14-1.16-.24-.16-.5-.28-1.53-.75-1.77-.84-.4-.13-.58.13-.68.83-.83 1-.31.18-.57.06a7.14 7.14 0 01-2.1-1.3 7.9 7.9 0 01-1.45-1.8c-.15-.26 0-.4.11-.53s.24-.28.36-.42.16-.24.24-.4.04-.31-.02-.44-.57-1.42-.79-1.94-.42-.44-.58-.44z"/></svg>
    </a>
  </div>
</div></footer>
</body>
</html>`;
}

type CardProperty = {
  id: number;
  title: string;
  operation: string;
  price: number | null;
  currency: string;
  city: string | null;
  province: string | null;
  rooms: number | null;
  area_m2: number | null;
  bathrooms?: number | null;
  capacity?: number | null;
  amenities?: string | null;
  price_period?: string | null;
  lat?: number | null;
  lng?: number | null;
  cover_key?: string | null;
};

/**
 * Íconos de los datos de la card. **SVG inline, no emoji** (regla de diseño del repo): el
 * emoji lo dibuja cada sistema operativo a su manera, no hereda el color del texto y —lo
 * que rompía la card— cuenta como un carácter más de la línea, así que el navegador podía
 * cortar justo entre el ícono y su número. Trazo con `currentColor` para que sigan al tema.
 */
const ICONS: Record<string, string> = {
  rooms: '<path d="M2 18v-6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6M2 18h20M6 10V6h12v4"/>',
  bath: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 6.6a3 3 0 0 1 0 4.8M17.6 14.4A5 5 0 0 1 21 19v1"/>',
  area: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
};
const fact = (icon: string, label: string, value: string) =>
  `<span class="f" title="${esc(label)}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[icon]}</svg>${esc(value)}<span class="sr">${esc(label)}</span></span>`;

/** Card de propiedad para landing y resultados. */
export function propertyCard(p: CardProperty): string {
  const loc = [p.city, p.province].filter(Boolean).join(', ') || 'Ubicación a confirmar';
  const geo = p.lat != null && p.lng != null ? ` data-lat="${p.lat}" data-lng="${p.lng}"` : '';
  // Cada dato es un chip indivisible (`white-space:nowrap`): la línea corta ENTRE datos,
  // nunca entre el ícono y su número — que era el síntoma reportado.
  const facts = [
    p.rooms != null ? fact('rooms', 'ambientes', String(p.rooms)) : null,
    p.bathrooms != null ? fact('bath', 'baños', String(p.bathrooms)) : null,
    p.capacity != null ? fact('people', 'personas', String(p.capacity)) : null,
    p.area_m2 != null ? fact('area', 'superficie', `${p.area_m2} m²`) : null,
  ].filter(Boolean).join('');
  const img = p.cover_key
    ? `<img src="${esc(mediaUrl(p.cover_key))}" alt="${esc(p.title)}" loading="lazy">`
    : `<span class="empty-ic" aria-hidden="true"></span>`;
  const amen = amenitySummary(p.amenities, 3);
  // El período va aparte y más chico: es metadato del precio, no parte del número — y
  // pegado al mismo tamaño hacía que "ARS 340.000 /noche" no entrara en una columna de cel.
  const per = p.price != null ? periodLabel(p.price_period) : '';
  return `<a class="card"${geo} href="/propiedad/${p.id}">
    <div class="ph"><span class="op">${esc(p.operation)}</span>${img}</div>
    <div class="body">
      <div class="price">${esc(money(p.price, p.currency))}${per ? `<span class="per">${esc(per)}</span>` : ''}</div>
      <h3 class="ttl">${esc(p.title)}</h3>
      <div class="meta">${esc(loc)}</div>
      ${facts ? `<div class="facts">${facts}</div>` : ''}
      ${amen ? `<div class="amen-sum">${esc(amen)}</div>` : ''}
    </div>
  </a>`;
}
