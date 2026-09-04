import { Hono } from 'hono';
import type { AppEnv } from '../lib/types';
import { esc, getBrand, getBrandLogoKey, getBrandName, mediaUrl, money, pageShell, propertyCard } from '../lib/layout';
import { COMPUTED_STATUS_SQL } from '../lib/propertyStatus';
import { amenityChips } from '../lib/amenities';
import { renderLanding } from '../lib/landing';
import { getPublishedTestimonials } from './site';
import { resolvePropertyWhatsapp, resolveSiteWhatsapp, waLink } from '../lib/whatsapp';
import { num } from '../lib/http';
import { resolveUser, ssoEnabled } from '../lib/auth';

// ── Marketplace público: SSR (indexable) + API JSON. Sin sesión. ──

type Filters = {
  operation: string | null;
  city: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  rooms: number | null;
  /** Moneda del filtro de precio: 'ARS' (default) | 'USD' | 'all' (no scopea). */
  currency: string;
  limit: number;
};

type CardRow = {
  id: number;
  title: string;
  operation: string;
  price: number | null;
  currency: string;
  city: string | null;
  province: string | null;
  rooms: number | null;
  area_m2: number | null;
  bathrooms: number | null;
  capacity: number | null;
  amenities: string | null;
  price_period: string | null;
  lat: number | null;
  lng: number | null;
  cover_key: string | null;
};

// Fila cruda de una propiedad (ficha): campos dinámicos, se acceden por nombre.
type AnyRow = Record<string, any>;

function parseFilters(q: URLSearchParams): Filters {
  const op = q.get('op');
  const m = (q.get('moneda') || '').toUpperCase();
  return {
    operation: op && ['venta', 'alquiler', 'temporario'].includes(op) ? op : null,
    city: (q.get('ciudad') || '').trim().slice(0, 80) || null,
    minPrice: num(q.get('min')),
    maxPrice: num(q.get('max')),
    rooms: num(q.get('amb')),
    // Default ARS: filtrar por pesos sin cruzar con dólares (evita comparar 100.000 ARS vs 50.000 USD).
    currency: m === 'USD' ? 'USD' : m === 'ALL' ? 'all' : 'ARS',
    limit: 24,
  };
}

const CARD_COLS =
  `id, title, operation, price, currency, city, province, rooms, area_m2, bathrooms, capacity, amenities, price_period, lat, lng,
   (SELECT r2_key FROM property_media pm WHERE pm.property_id = properties.id
    ORDER BY pm.sort LIMIT 1) AS cover_key`;

async function queryProperties(db: D1Database, f: Filters): Promise<CardRow[]> {
  const where: string[] = ['published = 1'];
  const binds: unknown[] = [];
  if (f.operation) { where.push('operation = ?'); binds.push(f.operation); }
  if (f.city) { where.push('LOWER(city) LIKE ?'); binds.push(`%${f.city.toLowerCase()}%`); }
  // El filtro de precio se scopea a la moneda elegida (salvo 'all'): así 100.000 ARS no matchea 50.000 USD.
  const priceActive = f.minPrice != null || f.maxPrice != null;
  if (priceActive && f.currency !== 'all') { where.push('currency = ?'); binds.push(f.currency); }
  if (f.minPrice != null) { where.push('price >= ?'); binds.push(f.minPrice); }
  if (f.maxPrice != null) { where.push('price <= ?'); binds.push(f.maxPrice); }
  if (f.rooms != null) { where.push('rooms >= ?'); binds.push(f.rooms); }
  const sql = `SELECT ${CARD_COLS} FROM properties WHERE ${where.join(' AND ')}
               ORDER BY created_at DESC LIMIT ?`;
  binds.push(f.limit);
  const res = await db.prepare(sql).bind(...binds).all<CardRow>();
  return res.results;
}

/**
 * Filtros de la búsqueda. Mobile-first: arriba queda **lo que casi todos usan**
 * (operación + ciudad + Buscar) y el resto vive en un `<details>` que se abre solo si
 * hay alguno aplicado. Los seis campos en fila convertían el cel en una pared de inputs
 * de ~80 px, y la mayoría de las búsquedas pasan por ahí.
 *
 * `<details>` es HTML puro: sigue andando sin JS, y un input adentro de un `<details>`
 * cerrado **igual se envía** — así que un filtro aplicado nunca se pierde al plegarlo.
 */
