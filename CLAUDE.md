# El Muelle Places — Software de gestión inmobiliaria + marketplace

> 📌 **Repo standalone** (2026-09-04): este código viene de `CoopenPlaces`
> (`github.com/Tms-mrl/Coopenplace`), donde vivía anidado en `SuboAcaTomy/Places/` dentro
> de un monorepo compartido con un compañero (su cuenta de Cloudflare, otros proyectos
> del ecosistema Coopen). Se extrajo a este repo, **`Tms-mrl/TMS-PLACE`**, dedicado a
> El Muelle únicamente, sobre una **cuenta de Cloudflare propia**. No hay más split
> `[env.<cliente>]` ni SSO del ecosistema Coopen (`AUTH_URL`) — es un solo tenant.
> El historial de "Estado" de más abajo se trajo tal cual (viene de cuando el código
> vivía en el monorepo); a partir de la entrada `(2026-09-04)` es de acá.
>
> **Ya estaba provisionado**: el Worker/D1/R2 de `wrangler.toml` no son nuevos — son de
> un deploy standalone anterior de esta misma app, bajo esta misma cuenta de Cloudflare
> (de cuando salió del monorepo por primera vez, antes de volver a entrar como
> `SuboAcaTomy/Places/`). Sigue vivo en `elmuelle.tomyredrebell.workers.dev`. Se
> reusa tal cual en vez de provisionar de cero.

**Dominio:** sin dominio propio todavía — en producción sirve desde
`https://elmuelle.tomyredrebell.workers.dev` (ver `wrangler.toml`).

## Qué es

SaaS de **gestión inmobiliaria** + **marketplace público**, para El Muelle Propiedades
(Villa Gesell / San Bernardo / La Lucila del Mar / Aguas Verdes — Partido de la Costa).
**Tres roles:**

1. **La inmobiliaria** (El Muelle, único tenant) — propiedades, clientes y sucursales,
   equipo/agentes, operaciones. **Es la única que publica.**
2. **Usuarios** (turistas / inquilinos / compradores) — buscan, guardan favoritos y
   alertas, y **consultan a la inmobiliaria**. No publican.
3. **Admin** (el dueño del deploy, allowlist de email en `SUPER_ADMIN_SUBS`) — gestiona
   la suscripción/acceso propio y tiene vista global. Con un solo tenant, este rol casi
   no se usa en el día a día — es más un "modo dios" de mantenimiento.

> ### ⛔ No hay "propietario particular"
>
> El rol de **propietario con autoservicio** —publicar su casa por su cuenta, sin
> inmobiliaria— **no existe**: `POST /api/properties` y `/import` exigen pertenecer a
> una agencia. `owner_kind='particular'` sigue en el esquema por compatibilidad con datos
> viejos importados así, pero nadie puede crear filas nuevas de ese tipo.

## Módulos (alcance funcional)

- **A) Inmobiliaria**: organización, sucursales, equipo/agentes (roles + link de
  acceso), cartera de propiedades (fotos R2, estados), CRM + matching, mandatos,
  pipeline (kanban), contratos/recibos, publicación al marketplace, KPIs. (→) IA.
- **B) Usuarios** (turistas / inquilinos / compradores): búsqueda con filtros+mapa, ficha,
  favoritos/búsquedas guardadas con alertas, consulta por WhatsApp a la inmobiliaria,
  perfil/historial. **Sin publicación**. (→) reservas y pago online, solicitud de
  alquiler con documentación.
- **C) Admin** (allowlist de email): estado de la suscripción propia, vista global.

## Stack

- **Cloudflare Worker único** (`elmuelle`): Hono + SPA por assets binding.
- **Frontend**: React 19 + Vite 6, TS estricto, kebab-case, **mobile-first**.
- **Backend**: Hono 4 + D1 (`coopen-places-db`, binding `DB`), migraciones en
  `db/migrations/`.
- **Blobs**: R2 (`coopen-places-media`) — fotos/planos/docs; D1 solo guarda metadatos
  + key R2, nunca el binario.
- **Auth**: dos caminos (ver §Auth) — link de acceso de agencia (el principal, sin
  Google) · login propio con Google + sesión local (`sessions`, cookie `places_session`,
  con OAuth client propio ya configurado). Sin `JWT_SECRET`, sin SSO externo.
- **Dominio**: sin dominio propio todavía — sirve desde `elmuelle.tomyredrebell.workers.dev`.
  Cuando se defina uno: agregar `routes = [{ pattern = "...", custom_domain = true }]` en `wrangler.toml`
  y, si se habilita el login con Google, autorizar el nuevo `redirect_uri` en Google
  Cloud Console (client **propio**, no compartido con nadie).

### Decisiones clave

- **Auth: dos caminos.** (1) **Link de acceso de inmobiliaria** (`/i/<token>`, magic
  link): el admin crea la agencia y genera el link; sesión local propia (cookie
  `places_access`), sin contraseña, revocable — es el camino que usa el equipo de El
  Muelle día a día, no necesitan cuenta de Google. (2) **Login propio con Google**
  (`src/worker/routes/auth.ts`), sesión propia en D1 — opcional, para el admin o para
  público/consumidor si algún día se habilita. `requireUser` acepta ambos (+ bypass
  `DEV_USER` en dev local).
- **Marketplace SSR e indexable (decidido)**: fichas y resultados de búsqueda se
  renderizan en el Worker como HTML puro (sin JS) para SEO. Los **dashboards de
  gestión** (agency/owner) son SPA React detrás de auth. Rutas públicas = SSR;
  rutas privadas = SPA.
- **Rol = perfil local, no identidad**: un mismo login sirve para agencia/inquilino a
  la vez, sin duplicar cuentas por rol.

## Modelo de datos (resumen)

