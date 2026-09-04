import { esc } from './layout';

// Landing SSR del marketplace — estética "warm editorial real estate".
// Hero con foto real, intención (alquilar/comprar/vender), sección humana, CTA login.
// Mobile-first; interactividad progresiva (título que cambia al hover), anda sin JS.

const LP_STYLES = `
.lp-hero{position:relative;overflow:hidden;border-radius:22px;margin:16px 0 12px;min-height:500px;display:flex;align-items:flex-end;background:#241d15;box-shadow:var(--shadow-lg)}
.lp-hero .lp-bg{position:absolute;inset:0;background:url('/media/site/hero.jpg') center/cover no-repeat;transform:scale(1.03);animation:lp-zoom 20s ease-in-out infinite alternate}
@keyframes lp-zoom{to{transform:scale(1.11)}}
.lp-hero .lp-ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(28,22,15,.12) 0%,rgba(28,22,15,.5) 52%,rgba(24,18,12,.9) 100%)}
.lp-hero .lp-in{position:relative;padding:40px 34px 34px;width:100%;max-width:720px}
.lp-eyebrow{display:inline-block;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#f2e4cf;background:rgba(189,90,55,.34);border:1px solid rgba(240,200,160,.35);border-radius:999px;padding:6px 14px;margin-bottom:16px}
.lp-title{font-size:clamp(32px,6.5vw,60px);line-height:1.02;margin:0 0 14px;font-weight:700;color:#fdf8ef;transition:opacity .18s}
.lp-sub{color:#eaddc8;font-size:clamp(16px,4vw,20px);max-width:540px;margin:0 0 26px;line-height:1.5}
.lp-cta{display:flex;gap:12px;flex-wrap:wrap}
.lp-fade{opacity:0;transform:translateY(16px);animation:lp-in .7s cubic-bezier(.2,.7,.2,1) forwards}
.lp-fade.d1{animation-delay:.06s}.lp-fade.d2{animation-delay:.18s}.lp-fade.d3{animation-delay:.3s}
@keyframes lp-in{to{opacity:1;transform:none}}

/* Ritmo vertical: las secciones necesitan aire entre sí. Con tanto dato por propiedad,
   pegarlas hace que la página se lea como una planilla. */
.lp-sec{margin:72px 0 10px}
.lp-sec h2{font-size:clamp(24px,5vw,32px);margin:0 0 6px}
.lp-sec .lp-lead{color:var(--muted);margin:0 0 24px;font-size:17px}
.lp-sec .section-h{margin-bottom:22px}

.lp-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.lp-card{position:relative;display:block;padding:26px 24px;border-radius:18px;border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow);transition:transform .16s ease,box-shadow .25s ease}
.lp-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg)}
/* Ícono SVG, no emoji (§6): el emoji lo dibuja cada SO a su manera y no toma el color. */
.lp-card .lp-ic{display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin-bottom:14px;border-radius:12px;background:color-mix(in srgb,var(--accent) 9%,transparent);color:var(--accent)}
.lp-card .lp-ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.lp-card b{font-size:21px;font-weight:600}
.lp-card span.lp-desc{display:block;color:var(--muted);margin-top:5px;font-size:15px;text-wrap:pretty}
.lp-card .lp-go{position:absolute;top:24px;right:24px;color:var(--accent);opacity:0;transform:translateX(-4px);transition:opacity .16s ease,transform .16s ease}
.lp-card .lp-go svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.lp-card:hover .lp-go{opacity:1;transform:none}

.lp-search{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(180px,1.4fr) auto auto;gap:10px;margin:22px 0 0;background:var(--surface);padding:12px;border-radius:16px;border:1px solid var(--line);box-shadow:var(--shadow)}
.lp-search select,.lp-search input{padding:13px 14px;border-radius:10px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font:inherit;font-size:15px;min-width:0}

/* Prueba social. La sección NO se renderiza si la inmobiliaria no cargó testimonios
   reales: mejor no tener sección que tener una inventada. */
.lp-says{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:20px 0 0}
.lp-say{padding:24px;border-radius:18px;border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow);display:flex;flex-direction:column;gap:14px}
.lp-say .q{margin:0;font-size:16.5px;line-height:1.6;text-wrap:pretty}
.lp-say .q::before{content:"“";display:block;font-size:44px;line-height:.5;color:var(--accent);opacity:.35;margin-bottom:12px}
.lp-say .who{display:flex;align-items:center;gap:11px;margin-top:auto}
/* Inicial en un círculo: identifica sin inventar una foto que no tenemos. */
.lp-say .ini{display:flex;align-items:center;justify-content:center;width:38px;height:38px;flex:none;border-radius:50%;background:var(--forest);color:#f6f1e8;font-weight:600;font-size:16px;line-height:1}
.lp-say .who b{display:block;font-size:15px}
.lp-say .who span{display:block;color:var(--muted);font-size:13.5px}

.lp-human{display:grid;grid-template-columns:1fr 1.05fr;gap:26px;align-items:center;margin:72px 0;padding:38px;border-radius:22px;background:var(--forest);color:#f0e6d3;box-shadow:var(--shadow-lg)}
.lp-human h2{margin:0 0 12px;font-size:clamp(24px,4.5vw,34px);color:#fdf8ef}
.lp-human p{color:#c9bda4;margin:0 0 20px;font-size:17px;line-height:1.55}
.lp-human .btn.wa{background:var(--wa)}
.lp-human-imgs{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.lp-human-imgs img{width:100%;height:230px;object-fit:cover;border-radius:16px;display:block}
.lp-human-imgs img:first-child{margin-top:-18px}
.lp-human-imgs img:last-child{margin-bottom:-18px}

.lp-account{margin:72px 0;padding:32px 36px;border-radius:22px;border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow);display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}
.lp-account b{font-size:22px;font-weight:600}
.lp-account p{color:var(--muted);margin:5px 0 0;font-size:16px}

.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:22px 0 64px}
.lp-step{padding:24px;border:1px solid var(--line);border-radius:18px;background:var(--surface);box-shadow:var(--shadow)}
.lp-step .n{color:var(--accent);font-weight:700;font-size:24px;font-variant-numeric:tabular-nums}
.lp-step b{display:block;margin:8px 0 3px;font-size:17px}
.lp-step span{color:var(--muted);font-size:15px;text-wrap:pretty}

/* CTA de sección: "Ver todas" era un link de texto que se perdía al lado de un h2 de
   32px. Como pastilla con borde tiene peso propio y area de toque de sobra en el cel. */
.lp-more{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--accent);font-weight:600;font-size:15px;white-space:nowrap;box-shadow:var(--shadow);transition:transform .12s ease,border-color .2s ease,background .2s ease}
.lp-more:hover{transform:translateY(-1px);border-color:var(--accent);background:var(--paper)}
.lp-more .go{display:flex}
.lp-more svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .16s ease}
.lp-more:hover svg{transform:translateX(3px)}

@media(max-width:900px){
  .lp-search{grid-template-columns:1fr 1fr}
  .lp-search input[name=ciudad]{grid-column:1/-1}
}
@media(max-width:820px){.lp-human{grid-template-columns:1fr}.lp-human-imgs img:first-child,.lp-human-imgs img:last-child{margin:0}}
@media(max-width:640px){
  .lp-hero{min-height:440px;border-radius:16px}.lp-hero .lp-in{padding:26px 20px 24px}
  .lp-cta .btn{flex:1;text-align:center}
  .lp-cards,.lp-steps{grid-template-columns:1fr}
  .lp-human{padding:24px}.lp-human-imgs img{height:160px}
  .lp-account{flex-direction:column;align-items:stretch;text-align:center;padding:24px}.lp-account .lp-cta .btn{flex:1}
  /* En el cel el buscador va apilado y a lo ancho: 4 controles en fila quedaban de
     ~80px cada uno, imposibles de tocar y con el placeholder cortado. */
  .lp-sec{margin:52px 0 10px}
  .lp-search{grid-template-columns:1fr;padding:12px;gap:9px}
  .lp-search .btn{width:100%;padding:13px 18px}
  .lp-say{padding:20px}
}
`;