function searchForm(f: Filters): string {
  const opt = (v: string, label: string) =>
    `<option value="${v}"${f.operation === v ? ' selected' : ''}>${label}</option>`;
  const advActive = f.minPrice != null || f.maxPrice != null || f.rooms != null || f.currency !== 'ARS';
  const activos = [
    f.minPrice != null || f.maxPrice != null ? 'precio' : null,
    f.rooms != null ? 'ambientes' : null,
  ].filter(Boolean).join(' · ');
  return `<form class="search" method="get" action="/buscar">
    <div class="s-main">
      <select name="op" aria-label="Operación"><option value="">Operación</option>${opt('venta', 'Venta')}${opt('alquiler', 'Alquiler')}${opt('temporario', 'Temporario')}</select>
      <input name="ciudad" placeholder="Ciudad" aria-label="Ciudad" value="${esc(f.city ?? '')}">
      <button class="btn" type="submit">Buscar</button>
    </div>
    <details class="s-more"${advActive ? ' open' : ''}>
      <summary>Más filtros${activos ? ` <b>· ${esc(activos)}</b>` : ''}</summary>
      <div class="s-adv">
        <select name="moneda" aria-label="Moneda del precio">
          <option value="ARS"${f.currency === 'ARS' ? ' selected' : ''}>Pesos $</option>
          <option value="USD"${f.currency === 'USD' ? ' selected' : ''}>Dólares US$</option>
          <option value="all"${f.currency === 'all' ? ' selected' : ''}>Ambas monedas</option>
        </select>
        <input name="min" type="number" inputmode="numeric" placeholder="Precio mín" aria-label="Precio mínimo" value="${f.minPrice ?? ''}">
        <input name="max" type="number" inputmode="numeric" placeholder="Precio máx" aria-label="Precio máximo" value="${f.maxPrice ?? ''}">
        <input name="amb" type="number" inputmode="numeric" placeholder="Ambientes mín" aria-label="Ambientes mínimos" value="${f.rooms ?? ''}">
      </div>
    </details>
  </form>`;
}

// Leaflet se carga con `defer` (no frena el parseo), y los <script> inline corren ANTES
// que los defer: si el mapa se inicializara directo, `window.L` no existiría todavía y
// se quedaría sin dibujar. Se arranca cuando Leaflet está — al `load` si hace falta.
const whenLeaflet = (script: string) =>
  `(function(){function boot(){${script}}if(window.L){boot();}else{window.addEventListener('load',boot);}})();`;