Multi-tenant en el esquema (aunque hoy es un solo tenant real), `auth_sub` (ej.
`google:<id>`, `access:<slug>`, o `dev:local` en dev) como TEXT. Tablas clave: `users`,
`places_profiles`, `agencies`, `branches`, `agency_members` (rol+sucursal), `properties`
(owner_kind agency|particular, `published`, `external_url`), `property_media`, `clients`
(CRM), `mandates`, `deals` (pipeline), `contracts`/`receipts`, `expenses`, `inquiries`,
`bookings`, `saved_searches`/`favorites`, `property_views` (analítica diaria),
`subscriptions` (`status` trial|active|blocked), `site_settings` (marca + mensaje de
compartir). Super-admin = allowlist de `sub`/email en var, no es tabla. Migraciones
numeradas `0001_initial.sql` … en `db/migrations/`.

**Multi-tenant hardening**: todo `property_id`/`client_id` de un body debe validarse
contra el scope del tenant antes de persistir (`lib/ownership.ts`) y los `LEFT JOIN`
de display deben scopearse — un FK crafteado no debe filtrar datos ajenos.

## Monetización

No aplica en este deploy (es la app de El Muelle, no un producto que se revende). El
gate de trial (`subscriptions.status`) sigue en el código por si algún día se reusa,
pero la suscripción propia se deja en `active` sin vencimiento.

## Estructura

```
src/worker/    API Hono. lib/ (auth, http, r2) · routes/ (agencies, properties, clients,
                deals, contracts, expenses, tenant, …)
src/client/     SPA React+Vite. app.tsx (router por rol) · lib/ · components/
db/migrations/  0001_initial.sql … NNNN_*.sql
db/seed/        seeds de demo + el import real de El Muelle (elmuelle-*.sql)
scripts/        migrate-d1.mjs (migraciones) · import-elmuelle.mjs (scraper + loader
                de la cartera desde elmuellepropiedades.com.ar, ver su cabecera)
wrangler.toml   Worker + [assets] + D1 + R2
```

## Comandos

```bash
pnpm install
pnpm dev                 # wrangler dev (worker + SPA)
pnpm dev:client           # vite HMR (proxy /api → worker; correr ambos)
pnpm build                # vite build → dist/client
pnpm run deploy            # build + wrangler deploy (NO `pnpm deploy`, gotcha pnpm 10+)
pnpm typecheck
pnpm db:migrate:local
pnpm db:migrate:remote    # contra la base real (aditivo: aplica solo lo que falte)
```

Dev local sin login: `cp .dev.vars.example .dev.vars` → `DEV_USER="email|nombre"`
(bypass de Google OAuth en localhost). **NUNCA en prod.**

## Auth

**Link de acceso de agencia** (`src/worker/routes/agencies.ts` + `lib/auth.ts`): el
admin genera un link `/i/<token>` desde el panel (Equipo); quien entra por ahí queda
logueado como esa agencia, sin contraseña. Es el camino pensado para el equipo de El
Muelle — no necesitan Google.

**Login propio con Google** (`src/worker/routes/auth.ts`, opcional): `GET
/api/auth/config` (¿están seteados `GOOGLE_CLIENT_ID`/`_SECRET`?) · `GET
/api/auth/google?return_to=` (redirect a Google, authorization code flow, `state`+
`return_to` en cookie corta) · `GET /api/auth/callback/google` (intercambia el code,
upsert del user, abre sesión propia en D1 — cookie `places_session`, 30 días) · `GET
/api/auth/me` (user + roles) · `POST /api/auth/logout`.

Todo `/api/*` salvo `/api/auth/*` y las rutas públicas del marketplace exige
`requireUser`.

## Gotchas

- 🔴🔴 **NUNCA correr un recorrido automatizado con CLICKS contra producción**
  (heredado del historial en Coopen, 2026-08-02). Un script de Playwright que navegaba
  las pestañas del panel para auditar la UI **borró una propiedad**: el panel tiene
  acciones destructivas y el confirm es un **modal propio de React**, no el `confirm()`
  nativo — el auto-dismiss de dialogs de Playwright **no lo frena**; un segundo click lo
  confirma. **Cómo auditar la UI sin riesgo:** contra `pnpm dev` con la D1 local, o —si
  tiene que ser prod— **solo lectura**: navegar por URL, nunca clickear dentro del panel.
- 🔴 **`defer` en una librería + `<script>` inline que la usa = la feature deja de andar,
  en silencio** (2026-08-04). `leaflet.js` con `defer` + los `<script>` inline
  (`MAP_SCRIPT`/`FICHA_MAP_SCRIPT`) que chequean `if(!window.L) return;` corren ANTES que
  el `defer` — el mapa queda vacío, sin error de consola. Fix: `whenLeaflet()` arranca el
  mapa al `load` si `window.L` todavía no está. Aplica a cualquier CDN diferido.
- **El `redirect_uri` de Google OAuth tiene que estar autorizado en Google Cloud
  Console** (`https://<dominio-actual>/api/auth/callback/google`) — si cambia el
  dominio, hay que sumar esa URL ahí primero o el callback falla con
  `redirect_uri_mismatch`.
- **Custom domain nuevo tarda en el cert TLS** tras el primer deploy (se resuelve solo).
- **D1 local se re-keyea si cambia `database_id`**: correr `pnpm db:migrate:local`.
- **Argenprop tiene anti-bot**: las IPs de Cloudflare suelen estar flageadas → el
  import puede fallar en prod (502 `IMPORT_FAILED`). Fix: `SCRAPER_URL` (secret, proxy
  de scraping tipo ScraperAPI).
- **El import de la cartera de El Muelle** (`scripts/import-elmuelle.mjs`) es **one-shot**,
  no un sync: se corrió una vez para el backfill inicial de ~251 propiedades. Una
  propiedad nueva se carga a mano en los dos sistemas (BuscadorProp y acá) — ver la
  cabecera del script y el commit que lo agregó para el detalle del mapeo.
- Deps externas del front público: Google Fonts, Leaflet (unpkg), tiles OSM.

## Provisión