const LP_SCRIPT = `(function(){
  var t=document.getElementById('lp-title');
  if(t){var base=t.textContent;
    document.querySelectorAll('[data-title]').forEach(function(el){
      el.addEventListener('pointerenter',function(){t.style.opacity=.25;setTimeout(function(){t.textContent=el.getAttribute('data-title');t.style.opacity=1;},110);});
      el.addEventListener('pointerleave',function(){t.style.opacity=.25;setTimeout(function(){t.textContent=base;t.style.opacity=1;},110);});
    });
  }
  // "Cerca de mí": geolocaliza (con el gesto del click) y lleva a /buscar con las coords.
  document.querySelectorAll('[data-near]').forEach(function(b){
    b.addEventListener('click',function(){
      if(!navigator.geolocation){window.location.href='/buscar';return;}
      var orig=b.textContent;b.textContent='Buscando…';b.disabled=true;
      navigator.geolocation.getCurrentPosition(function(pos){
        var la=Math.round(pos.coords.latitude*1e5)/1e5,ln=Math.round(pos.coords.longitude*1e5)/1e5;
        window.location.href='/buscar?near=1&lat='+la+'&lng='+ln;
      },function(){b.textContent=orig;b.disabled=false;alert('No pudimos obtener tu ubicación. Revisá los permisos del navegador y probá de nuevo.');},{enableHighAccuracy:true,timeout:8000});
    });
  });
})();`;