// Leaflet + OpenStreetMap. Assets del CDN (unpkg) + tiles OSM (externos, estándar en mapas).
const LEAFLET_ASSETS = `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
<script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>`;
const MAP_HEAD = `${LEAFLET_ASSETS}
<style>
.srch-top{padding:26px 0 2px}.srch-top h1{font-size:clamp(26px,4.5vw,40px);margin:0 0 8px}
.srch-count{color:var(--muted);margin:0 0 14px;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#geo-btn{padding:9px 15px;font-size:14px}
#geo-btn:disabled{opacity:.6}
.dist{margin-top:8px;font-size:13px;font-weight:700;color:#2563eb}
.srch-body{display:grid;grid-template-columns:1.05fr .95fr;gap:24px;align-items:start}
.srch-list .grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-bottom:22px}
.srch-map{position:sticky;top:88px;height:calc(100vh - 116px);border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow)}
#map{width:100%;height:100%;background:#e9e0d0}
.leaflet-popup-content{margin:12px 14px}
.leaflet-popup-content b{font-size:17px;color:var(--accent)}
@media(max-width:900px){.srch-body{grid-template-columns:1fr}.srch-map{position:relative;top:0;height:300px;order:-1;margin-bottom:6px}}
</style>`;
const MAP_SCRIPT = `(function(){
  var el=document.getElementById('map'),d=document.getElementById('pdata');
  if(!el||!window.L||!d)return;
  var pts=JSON.parse(d.textContent||'[]');
  var map=L.map(el,{scrollWheelZoom:false}).setView([-38,-63],4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
  var b=[];
  pts.forEach(function(p){
    var m=L.circleMarker([p.lat,p.lng],{radius:9,weight:3,color:'#fff',fillColor:'#bd5a37',fillOpacity:1}).addTo(map);
    var img=p.cover?'<img src="'+p.cover+'" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:7px">':'';
    m.bindPopup('<a href="/propiedad/'+p.id+'" style="color:#221d17;text-decoration:none;display:block;min-width:150px">'+img+'<b>'+p.price+'</b><br>'+p.title+'</a>');
    b.push([p.lat,p.lng]);
  });
  if(b.length===1){map.setView(b[0],14);}else if(b.length){map.fitBounds(b,{padding:[42,42],maxZoom:13});}

  // Geolocalización → marker "estás acá" + ordena las cards por cercanía + zoom a calles.
  function dist(a,b2,c,d2){var R=6371,p=Math.PI/180,s=Math.sin((c-a)*p/2)*Math.sin((c-a)*p/2)+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d2-b2)*p/2)*Math.sin((d2-b2)*p/2);return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
  var gb=document.getElementById('geo-btn');
  function applyLocation(ua,uo,acc){
    L.circleMarker([ua,uo],{radius:9,weight:3,color:'#fff',fillColor:'#2563eb',fillOpacity:1}).addTo(map).bindPopup('Estás acá').openPopup();
    L.circle([ua,uo],{radius:Math.min(acc||400,3000),color:'#2563eb',weight:1,fillColor:'#2563eb',fillOpacity:.08}).addTo(map);
    var cards=[].slice.call(document.querySelectorAll('.srch-list .card[data-lat]'));
    cards.forEach(function(el){var dd=dist(ua,uo,parseFloat(el.getAttribute('data-lat')),parseFloat(el.getAttribute('data-lng')));el.setAttribute('data-d',dd);
      var bg=el.querySelector('.dist');if(!bg){bg=document.createElement('div');bg.className='dist';(el.querySelector('.body')||el).appendChild(bg);}
      bg.textContent='📍 a '+(dd<1?Math.round(dd*1000)+' m':dd.toFixed(1)+' km');});
    cards.sort(function(x,y){return parseFloat(x.getAttribute('data-d'))-parseFloat(y.getAttribute('data-d'));});
    var grid=cards[0]&&cards[0].parentNode;if(grid)cards.forEach(function(el){grid.appendChild(el);});
    map.setView([ua,uo],15);
    if(gb){gb.textContent='📍 Ordenado por cercanía';gb.disabled=false;}
  }
  if(gb){gb.addEventListener('click',function(){
    if(!navigator.geolocation){alert('Tu navegador no soporta geolocalización.');return;}
    gb.textContent='📍 Buscando…';gb.disabled=true;
    navigator.geolocation.getCurrentPosition(function(pos){applyLocation(pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy);},
      function(){gb.textContent='📍 Buscar cerca de mí';gb.disabled=false;alert('No pudimos obtener tu ubicación. Revisá los permisos del navegador.');},{enableHighAccuracy:true,timeout:8000});
  });}
  // Si venís del inicio con "Cerca de mí" (?near=1&lat&lng), aplicamos la ubicación directo.
  var sp=new URLSearchParams(location.search),qla=parseFloat(sp.get('lat')),qlo=parseFloat(sp.get('lng'));
  if(sp.get('near')&&isFinite(qla)&&isFinite(qlo)){applyLocation(qla,qlo,400);}
})();`;