**Ya provisionado**, en la cuenta de Cloudflare propia (no la del compañero de
Coopenplace): Worker `coopen-places`, D1 `coopen-places-db` (`12c87ac7-…`) y R2
`coopen-places-media`, vivos en `elmuelle.tomyredrebell.workers.dev` desde un
deploy standalone anterior de esta misma app. `SUPER_ADMIN_SUBS` ya apunta al email
real del dueño. Google OAuth propio ya configurado (`GOOGLE_CLIENT_ID` en
`wrangler.toml`; el Client Secret es un secret, no vive en el repo).

**Pendiente**: revisar en qué migración está `coopen-places-db` (es la de un deploy
standalone viejo — `pnpm db:migrate:local` es idempotente y tolera "already exists", así
que `pnpm db:migrate:remote` se puede correr igual, aplica solo lo que falte), + cargar
el import de El Muelle + las fotos contra esta D1/R2 (hoy solo están corridas contra
D1/R2 locales), y un `wrangler deploy` para que el código nuevo reemplace al que está
publicado ahora (viejo, sin el rework de Compartir ni la cartera real). Dominio propio:
pendiente, sigue en `workers.dev`.

## Roadmap

- Temporario/turismo: calendario, tarifas, reservas + pago online.
- IA: sugerencia de precio + redacción de avisos.
- Publicación a portales externos; permisos finos por rol de agente.
- Dominio propio + (opcional) login con Google propio.

## Estado (2026-09-04)

**Fork a repo standalone (`Tms-mrl/TMS-PLACE`), cuenta de Cloudflare propia.** Se sacó
de `SuboAcaTomy/Places/` del monorepo `Coopenplace` (compartido con un compañero que
mantiene su propia cuenta de Cloudflare) a este repo dedicado. Se sacó el split
white-label (`[env.elmuelle]`) — acá es un solo tenant — y el SSO de CoopenAuth
(`AUTH_URL`), que dependía de la cuenta del compañero. El Worker/D1/R2 de
`wrangler.toml` **no son nuevos**: son de un deploy standalone anterior de esta misma
app bajo esta cuenta (`elmuelle.tomyredrebell.workers.dev`, sigue vivo) — se
reusan en vez de provisionar de cero.

Se trajeron dos piezas de trabajo hechas sobre el código del monorepo:

1. **Compartir del Inventario rehecho** (migración `0017`): el botón "Compartir" de
   cada fila pasó de un desplegable de 4 opciones a un botón directo a WhatsApp
   (`wa.me/?text=`, sin número → selector de contacto) con el mensaje que la agencia
   escribe en Configuración + el link externo de la propiedad (`properties.external_url`,
   nuevo). Selección múltiple: "Compartir por WhatsApp" en la barra de acciones masivas
   manda varios links en un solo mensaje.
2. **Importador de la cartera real de El Muelle** (`scripts/import-elmuelle.mjs`,
   migración `0018`): scrapea las ~251 propiedades publicadas en
   `elmuellepropiedades.com.ar` (BuscadorProp, sin export/API propios) y las carga
   idempotentemente por `external_url`. `db/seed/elmuelle-branches-real.sql` tiene las 3
   sucursales reales (La Lucila del Mar / San Bernardo / Aguas Verdes). Verificado
   251/251 fichas bajadas sin fallos, tipo y sucursal 100% resueltos, 2.214 fotos.
   **Corrido contra D1/R2 local; falta correrlo contra `coopen-places-db`/`coopen-places-media`
   reales** (primero hay que ver en qué migración está esa D1 — es la del deploy standalone
   viejo, no necesariamente al día — y migrarla antes de cargar, ver §Provisión) y deployar.

## Estado (2026-08-20 b)

**v0.38 — el Inventario dejó de ser una planilla: ahora es un listado de avisos con la
forma del panel que la inmobiliaria ya sabe usar.** Pedido de Charly: El Muelle venía de
**BuscadorProp** (captura con **1000 propiedades** cargadas) y la transición se hace más
fácil si nuestra pantalla se le parece. Se copió el **formato**, no la funcionalidad que
no tenemos.

**Qué cambió, de arriba abajo:**
- **Franja de KPIs** (en venta / en alquiler / temporario / sin publicar + cartera y
  publicadas). Cada uno es un **filtro de un click** y deja **sólo** ese filtro puesto.
  Cuenta sobre lo **no archivado**, que es lo que la lista muestra por defecto: sumar las
  archivadas daría un total que no coincide con nada de la pantalla.
- **Los 7 filtros se plegaron** detrás de "Más filtros", con un **badge** de cuántos hay
  puestos. Afuera quedan sólo la búsqueda y "Ver archivadas".
- **Barra de acciones** con seleccionar-todo, orden y **paginado de a 50**.
- **La fila**: miniatura con contador de fotos · dirección + `#id` · título grande ·
  **barra de completitud** · chips (tipo, estado, sin publicar, ambientes/baños/personas/
  m², visitas) · "Últ. modificación" · precio con su operación · y las acciones en
  **3 botones** (Editar · Más acciones ▾ · Compartir ▾) en vez de los 8 íconos sueltos.
  Las filas **sin publicar y archivadas van teñidas**, como en el panel viejo.
- **La barra de completitud es real**, no decorativa: `lib/completeness.ts` chequea 8
  cosas (fotos ≥ 3, precio, ciudad, dirección, punto en el mapa, descripción ≥ 120,
  2 de 3 medidas, 3 comodidades) y el tooltip **dice cuáles faltan**. Todos los ítems
  pesan igual a propósito, para poder explicar el número ("te faltan 2 de 8").

**Simplificaciones que trajo el rediseño:**
- **Una sola fila para escritorio y celular** (la grilla se reacomoda por CSS). Se borró
  `PropertyMobileCard`, que duplicaba las mismas acciones.
- **`PropertyCard` era código muerto**: era el home del *propietario particular*, rol
  **eliminado en v0.29**, y no la importaba nadie. Con ella se fueron `SendToClientButton`
  y `SaleActions` del panel.
- **78 líneas de CSS muerto** (`.sheet-tbl`, `.mcard*`, `.prop-card*`, `.status-chip`…),
  borradas contra un barrido de las clases realmente usadas en los `.tsx`, no a ojo.