/** Íconos de las tarjetas de intención (SVG inline; ver §6: nada de emoji como ícono). */
const LP_ICONS: Record<string, string> = {
  llave: '<path d="M15.5 3a5.5 5.5 0 1 0-4.9 8L4 17.6V21h3.4l.9-.9v-1.8h1.8l.9-.9v-1.8h1.8l1.7-1.7A5.5 5.5 0 0 0 15.5 3z"/><circle cx="16.5" cy="7.5" r="1.2"/>',
  casa: '<path d="M3 10.4 12 3l9 7.4"/><path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6"/><path d="M9.5 21v-6h5v6"/>',
  mano: '<path d="M12 6.5 9.6 4.3a2.7 2.7 0 0 0-3.8 3.8L12 14l6.2-5.9a2.7 2.7 0 0 0-3.8-3.8L12 6.5z"/><path d="M4 15.5 8 19a4 4 0 0 0 5.3.2L20 13.5"/>',
  palmera: '<path d="M12 21v-9"/><path d="M12 12c-3.4-2-6.2-1.6-7.5 0 1.6-4.4 5-6 7.5-4"/><path d="M12 12c3.4-2 6.2-1.6 7.5 0-1.6-4.4-5-6-7.5-4"/><path d="M12 8V5"/>',
  flecha: '<path d="M5 12h13M13 6l6 6-6 6"/>',
};
const icon = (k: string, cls: string) => `<span class="${cls}"><svg viewBox="0 0 24 24" aria-hidden="true">${LP_ICONS[k]}</svg></span>`;

export type Testimonial = { author: string; role: string | null; quote: string };

export type LandingOpts = {
  cards: string;
  brandName: string;
  /** URL de login del camino que ESTE deploy tiene configurado (SSO o Google propio). */
  loginUrl: string;
  /** wa.me de la inmobiliaria para el CTA de captación. null = se esconde el CTA. */
  contactWa: string | null;
  /** Testimonios REALES cargados por la inmobiliaria. Vacío = la sección no existe. */
  testimonials?: Testimonial[];
};