// Mapa de la ficha: ubicación de la propiedad + botón "ver cercanas".
const FICHA_MAP_SCRIPT = `(async function(){
  var el=document.getElementById('fmap'),d=document.getElementById('fdata');
  if(!el||!window.L||!d)return;
  var s=JSON.parse(d.textContent||'{}');
  var lat=s.lat,lng=s.lng;
  if((lat==null||lng==null)&&s.q){
    try{var g=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q='+encodeURIComponent(s.q),{headers:{'Accept-Language':'es'}});var gj=await g.json();if(gj&&gj[0]){lat=parseFloat(gj[0].lat);lng=parseFloat(gj[0].lon);}}catch(e){}
  }
  if(lat==null||lng==null){var sec=document.querySelector('.map-sec');if(sec)sec.style.display='none';return;}
  var map=L.map(el,{scrollWheelZoom:false}).setView([lat,lng],14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
  L.circleMarker([lat,lng],{radius:11,weight:3,color:'#fff',fillColor:'#bd5a37',fillOpacity:1}).addTo(map).bindPopup('<b>'+s.title+'</b>').openPopup();
  var btn=document.getElementById('near-btn'),grid=document.getElementById('nearby');
  btn.style.display='';
  btn.addEventListener('click',async function(){
    btn.disabled=true;btn.textContent='Buscando…';
    try{
      var r=await fetch('/api/public/nearby?lat='+lat+'&lng='+lng+'&exclude='+s.id);
      var j=await r.json(),near=j.results||[],b=[[lat,lng]];
      near.forEach(function(p){L.circleMarker([p.lat,p.lng],{radius:8,weight:2,color:'#fff',fillColor:'#1f3a31',fillOpacity:1}).addTo(map).bindPopup('<a href="/propiedad/'+p.id+'" style="color:#221d17;text-decoration:none"><b>'+p.price+'</b><br>'+p.title+'</a>');b.push([p.lat,p.lng]);});
      if(b.length>1)map.fitBounds(b,{padding:[40,40],maxZoom:14});
      grid.innerHTML=near.length?near.map(function(p){return '<a class="card" href="/propiedad/'+p.id+'"><div class="ph">'+(p.cover?'<img class="ph" src="'+p.cover+'" alt="">':'<span class="empty-ic">🏡</span>')+'</div><div class="body"><div class="price">'+p.price+'</div><div class="ttl">'+p.title+'</div><div class="meta">'+(p.city||'')+'</div></div></a>';}).join(''):'<p class="muted">No hay otras propiedades cerca.</p>';
      btn.style.display='none';
    }catch(e){btn.disabled=false;btn.textContent='Ver propiedades cercanas';}
  });
})();`;

// Favorito en la ficha: el corazón refleja el estado (fetch de /api/favorites/ids) y
// togglea con POST/DELETE. Sin sesión (401) → manda a login. La cookie SSO es same-site.
const FAV_SCRIPT = `(function(){
  var b=document.getElementById('fav-btn');if(!b)return;
  var id=parseInt(b.getAttribute('data-id'),10),saved=false;
  function paint(){b.textContent=saved?'♥ Guardado':'♡ Guardar';b.classList.toggle('on',saved);}
  fetch('/api/favorites/ids',{credentials:'include'}).then(function(r){return r.ok?r.json():null;}).then(function(j){if(j&&j.ids&&j.ids.indexOf(id)>=0){saved=true;paint();}}).catch(function(){});
  b.addEventListener('click',function(){
    b.disabled=true;
    var req=saved?fetch('/api/favorites/'+id,{method:'DELETE',credentials:'include'}):fetch('/api/favorites',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({property_id:id})});
    req.then(function(r){if(r.status===401){window.location.href='/app';return;}if(r.ok){saved=!saved;paint();}}).catch(function(){}).finally(function(){b.disabled=false;});
  });
})();`;

// Guardar la búsqueda actual (querystring) para recibir alertas por email de nuevas coincidencias.
const SAVE_SEARCH_SCRIPT = `(function(){
  var b=document.getElementById('savesearch-btn');if(!b)return;
  b.addEventListener('click',function(){
    b.disabled=true;
    var p=new URLSearchParams(window.location.search);
    var q={op:p.get('op'),ciudad:p.get('ciudad'),min:p.get('min'),max:p.get('max'),amb:p.get('amb')};
    fetch('/api/saved-searches',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({query_json:q})})
      .then(function(r){if(r.status===401){window.location.href='/app';return;}if(r.ok){b.textContent='🔔 Te avisamos por email ✓';}else{b.disabled=false;}})
      .catch(function(){b.disabled=false;});
  });
})();`;