- `properties-panel.tsx` pasó de **664 a ~440 líneas**; la fila vive en
  `components/property-row.tsx` (soft cap de 500 del manual raíz).

**Lo que NO se copió, a propósito:** "Destacar", "Muestra rebaja de precios" e "Imprimir"
no existen en Places — dibujar un control que no hace nada es peor que no tenerlo. El
bloque de precios muestra **una** operación (nuestro modelo tiene una por propiedad), no
las tres con guiones.

**🔴 Gotcha nuevo (y mi primer diagnóstico estaba MAL):** al abrir "Más acciones" el menú
**se veía cortado** justo en el borde de la fila. Lo atribuí a `overflow: hidden` en
`.plist` y lo saqué… y **la mutación lo desmintió**: reponer el `overflow` no rompe nada.
La causa real es el **orden de apilado** — las filas de abajo van después en el DOM y
pintan su fondo **encima** del popover; que sea `position: absolute` no alcanza contra
hermanos que también pintan. Lo arregla `.prow:has(.rbtn.is-open) { position: relative;
z-index: 2 }`. Ojo con el indicador: **el recorte por overflow es de pintado, no de
layout**, así que medir el `getBoundingClientRect` del popover **no detecta nada** — hay
que hacer `elementFromPoint` sobre el último ítem. También se cerró el gotcha global del
manual: **`[hidden] { display: none !important; }`** — sin esa línea `.filters
{ display: flex }` le ganaba al atributo y los filtros "plegados" se veían igual.

**Cartera grande (lo que el cliente trae):** `/api/properties/mine` sumó `updated_at`,
subió el tope de **200 → 1000** y ahora devuelve **`capped`**, con el que el panel **avisa
en pantalla** que hay más de las que trajo — antes truncaba en silencio y el total mentía.
Medido con **1028 propiedades sembradas**: panel usable en **930 ms**, respuesta de
**644 KB**, **33 ms por tecla** en la búsqueda (igual que con 128: el costo es pintar 50
filas, no filtrar) y el paginado cerrando en `951-1000 de 1000`. ⚠️ **Sigue siendo
paginado y filtrado del lado del cliente**: pasadas las 1000 hay que llevar filtros y
paginado al server.

**Seguridad de la selección:** con paginado, "Todas" marcando las 1000 mientras ves 50 es
una trampa (la barra masiva tiene **Eliminar**). Ahora **marca la página** —el label dice
"Todas (esta página)"— y la barra masiva ofrece el link explícito *"Seleccionar las N que
coinciden"*.

Detalles del manual §6: **cero emoji como iconografía** en el listado (pasaron a SVG de
lucide, con el nombre del dato en `title` + `.sr` para lectores de pantalla — de paso se
fue el "1 baños"), radios concéntricos, `tabular-nums` en todo número, outline negro puro
en las fotos, `text-wrap: balance` en los títulos, `scale(.96)` al apretar y entrada
escalonada cortada a las 12 primeras filas.

Verificado contra `wrangler dev` + D1 local: typecheck y build limpios, **1920 / 1440 /
390 sin errores de consola**, barrido de **las 11 pestañas** del panel tras borrar el CSS
(ninguna se rompió), y **cuatro comprobaciones por mutación** (completitud 50→63 %,
`[hidden]`, el z-index del menú, y "Todas" 50→1000). ⚠️ Desborde de 2 px a 390 en "Nueva
propiedad": **preexistente**, no se tocó. ⚠️ Visto de paso y **no arreglado**: Contratos y
otras pestañas siguen usando emoji como ícono (§6).

## Estado (2026-08-20)

**v0.37 — la vuelta del diseñador: tipos de propiedad, comodidades de costa y el filtro
de fechas por almanaque.** El diseñador (Tomy) trabajó sobre **una copia** y la devolvió
en `Clientes/Update/`. ⚠️ Esa copia salió del commit `02f2e825` (**2026-08-02, 18 commits
atrás**) y venía con el SSO de CoopenAuth arrancado, `wrangler.toml` apuntando a **su**
cuenta de Cloudflare / su D1 / su OAuth client, y sin el bloque `[env.elmuelle]`: copiarla
encima habría **borrado dos semanas de trabajo y roto El Muelle**. Se integró **a mano
sólo lo que era mejora** (6 archivos, +143/-11), descartando toda la adaptación a su
entorno. Lo que entró:
- **Tipos de propiedad** (`PROPERTY_KINDS`): el "Tipo" pasó de input libre a desplegable
  con 8 opciones (Casas/Chalet, Duplex/Triplex, Departamento, PH, Lotes, Locales, Cabañas,
  Apart) **+ "Agregar tipo nuevo…"**. La columna `kind` **sigue siendo texto libre a
  propósito** (sin CHECK ni enum): un valor que no esté en la lista —dato viejo o
  importado de Argenprop— se agrega como opción extra en vez de perderse.
- **5 comodidades** que pedía la operación de costa: gas envasado (a cargo del inquilino),
  TV por DirecTV prepago, heladera/freezer, microondas, ventilador. Van en las **dos**
  listas (`client/lib/amenities.ts` y `worker/lib/amenities.ts`), que son espejo.
- **Filtro de fechas por almanaque** (`DateRangePicker`): los dos `<input type=date>` del
  Inventario pasaron a un popover clickeable. Se **corrigió** respecto de la entrega para
  que el orden no importe (clickear 20 y después 10 da 10→20), igual que el calendario de
  reservas — son dos almanaques en la misma app y el gesto tiene que ser el mismo.
- **⚠️ Cambio de comportamiento (decisión de Charly, 2026-08-20):** buscar por fechas
  **ya no filtra por "Disponible desde/hasta"**. Ese campo es la temporada habitual del
  anuncio, no un bloqueo: ahora sólo se excluye la propiedad que tenga una **reserva
  solapada**. Efecto medido: una casa con temporada Dic→Mar buscada en octubre pasó de
  no aparecer (7 de 8) a aparecer (8 de 8).