export function renderLanding({ cards, brandName, loginUrl, contactWa, testimonials = [] }: LandingOpts): string {
  const login = loginUrl;
  // Prueba social: solo con testimonios cargados. Nunca se muestran de ejemplo — una
  // reseña inventada es lo contrario de la confianza que esta sección busca.
  const says = testimonials.length
    ? `<section class="lp-sec">
        <div class="section-h"><h2>Lo que dicen quienes ya pasaron por acá</h2></div>
        <div class="lp-says">
          ${testimonials.map((t) => `<figure class="lp-say">
            <blockquote class="q">${esc(t.quote)}</blockquote>
            <figcaption class="who">
              <span class="ini" aria-hidden="true">${esc(t.author.trim().charAt(0).toUpperCase())}</span>
              <span><b>${esc(t.author)}</b>${t.role ? `<span>${esc(t.role)}</span>` : ''}</span>
            </figcaption>
          </figure>`).join('')}
        </div>
      </section>`
    : '';
  // Captación: el visitante NO publica solo (el software se vende a inmobiliarias), así
  // que el CTA de "publicar" lo manda a hablar con la inmobiliaria. Si no cargó su
  // WhatsApp, se esconde el botón en vez de mostrar un link roto.
  const captarBtn = contactWa
    ? `<a class="btn ghost" style="color:#fdf8ef;border-color:rgba(255,255,255,.4)" href="${esc(contactWa)}" target="_blank" rel="noopener">¿Tenés una propiedad?</a>`
    : '';
  const intentCard = (href: string, ic: string, title: string, desc: string, heroTitle: string) =>
    `<a class="lp-card" href="${esc(href)}" data-title="${esc(heroTitle)}">
      ${icon(ic, 'lp-ic')}<b>${esc(title)}</b>
      <span class="lp-desc">${esc(desc)}</span>${icon('flecha', 'lp-go')}
    </a>`;

  return `<style>${LP_STYLES}</style>
  <section class="lp-hero">
    <div class="lp-bg"></div><div class="lp-ov"></div>
    <div class="lp-in">
      <span class="lp-eyebrow lp-fade">${esc(brandName)}</span>
      <h1 class="lp-title lp-fade d1" id="lp-title">Tu próxima casa empieza acá</h1>
      <p class="lp-sub lp-fade d2">Alquilá, comprá o invertí. Toda nuestra cartera de propiedades, en un solo lugar.</p>
      <div class="lp-cta lp-fade d3">
        <a class="btn" href="/buscar">Buscar propiedades</a>
        <button class="btn ghost" type="button" data-near style="color:#fdf8ef;border-color:rgba(255,255,255,.4)">Cerca de mí</button>
        ${captarBtn}
      </div>
    </div>
  </section>

  <section class="lp-sec">
    <h2>¿Qué estás buscando?</h2>
    <div class="lp-cards">
      ${intentCard('/buscar?op=alquiler', 'llave', 'Alquilar', 'Encontrá dónde vivir, permanente o temporario', 'Encontrá dónde vivir')}
      ${intentCard('/buscar?op=venta', 'casa', 'Comprar', 'Invertí o mudate a tu próxima casa', 'Comprá con confianza')}
      ${
        contactWa
          ? intentCard(contactWa, 'mano', 'Publicar con nosotros', 'Dejanos tu propiedad y nos ocupamos de todo', 'Nos ocupamos de todo')
          : intentCard('/buscar?op=temporario', 'palmera', 'Temporario', 'Alquileres por temporada, listos para disfrutar', 'Alquileres por temporada')
      }
    </div>
    <form class="lp-search" method="get" action="/buscar">
      <select name="op" aria-label="Operación"><option value="">Cualquier operación</option><option value="alquiler">Alquiler</option><option value="venta">Venta</option><option value="temporario">Temporario</option></select>
      <input name="ciudad" placeholder="¿En qué ciudad?" aria-label="Ciudad">
      <button class="btn" type="submit">Buscar</button>
      <button class="btn ghost" type="button" data-near>Cerca de mí</button>
    </form>
  </section>

  <section class="lp-human">
    <div>
      <h2>Detrás de cada casa, hay personas</h2>
      <p>Ayudamos a familias a encontrar su lugar y acompañamos a cada propietario que nos confía su propiedad, con la atención de una inmobiliaria de verdad.</p>
      <div class="lp-cta"><a class="btn" href="/buscar">Explorar propiedades</a></div>
    </div>
    <div class="lp-human-imgs">
      <img src="/media/site/interior.jpg" alt="Living cálido de un hogar" loading="lazy">
      <img src="/media/site/keys.jpg" alt="Llaves de una nueva casa" loading="lazy">
    </div>
  </section>

  <section class="lp-sec"><div class="section-h"><h2>Propiedades destacadas</h2><a class="lp-more" href="/buscar">Ver todas${icon('flecha', 'go')}</a></div>${cards}</section>

  ${says}

  <section class="lp-account">
    <div>
      <b>¿Ya tenés cuenta?</b>
      <p>Ingresá para ver tus favoritos y tus alertas de búsqueda. ¿Primera vez? Creá tu cuenta gratis.</p>
    </div>
    <div class="lp-cta">
      <a class="btn" href="${esc(login)}">Ingresar</a>
      <a class="btn ghost" href="${esc(login)}">Crear cuenta</a>
    </div>
  </section>

  <section class="lp-steps">
    <div class="lp-step"><span class="n">01</span><b>Buscá</b><span>Filtrá por operación, ciudad, precio y fechas hasta dar con lo tuyo.</span></div>
    <div class="lp-step"><span class="n">02</span><b>Consultá</b><span>Escribinos por WhatsApp y coordinamos la visita.</span></div>
    <div class="lp-step"><span class="n">03</span><b>Cerrá el trato</b><span>Nos ocupamos del contrato, la documentación y el seguimiento.</span></div>
  </section>
  <script>${LP_SCRIPT}</script>`;
}