// Lightbox de la galería de la ficha: click en la foto principal o en cualquier miniatura
// abre un visor a pantalla completa navegable (‹ ›, teclado, ✕). Fotos vía JSON en #gdata.
const GALLERY_SCRIPT = `(function(){
  var d=document.getElementById('gdata');if(!d)return;
  var imgs=[];try{imgs=JSON.parse(d.textContent||'[]')}catch(e){}
  if(!imgs.length)return;
  var i=0,ov=null;
  function at(){return (i%imgs.length+imgs.length)%imgs.length;}
  function show(){ov.querySelector('img').src=imgs[at()];ov.querySelector('.glb-count').textContent=(at()+1)+' / '+imgs.length;}
  function close(){if(ov){ov.style.display='none';document.body.style.overflow='';}}
  function open(n){i=n;
    if(!ov){
      ov=document.createElement('div');ov.className='glb';
      ov.innerHTML='<button class="glb-x" aria-label="Cerrar">\\u2715</button><button class="glb-nav glb-prev" aria-label="Anterior">\\u2039</button><img alt=""><button class="glb-nav glb-next" aria-label="Siguiente">\\u203A</button><div class="glb-count"></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click',function(e){if(e.target===ov||e.target.classList.contains('glb-x'))close();});
      ov.querySelector('.glb-prev').addEventListener('click',function(e){e.stopPropagation();i--;show();});
      ov.querySelector('.glb-next').addEventListener('click',function(e){e.stopPropagation();i++;show();});
    }
    ov.style.display='flex';document.body.style.overflow='hidden';show();
  }
  document.addEventListener('keydown',function(e){if(!ov||ov.style.display==='none')return;if(e.key==='Escape')close();else if(e.key==='ArrowRight'){i++;show();}else if(e.key==='ArrowLeft'){i--;show();}});
  document.querySelectorAll('[data-gidx]').forEach(function(el){el.addEventListener('click',function(){open(parseInt(el.getAttribute('data-gidx'),10)||0);});});
})();`;

export const publicSite = new Hono<AppEnv>();

publicSite.get('/', async (c) => {
  // Nada de esto depende de lo anterior: en serie eran cuatro viajes a D1 encadenados.
  const [rows, brand, wa, testimonials] = await Promise.all([
    queryProperties(c.env.DB, { ...parseFilters(new URLSearchParams()), limit: 9 }),
    getBrand(c.env.DB),
    resolveSiteWhatsapp(c.env.DB),
    getPublishedTestimonials(c.env.DB),
  ]);
  const cards = rows.length
    ? `<div class="grid">${rows.map(propertyCard).join('')}</div>`
    : `<div class="empty">Todavía no hay propiedades publicadas. Volvé pronto 🏡</div>`;
  const origin = new URL(c.req.url).origin;
  const brandName = brand.name;
  const brandLogoKey = brand.logoKey;
  // El CTA de captación va al WhatsApp de la inmobiliaria: el visitante no publica solo.
  const contactWa = wa
    ? waLink(wa, `Hola ${brandName}, tengo una propiedad y quiero publicarla con ustedes.`)
    : null;
  // El login depende de lo que tenga configurado ESTE deploy (SSO o Google propio):
  // mandar al que falta devuelve 500 "Login no configurado".
  const loginUrl = `${ssoEnabled(c.env) ? '/api/auth/coopen' : '/api/auth/google'}?return_to=${encodeURIComponent('/app')}`;
  const body = renderLanding({ cards, brandName, loginUrl, contactWa, testimonials });
  const authed = !!(await resolveUser(c.env, c.req.raw));
  return c.html(
    pageShell({
      title: `${brandName} — Alquilar, comprar y vender propiedades`,
      description: 'Alquiler, venta y temporario: mirá nuestra cartera de propiedades, filtrá por ciudad, precio y fechas, y consultanos por WhatsApp.',
      origin,
      canonicalPath: '/',
      body,
      ogImage: `${origin}/media/site/hero.jpg`,
      authed,
      brandName,
      brandLogoKey,
    }),
  );
});