- Y como el filtro ya saca del listado a lo reservado en el rango, **el chip de Estado
  ahora dice "Disponible"** cuando hay fechas activas: mostrar "Reservada" por una reserva
  de otro mes confundía. La entrega traía acá dos ramas (`alquilada`/`reservada`)
  **inalcanzables** —el filtro de arriba ya las había descartado—; se simplificó.

Verificado contra `wrangler dev` + D1 local: typecheck y build limpios, render a
**1920 / 1440 / 390 sin errores de consola**, y los tres comportamientos **comprobados por
mutación** (romper cada arreglo a propósito y ver fallar el chequeo que corresponde).
⚠️ Desborde de 2 px a 390 en el botón "Nueva propiedad" del `.panel-head`: **preexistente**,
no se tocó. **Falta deployar** (los dos deploys: Coopen y El Muelle).

## Estado (2026-08-07)

**v0.36 — el landing público: prueba social real, CTAs con peso, filtros usables en el
cel y aire entre secciones.** Cuatro sugerencias de mejora que trajo Charly, las cuatro
sobre la home (aplica a los dos deploys, mismo código):
- **Prueba social (`testimonials`, migración `0016`).** "Detrás de cada casa, hay
  personas" era una afirmación sin una sola prueba. Ahora la inmobiliaria carga sus
  testimonios desde **Configuración** y salen en la home. **No se generan de ejemplo ni se
  dejan de placeholder**: sin testimonios publicados la sección **no existe**. Un
  testimonio inventado es exactamente lo contrario de la confianza que la sección busca —
  y las **fotos reales** (equipo, local) las tiene que aportar el cliente: hoy
  `site/hero.jpg`, `site/interior.jpg` y `site/keys.jpg` en R2 son **de stock** y se
  reemplazan subiendo esas mismas keys. La lectura del landing **falla blando**: si la
  tabla no está en ESA base (cada white-label se migra por separado), la home sale sin la
  sección en vez de tirar 500 — importante con N deploys que se migran de a uno.
- **CTAs.** "Ver todas" era un link de texto perdido al lado de un h2 de 32 px; ahora es
  una pastilla con borde, sombra y flecha que se desplaza al hover.
- **Filtros en mobile.** Los 6 campos en fila daban inputs de ~80 px imposibles de tocar.
  Arriba queda lo que casi todos usan (operación + ciudad + Buscar, apilado y a lo ancho
  en el cel) y el resto vive en un **`<details>`** que **se abre solo** si hay un filtro
  aplicado y dice cuál. Es HTML puro: anda sin JS, y un input adentro de un `<details>`
  cerrado **igual se envía**, así que plegarlo nunca pierde un filtro.
- **Aire.** Ritmo vertical 44 → 72 px entre secciones (52 en mobile) y más padding en las
  tarjetas: con tantos datos por propiedad, pegadas se leían como una planilla.
De paso se fueron **todos los emojis usados como ícono** del landing (🔑 🏡 🤝 🌴 📍 y la
flecha →) → SVG inline con `currentColor` (§6). Ojo con el de "Cerca de mí": su script
pisa el `textContent` del botón, así que un SVG adentro se perdería — ese botón queda a
texto seco a propósito.
Verificado a 1920 / 1440 / 390: **0 emojis en pantalla**, 0 overflow horizontal, **0
controles de formulario por debajo de 40 px** de alto, el panel de filtros se abre solo con
`?max=` conservando el valor, y la sección de testimonios aparece/desaparece según cuántos
haya publicados (0→0, 1→1, 3→3). E2E de la API con sus guardas. Sin errores de consola.
**Migración `0016` aplicada a las dos remotas** (autorizada por Charly; aditiva, verificado
que El Muelle quedó con sus 10 propiedades / 8 contactos / 5 reservas intactos) + deploy +
smoke en los dos dominios.

**v0.35.2 — la card del marketplace partía los datos a la mitad, y era culpa de los
emojis.** Charly lo vio en la grilla: dos cards mostraban `🚿 2 · 🛏 1` en una línea y la
del medio `🚿 ⏎ 2 · ⏎ 🛏 ⏎ 1`, un dato por renglón. **La causa era la tira de comodidades**:
los datos se armaban como **un solo texto** (`🛏 2 · 🚿 2 · …`) y al lado se pegaban hasta
5 emojis sueltos; el navegador corta ese texto por cualquier espacio, así que con 5 emojis
la línea reventaba **entre el ícono y su número**. Se arregló de raíz, siguiendo §6 del
manual raíz (*emoji como iconografía está prohibido*):
- **Cada dato es ahora un chip indivisible** (`white-space:nowrap`) con **SVG inline** de
  trazo `currentColor` en vez de emoji. El corte de línea cae **entre** datos, nunca
  adentro de uno. El emoji además lo dibuja cada SO a su manera y no hereda el color.
- **Las comodidades pasaron de 5 emojis a una línea de texto** recortada
  (`WiFi · Pileta · Cochera +2`, con `text-overflow:ellipsis`): un 🛡️ sin etiqueta no le
  dice "seguridad" a nadie, y así no puede volver a empujar el layout.
- **Card más compacta** (lo otro que se pidió): foto 4/3 → **16/10**, precio 22 → 19 px,
  paddings más ajustados, columna mínima 280 → 250 px y **título clampeado a 2 líneas**,
  para que un título largo no deje una card del doble de alto que su vecina. En mobile se
  esconde *baños* (a 155 px no entran 4 datos) y el precio baja a 16 px.
- **El período del precio va aparte** (`<span class="per">`, 70 % y muted): es metadato
  del precio, no parte del número. Pegado al mismo cuerpo, "ARS 340.000 /noche" no entraba
  en una columna de celular y se partía; ahora entra, y en el caso extremo (7 cifras +
  `/semana`) el corte cae **entre** el número y el período — el número nunca se parte.
- Detalles: `tabular-nums` en precios y datos (las cifras alinean entre cards),
  `text-wrap:pretty` en el título, outline sutil en la foto, y las etiquetas de cada dato
  quedan para lectores de pantalla (`.sr`) además del `title`.