publicSite.get('/buscar', async (c) => {
  const origin = new URL(c.req.url).origin;
  const f = parseFilters(new URL(c.req.url).searchParams);
  const rows = await queryProperties(c.env.DB, f);
  const cards = rows.length
    ? `<div class="grid">${rows.map(propertyCard).join('')}</div>`
    : `<div class="empty">No hay resultados para esta búsqueda. Probá con otros filtros.</div>`;
  const points = rows
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, title: r.title, price: money(r.price, r.currency), cover: r.cover_key ? mediaUrl(r.cover_key) : null }));
  const desc = `${rows.length} propiedades${f.operation ? ` en ${f.operation}` : ''}${f.city ? ` en ${f.city}` : ''}.`;
  const body = `<section class="srch">
      <div class="srch-top"><h1>Buscar propiedades</h1>${searchForm(f)}</div>
      <div class="srch-count"><span>${rows.length} resultado${rows.length === 1 ? '' : 's'}${f.city ? ` en ${esc(f.city)}` : ''}</span><div class="srch-acts"><button id="savesearch-btn" class="btn ghost">🔔 Guardar búsqueda</button><button id="geo-btn" class="btn ghost">📍 Buscar cerca de mí</button></div></div>
      <div class="srch-body">
        <div class="srch-list">${cards}</div>
        <div class="srch-map"><div id="map"></div></div>
      </div>
    </section>
    <script id="pdata" type="application/json">${JSON.stringify(points)}</script>
    <script>${whenLeaflet(MAP_SCRIPT)}</script>
    <script>${SAVE_SEARCH_SCRIPT}</script>`;
  const [authed, brand] = await Promise.all([
    resolveUser(c.env, c.req.raw).then((u) => !!u),
    getBrand(c.env.DB),
  ]);
  const brandName = brand.name;
  const brandLogoKey = brand.logoKey;
  return c.html(
    pageShell({
      title: `Buscar propiedades${f.city ? ` en ${f.city}` : ''} — ${brandName}`,
      description: desc,
      origin,
      canonicalPath: '/buscar',
      body,
      head: MAP_HEAD,
      authed,
      brandName,
      brandLogoKey,
    }),
  );
});

publicSite.get('/propiedad/:id', async (c) => {
  const origin = new URL(c.req.url).origin;
  const id = num(c.req.param('id'));
  const prop = id == null ? null : await c.env.DB
    .prepare(`SELECT p.*, ${COMPUTED_STATUS_SQL} AS status FROM properties p WHERE p.id = ? AND p.published = 1`)
    .bind(id)
    .first<AnyRow>();
  if (!prop) {
    const brandName = await getBrandName(c.env.DB);
  const brandLogoKey = await getBrandLogoKey(c.env.DB);
    return c.html(
      pageShell({
        title: `Propiedad no encontrada — ${brandName}`,
        description: 'La propiedad que buscás no existe o ya no está publicada.',
        origin,
        body: `<div class="empty">Esta propiedad no existe o ya no está publicada. <a href="/buscar">Ver otras</a>.</div>`,
        authed: !!(await resolveUser(c.env, c.req.raw)),
        brandName,
        brandLogoKey,
      }),
      404,
    );
  }
  // Contar la visita (best-effort, no bloquea el render): 1 por navegador cada 6h por
  // propiedad (cookie), salteando bots/crawlers/previews. Agregado por día en property_views.
  const ua = c.req.header('User-Agent') || '';
  const isBot = /bot|crawl|spider|slurp|bing|google|facebookexternalhit|whatsapp|telegram|preview|monitor|curl|wget|headless/i.test(ua);
  const alreadySeen = (c.req.header('Cookie') || '').includes(`pv${prop.id}=`);
  if (!isBot && !alreadySeen) {
    c.executionCtx.waitUntil(
      c.env.DB
        .prepare(
          `INSERT INTO property_views (property_id, day, count) VALUES (?, date('now'), 1)
           ON CONFLICT(property_id, day) DO UPDATE SET count = count + 1`,
        )
        .bind(prop.id)
        .run(),
    );
    c.header('Set-Cookie', `pv${prop.id}=1; Path=/; Max-Age=21600; SameSite=Lax`);
  }

  // Todo lo que falta para armar la página no depende entre sí: va en paralelo. En serie
  // eran cuatro viajes encadenados a D1 y se notaban en el TTFB de la ficha.
  const [photos, wa, authed, brand] = await Promise.all([
    c.env.DB.prepare('SELECT r2_key FROM property_media WHERE property_id = ? ORDER BY sort')
      .bind(prop.id).all<{ r2_key: string }>().then((r) => r.results),
    resolvePropertyWhatsapp(c.env.DB, prop),
    resolveUser(c.env, c.req.raw).then((u) => !!u),
    getBrand(c.env.DB),
  ]);
  const photoUrls = photos.map((p) => mediaUrl(p.r2_key));
  // La foto grande es el LCP: se pide con prioridad. Las miniaturas, en diferido.
  const gallery = photos.length
    ? `<div class="gallery" data-gidx="0" title="Ampliar foto"><img src="${esc(photoUrls[0]!)}" alt="${esc(prop.title)}" fetchpriority="high" decoding="async">${photos.length > 1 ? `<span class="gal-count">📷 ${photos.length} fotos</span>` : ''}</div>` +
      (photos.length > 1
        ? `<div class="thumbs">${photos.slice(1, 6).map((p, i) => `<img data-gidx="${i + 1}" src="${esc(mediaUrl(p.r2_key))}" alt="" loading="lazy" decoding="async">`).join('')}${photos.length > 6 ? `<span class="thumb-more" data-gidx="6">+${photos.length - 6}</span>` : ''}</div>`
        : '')
    : `<div class="gallery">Sin fotos aún</div>`;
  const loc = [prop.address, prop.city, prop.province].filter(Boolean).join(', ');

  const spec = (icon: string, label: string) => `<span class="spec">${icon} ${esc(label)}</span>`;
  const specsArr: string[] = [];
  if (prop.rooms != null) specsArr.push(spec('🛏', `${prop.rooms} ambientes`));
  if (prop.bathrooms != null) specsArr.push(spec('🚿', `${prop.bathrooms} baño${prop.bathrooms == 1 ? '' : 's'}`));
  if (prop.capacity != null) specsArr.push(spec('👥', `${prop.capacity} personas`));
  if (prop.area_m2 != null) specsArr.push(spec('📐', `${prop.area_m2} m²`));

  // Mapa: si hay lat/lng se usan; si no, el script geocodifica la dirección (Nominatim).
  // Las cercanas se traen client-side de /api/public/nearby. Se muestra siempre que haya
  // coordenadas o una dirección/ciudad que geocodificar.
  const canMap = (prop.lat != null && prop.lng != null) || !!(prop.address || prop.city);
  const geoQ = [prop.address, prop.city, prop.province, 'Argentina'].filter(Boolean).join(', ');
  const mapSection = canMap ? `
    <section class="map-sec">
      <h3>Ubicación</h3>
      <div class="ficha-map"><div id="fmap"></div></div>
      <button id="near-btn" class="btn ghost" style="display:none;margin-top:12px">Ver propiedades cercanas</button>
      <div id="nearby" class="nearby-grid"></div>
    </section>
    <script id="fdata" type="application/json">${JSON.stringify({ id: prop.id, lat: prop.lat, lng: prop.lng, title: prop.title, q: geoQ })}</script>
    <script>${whenLeaflet(FICHA_MAP_SCRIPT)}</script>` : '';

  // SEO: og:image (portada) + JSON-LD schema.org para rich results / previews.
  const imagesAbs = photos.slice(0, 6).map((p) => `${origin}${mediaUrl(p.r2_key)}`);
  const ogImage = imagesAbs[0] || `${origin}/media/site/hero.jpg`;
  const ldType = /casa|house|quinta|ph/i.test(String(prop.kind || '')) ? 'House'
    : /local|terreno|lote|oficina/i.test(String(prop.kind || '')) ? 'Product' : 'Apartment';
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': ldType,
    name: prop.title, description: String(prop.description || '').slice(0, 400),
    image: imagesAbs.length ? imagesAbs : [ogImage], url: `${origin}/propiedad/${prop.id}`,
    ...(prop.rooms != null ? { numberOfRooms: prop.rooms } : {}),
    ...(prop.area_m2 != null ? { floorSize: { '@type': 'QuantitativeValue', value: prop.area_m2, unitCode: 'MTK' } } : {}),
    address: { '@type': 'PostalAddress', streetAddress: prop.address || undefined, addressLocality: prop.city || undefined, addressRegion: prop.province || undefined, addressCountry: 'AR' },
    ...(prop.lat != null && prop.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: prop.lat, longitude: prop.lng } } : {}),
    ...(prop.price != null ? { offers: { '@type': 'Offer', price: prop.price, priceCurrency: prop.currency || 'ARS', availability: 'https://schema.org/InStock' } } : {}),
  });

  // Ubicación NO va en los facts del panel (ya está bajo el título) para no repetir.
  const facts = [
    ['Operación', prop.operation],
    ['Tipo', prop.kind || '—'],
    ['Estado', prop.status],
  ].map(([k, v]) => `<li><b>${esc(k)}</b>${esc(v)}</li>`).join('');
  const asideSpecs = specsArr.length ? `<div class="aside-specs">${specsArr.join('')}</div>` : '';
  const asideAmen = amenityChips(prop.amenities, 'aside-amen');
  const body = `<article class="detail">
      <div class="d-gallery">${gallery}</div>
      <div class="d-head">
        <h1>${esc(prop.title)}</h1>
        <div class="lead">📍 ${esc(loc || 'Ubicación a confirmar')}</div>
      </div>
      <aside class="aside-card">
        <div class="big-price">${esc(money(prop.price, prop.currency, prop.price_period))}</div>
        <ul class="facts-list">${facts}</ul>
        ${asideSpecs}
        ${asideAmen}
        ${wa
          ? `<a class="btn wa" href="/wa/${prop.id}">Consultar por WhatsApp</a>`
          : `<a class="btn" href="/app">Contactar / Agendar visita</a>`}
        <button id="fav-btn" class="btn ghost fav" data-id="${prop.id}">♡ Guardar</button>
      </aside>
      <div class="d-body">
        <p class="desc">${esc(prop.description || 'Sin descripción.')}</p>
        ${mapSection}
      </div>
    </article>
    <script id="gdata" type="application/json">${JSON.stringify(photoUrls)}</script>
    <script>${GALLERY_SCRIPT}</script>
    <script>${FAV_SCRIPT}</script>`;
  const brandName = brand.name;
  const brandLogoKey = brand.logoKey;
  return c.html(
    pageShell({
      title: `${prop.title} — ${money(prop.price, prop.currency, prop.price_period)} — ${brandName}`,
      description: `${prop.operation} · ${loc || 'Propiedad'} · ${money(prop.price, prop.currency, prop.price_period)}. ${String(prop.description || '').slice(0, 120)}`,
      origin,
      canonicalPath: `/propiedad/${prop.id}`,
      body,
      head: `${canMap ? LEAFLET_ASSETS : ''}<script type="application/ld+json">${jsonLd}</script>`,
      ogImage,
      authed,
      brandName,
      brandLogoKey,
    }),
  );
});