Medido con Playwright a 1920 / 1440 / 390: **0 datos partidos**, 0 overflow horizontal, 0
precios en dos renglones y todas las cards de la fila con el **mismo alto** (351 px en
desktop, 278 px en mobile) — antes variaban según cuántas comodidades tuviera cada una.
⚠️ Queda pendiente (fuera de este pedido): la **ficha** y las cards de categoría del
landing siguen usando emoji como ícono, y el sitio público sigue en **Inter**, las dos
cosas que §6 marca como "lo que venía saliendo por reflejo".

**v0.35.1 — "Ver coincidencias" no devolvía NADA para ningún interesado: una reserva
futura borraba la propiedad del cruce para siempre.** Charly lo reportó desde El Muelle
("nunca devuelve nada a pesar de tener varias propiedades") y era literal: los 5
interesados de su cartera daban cero **teniendo la casa exacta cargada**. Tres causas
encadenadas, ninguna visible leyendo la pantalla:
- 🔴 **El estado ya no es un dato, es un cálculo.** El cruce filtraba
  `status = 'disponible'`, pero desde la `0014` el estado sale del **calendario** y una
  reserva **futura** ya deja la propiedad en `reservada`. En una inmobiliaria de costa
  eso es letal: la casa de Mar de las Pampas de Familia Aguirre (4 personas, ARS 142.000,
  perfecta) tenía vendida la quincena del 2 al 16 de enero de 2027 → desaparecía del
  cruce. **Reservada no es "no se la ofrezcas": son fechas.** Ahora solo se descarta lo
  que de verdad no se puede ofrecer (**vendida** o **archivada** — la archivada ni
  siquiera se excluía) y cada fila viaja con su estado y su **próxima ocupación**
  (`ocupada 02/01–16/01`), que es el dato con el que la persona decide.
- 🔴 **Las prefs se leían con claves que nadie escribe.** El form del CRM guardaba
  `max_price`/`min_rooms`; las carteras cargadas por seed (El Muelle) tienen
  `maxPrice`/`rooms`/`capacity`/`currency`. El matcher leía solo las primeras, así que el
  presupuesto y las personas **se ignoraban en silencio** y tampoco se mostraban: por eso
  la ficha decía "Busca: temporario · Mar de las Pampas" y nada más. Ahora `readPrefs`
  (worker y SPA) acepta las dos escrituras — **sin migrar el JSON en producción**.
- **Faltaba el criterio principal del temporario.** El form no tenía dónde cargar
  **personas**, que es *lo* que se pregunta en la costa; se sumó (junto con la **moneda**
  del presupuesto). La capacidad se cruza como **mínimo** —para 4, una de 6 sirve; una de
  2, no— al revés que el filtro del inventario, que es exacto: acá la pregunta es "¿qué le
  puedo ofrecer?", allá es "¿cuáles son las de 4?".
El precio ahora se compara **dentro de la misma moneda** (150.000 USD no es 150.000 ARS,
misma regla que el resto del repo) y el modal muestra arriba **los criterios que usó**:
un cruce vacío tiene que decir si falta cartera o si las prefs no son las que uno cree.
Verificado contra `wrangler dev` + D1 local con el escenario de El Muelle calcado (casa
con reserva futura, monoambiente, casa en USD, fuera de presupuesto, archivada, vendida y
una libre): devuelve **las 2 correctas**, la libre primero, y la reservada con sus fechas;
las prefs viejas en `snake_case` siguen andando. Sin errores de consola a 1920 y 390.

**v0.35 — el filtro de personas era un mínimo disfrazado, y el admin ya puede dar acceso
a una cuenta sin tocar la base.** Dos pedidos de Charly desde El Muelle:
- **Filtro "Personas" = capacidad EXACTA.** Era `capacity >= N`, así que pedir 1 persona
  devolvía también las de 2, 3, 4 y más: el filtro no filtraba nada (con `N=1` pasa todo
  el inventario que tenga capacidad cargada). Ahora 4 muestra **solo** las de 4. Se
  descartaron el "hasta N" y el rango desde–hasta: lo que se quiere ver es *esa* casa.
  Ojo si algún día se agrega el filtro al **buscador público**, que hoy no lo tiene:
  ahí el criterio del turista sí es "que entremos N", o sea mínimo, no exacto.
- **Cuentas de la inmobiliaria en la Consola de Coopen** (`/app/admin`). Cada
  inmobiliaria despliega **todas las cuentas del deploy** —no solo su equipo— porque el
  caso a resolver es el de alguien que entró con su Google y **quedó sin panel**: existe
  en `users` pero sin fila en `agency_members`, y hasta ahora eso se arreglaba tocando la
  base a mano. Una fila = una cuenta, con un `<select>` de acceso (Sin acceso / Agente /
  Manager / **Admin**) que promueve o saca en un solo gesto. **"Admin" es admin de ESA
  inmobiliaria**: el super-admin de Coopen sigue siendo la allowlist `SUPER_ADMIN_SUBS`
  (una var, no una tabla) y desde esta pantalla no se puede escalar a eso. El **dueño**
  viene con el select deshabilitado: es la raíz de la agencia y degradarlo la deja sin
  quien la administre. Endpoints nuevos: `GET /api/admin/agencies/:id/users`,
  `POST …/members` (upsert de rol) y `DELETE …/members/:userId`.
Sin migración (`agency_members` ya existía). Verificado contra `wrangler dev` + D1 local:
E2E de los 3 endpoints con sus guardas (rol inválido, usuario/agencia inexistente, quitar
al dueño, quitar a quien no es del equipo) y **aislamiento**: promover y sacar en la
agencia 1 no tocó la membresía ni el link de acceso de la misma cuenta en la agencia 2.
Filtro medido sobre un inventario sembrado 1/2/2/2/4/6/8: `1→1`, `2→3`, `4→1`, `5→0`.
Render sin errores de consola a 1920 / 1440 / 390.

## Estado (2026-08-04)