// ── API JSON pública (para mejoras client-side del marketplace) ──
export const publicApi = new Hono<AppEnv>();

publicApi.get('/search', async (c) => {
  const f = parseFilters(new URL(c.req.url).searchParams);
  const rows = await queryProperties(c.env.DB, f);
  return c.json({ results: rows, count: rows.length });
});

// Propiedades publicadas cerca de un punto (para la ficha: "propiedades cercanas").
publicApi.get('/nearby', async (c) => {
  const q = new URL(c.req.url).searchParams;
  const lat = num(q.get('lat'));
  const lng = num(q.get('lng'));
  const exclude = num(q.get('exclude')) ?? -1;
  if (lat == null || lng == null) return c.json({ results: [] });
  const res = await c.env.DB
    .prepare(`SELECT ${CARD_COLS} FROM properties
              WHERE published = 1 AND id != ? AND lat IS NOT NULL AND lng IS NOT NULL
              ORDER BY ((lat - ?) * (lat - ?) + (lng - ?) * (lng - ?)) LIMIT 6`)
    .bind(exclude, lat, lat, lng, lng)
    .all<CardRow>();
  const results = res.results.map((r) => ({
    id: r.id, lat: r.lat, lng: r.lng, title: r.title, city: r.city,
    price: money(r.price, r.currency, r.price_period),
    cover: r.cover_key ? mediaUrl(r.cover_key) : null,
  }));
  return c.json({ results });
});

publicApi.get('/property/:id', async (c) => {
  const id = num(c.req.param('id'));
  const p = id == null ? null : await c.env.DB
    .prepare(`SELECT p.*, ${COMPUTED_STATUS_SQL} AS status FROM properties p WHERE p.id = ? AND p.published = 1`)
    .bind(id)
    .first();
  if (!p) return c.json({ error: 'No encontrada', code: 'NOT_FOUND' }, 404);
  const media = await c.env.DB
    .prepare('SELECT r2_key, kind, sort FROM property_media WHERE property_id = ? ORDER BY sort')
    .bind(id)
    .all();
  return c.json({ property: p, media: media.results });
});