**v0.34.2 — el sitio público abría lento porque encadenaba viajes a D1 (2–3× más rápido).**
Cada página del SSR resolvía en **serie** lo que no depende entre sí: la ficha eran
`propiedad → fotos → whatsapp → sesión → marca → logo`, seis idas y vueltas a D1 una
atrás de la otra. Ahora van en `Promise.all` (solo la propiedad queda antes: el resto
cuelga de su id) y **la marca se cachea en memoria del isolate** (`getBrand`, un `batch`
en vez de dos queries, TTL 60 s, invalidada al guardar). Medido en prod (mediana de 6–8
muestras): **home 0,70 → 0,23 s · buscar 0,54 → 0,21 s · ficha 0,86 → 0,39 s**. Además,
las **fotos de R2 se cachean en el edge** (Cache API en `/media/*`: son inmutables porque
editar sube una key nueva) → 0,30 → **0,06 s** a partir del segundo visitante; la foto
grande de la ficha pide prioridad (`fetchpriority`) y las miniaturas van en diferido.
⚠️ **Un `defer` mal puesto rompe el mapa**: ver el gotcha nuevo abajo — se detectó y
arregló en la misma sesión, pero estuvo unos minutos en producción.

**v0.34.1 — el calendario de una propiedad abre instantáneo (no se pedía lo que ya
estaba en memoria).** Abrir el modal disparaba dos fetch (`/bookings` + `/clients`) y
hasta que volvían mostraba el mes vacío y el picker sin contactos — segundos de espera
en cada apertura. **La info ya estaba**: `/api/properties/mine` embebe las reservas de
cada propiedad. Se le sumaron al JSON embebido el `id`, el `client_id` y el **nombre del
contacto** (resuelto scopeado a la agencia de la propiedad), y el modal **siembra su
estado con eso** (`seedBookings`); el fetch queda como refresh. La cartera de contactos
pasó a un cache de módulo (`lib/clients-cache.ts`) que el panel **precarga al montar** y
que las altas nuevas actualizan sin re-pedir la lista. Medido con la API frenada 4 s a
propósito: la reserva se ve a los **29 ms** y el desplegable ya trae los contactos.

**v0.34 — el calendario de reservas se usa tocándolo, y la reserva es de un contacto
del CRM.** Tres fricciones del panel de reservas (pedido de El Muelle, aplica a todos los
deploys):
- **Elegir el rango tocando el calendario**: el 1er día abre la selección y el 2º la
  cierra; **no importa el orden** — la fecha menor queda como *desde* y la mayor como
  *hasta*. Un día ya ocupado no se selecciona: enfoca esa reserva (así se ve de quién es).
  Los inputs `date` quedan para fechas lejanas. La selección se pinta translúcida y con
  anillo **a propósito**: el color sólido ya significa "reservado/alquilado" y confundirlas
  hacía ilegible la grilla.
- **Fechas en DD/MM/AAAA** en la lista de reservas cargadas (la base sigue guardando ISO;
  el ISO es formato de máquina, no de pantalla).
- **El "huésped / referencia" a mano se reemplazó por el contacto del CRM**
  (migración `0015`: `bookings.client_id`). El texto libre no se podía cruzar después con
  nada; ahora se elige de la cartera o se carga uno nuevo sin salir del modal. **Confirmar
  como alquilada abre un paso que pide quién alquila** (obligatorio: un alquiler sin
  inquilino no sirve para operar). `guest_name` queda solo como fallback de las filas
  viejas. El `client_id` se valida con `clientInAgency` en POST y PATCH, y el JOIN de
  display va scopeado a la agencia.
El `CalendarModal` salió de `properties-panel.tsx` a **`calendar-modal.tsx`** (el panel ya
pasaba las 500 LOC). Verificado con Playwright contra `wrangler dev` + D1 local: E2E del
flujo completo, aislamiento cross-tenant (contacto de otra agencia → 400) y solapamiento,
sin errores de consola. **⚠️ Falta migrar y deployar (gated, §6 del root).**

## Estado (2026-08-02)

**v0.33.1 — la ficha del propietario mostraba 0 ingresos.** Los ingresos se atribuían solo
por `contracts.client_id`, o sea al **inquilino/comprador que firma**. Pero el dueño no
firma el contrato de su inquilino: su renta es justamente ese contrato, así que su ficha
salía en cero teniendo propiedades alquiladas. Ahora los contratos (y sus ingresos) se
resuelven por **dos vías**: `client_id = él` **o** `property_id` de una propiedad suya
(vía `mandates`). Cada contrato viene con `role` (`parte` | `propietario`) y la UI marca
con un chip los que corren sobre su propiedad. Verificado: Estudio Lombardi pasó de 0 a
ARS 3.900.000 (`856525f0`).

**v0.33 — ficha de contacto + el vínculo propietario↔propiedad que faltaba.** La pestaña
Clientes era una lista muerta: click y no pasaba nada. La causa de fondo no era de UI —
**`mandates` (la tabla que conecta un contacto con las propiedades que dejó en
consignación) existía en el esquema pero no tenía endpoints, UI ni datos**, así que no
había nada que mostrar.
- **El vínculo**: el alta/edición de propiedad suma un select **"Propietario"** (contactos
  tipo propietario). Se guarda en `mandates`; no es una columna de `properties`, así que en
  el PATCH se maneja aparte y **no cuenta para el "Nada para actualizar"**. Validado con
  `clientInAgency` (hardening: un `client_id` de otra agencia se rechaza). En el alta se
  asigna con un PATCH posterior, porque recién ahí existe el id.
- **La ficha** (`GET /api/clients/:id` + `client-detail.tsx`): datos, preferencias, notas,
  **propiedades en consignación** (con comisión y exclusividad), **operaciones** del
  pipeline, **contratos** con lo cobrado, e **ingresos/gastos derivados** — no cuelgan del
  contacto sino de sus propiedades y contratos. Todo **por moneda**, nunca sumadas, igual
  criterio que el P&L. Vista completa con "← Volver a contactos".
- `/api/properties/mine` devuelve `owner_client_id`/`owner_client_name`.
Verificado en prod incluido el aislamiento (id ajeno → 404, sin cookie → 401). El Muelle:
6 encargos cargados (`fe6eee4f`).

**v0.32 — dos fricciones de uso.** (1) **Click en una reserva de la lista → el calendario
salta a su mes** y la resalta (anillo en los días y borde en la fila). Antes, una reserva de
otro mes no se veía en la grilla y había que buscarla con las flechas. Solo la franja de
fechas es clickeable, para no pisar los botones Confirmar/Quitar; accesible por teclado.
(2) **Entrar a `/app` sin sesión manda DIRECTO al proveedor**: la pantalla intermedia con un
único botón era un click de más. Guarda un flag en `sessionStorage` para que, si el usuario
cancela en Google y vuelve, se le muestre la pantalla en vez de reenviarlo — si no, es un
loop del que no puede salir; el flag se limpia al entrar bien y al desloguearse. El redirect
espera a que resuelva `/api/auth/coopen-config`: sin eso mandaría siempre al login de Google
y en un white-label eso es un 500. Desplegado (`db584e0d`).

**v0.31 — logo de marca en vez del nombre en texto.** El header/footer del SSR y la topbar
del panel muestran el **logo de la inmobiliaria** si lo cargó, y caen al nombre en texto si
no (nunca un `<img>` roto). Se reusa `agencies.logo_key`, que ya existía para esto — sin
migración, mismo criterio que `resolveSiteWhatsapp` (1 deploy = 1 agencia). Nuevos
`getBrandLogoKey()` y `brandMark()` en `lib/layout.ts`; `/api/site` devuelve `logoUrl` ya
armada para el cliente. El CSS acota por **altura** (48px SSR / 46px SPA) y deja el ancho
al aspect-ratio, así entra cualquier logo sin deformarse. El Muelle: `site/logo.png` en su
R2 (`8e74f0e8`).

**v0.30 — sumar al equipo por email (entrar como inmobiliaria con la cuenta del
ecosistema).** Faltaba el camino: "Equipo" solo sabía crear usuarios sintéticos con link de
acceso, así que una cuenta de CoopenAuth **no tenía forma de volverse miembro** de una
agencia — había que tocar la base a mano. Ahora `POST /api/agencies/members` acepta
`email`: crea la fila como `auth_sub='invite:<email>'` con la membresía puesta, y en el
primer login por SSO **`resolveCoopenUser` la adopta** (actualiza el `auth_sub`) en vez de
crear un usuario suelto sin panel. Seguro porque el email lo afirma el IdP; solo se adoptan
filas `invite:` a propósito. La UI de Equipo suma el campo Email (opcional) y el rol Admin.
Sin email sigue el flujo viejo de link de acceso. Desplegado en El Muelle (`06ff8fa5`) y
verificado E2E.

**v0.29 — se elimina el propietario particular: la app es solo para inmobiliarias.**
Decisión de producto de Charly. El backend ya lo bloqueaba (alta e import exigen agencia)
y la SPA ya no ofrecía publicar; lo que faltaba era la **vitrina pública**, que seguía
invitando al visitante a publicar solo. El CTA del hero y la 3ª card pasaron de "Publicá
tu propiedad" a **captación**: "¿Tenés una propiedad?" / "Publicar con nosotros" → WhatsApp
de la inmobiliaria (`resolveSiteWhatsapp`, se esconde si no cargó el número). Reescritos el
subtítulo, la sección "personas", los 3 pasos y la meta description. En `coopen-places-db`
las 2 propiedades `particular` se **despublicaron** (siguen en la base). Sin migración: el
scope `particular` queda como compatibilidad de lectura. Aplica a **los dos deploys**
(mismo código). Desplegado en El Muelle (`2deba2bb`).

**v0.28.1 — fix del logout y del botón de login (deuda del v0.28).** Al sumar el SSO como
cuarto camino no se actualizó el logout: cerraba las cookies locales pero no la del SSO,
así que `resolveUser` volvía a loguear al usuario y **el botón de cerrar sesión no hacía
nada**. Ahora `POST /api/auth/logout` cierra los tres caminos (revocación
server-to-server en el IdP + `coopen_session` con su `Domain`). Además el botón de login
elegía siempre Google, que en un white-label sin `GOOGLE_CLIENT_ID` devuelve 500: ahora
consulta `/api/auth/coopen-config` y manda al camino disponible. Desplegado en El Muelle
(`fa9ba787`) y verificado: el logout devuelve las 3 cookies con `Max-Age=0`.

**v0.28 — de vuelta en el monorepo, con SSO restaurado y white-label.** El código que
estuvo fuera (v0.27, con `0011`–`0014`) volvió a `3-Apps/Internas/Places` y se le sumó el **SSO de
CoopenAuth como cuarto camino de sesión** (`resolveCoopenUser`, modelo C, opt-in por la
var `AUTH_URL`) + endpoints `/api/auth/coopen-config` y `/api/auth/coopen`. El login
propio y el link de agencia **quedaron intactos**: un deploy white-label que no setea
`AUTH_URL` sigue funcionando aislado del ecosistema, sin tocar código. Primer cliente
white-label declarado: **El Muelle** (`[env.elmuelle]`). Typecheck + build en verde;
**falta deployar y migrar la remota** (gated).

**v0.27 (afuera del monorepo)** — SSR público (landing/búsqueda/ficha,
mobile-first) + SPA de gestión (`/app`) + D1 + R2 + Google OAuth propio + sesión
local + gate de trial + Admin de Coopen (API).
Workspace de agencia (KPIs, inventario tipo planilla, CRM, sucursales, equipo, mapa),
pipeline, contratos/recibos, gastos+P&L, favoritos/alertas (dormante sin
`INTERNAL_API_SECRET`), analítica de visitas, import Argenprop, compartir en redes,
reservas, geolocalización, hardening multi-tenant. Falta: mensajería completa,
permisos finos de agente, IA, UI del Admin de Coopen.
