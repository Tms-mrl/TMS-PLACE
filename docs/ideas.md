# Ideas para revisar más adelante

Notas sueltas, no son features aprobadas todavía. Se revisan cuando corresponda.

## Entrada a "Gestión" + paywall (2026-07-26)

Flujo pensado por el usuario, a definir en detalle antes de implementar:

- El **landing/marketplace público** (búsqueda de propiedades) sigue siendo la
  puerta de entrada principal para cualquier visitante (usuario "normal").
- Al loguearse (Google), si la cuenta corresponde a un admin/agencia, hoy ya se
  puede entrar al panel de gestión vía `/app` (esto ya funciona, ver `Dashboard`
  en `agency-workspace.tsx` + `getUserAgency`).
- Idea nueva: una vez logueado, mostrar un botón **"Gestión"** al lado de
  "Buscar" en la barra de navegación (hoy esa nav vive en `pageShell` /
  `layout.ts`, es SSR y no sabe si hay sesión — hay que resolver cómo mostrar
  ese botón condicionalmente sin romper el SSR indexable, o resolverlo con JS
  progresivo del lado cliente).
- Si el usuario entra a "Gestión" y **no tiene un plan pago** (o no tiene
  inmobiliaria todavía), forzar un flujo de alta/pago antes de dejarlo entrar
  al panel — hoy el gate de trial existe (`lib/subscription.ts`,
  `getSubStatus`) pero es binario (bloqueado si venció el trial); esto sería
  un paywall más temprano en el funnel, no solo al vencer.
- Pendiente pensar: ¿el paywall es "creá tu inmobiliaria y arrancá el trial de
  30 días" (ya existe ese flujo) o algo más, tipo planes/pricing visibles antes
  de crear la cuenta? Y cómo se cobra (sigue siendo manual vía Admin, o se
  suma checkout online).

**Parcial (2026-08-01):** la parte de "el botón condicional según sesión sin
romper el SSR indexable" ya está resuelta — `pageShell` (`layout.ts`) resuelve
`resolveUser` server-side en las 4 páginas públicas y el link "Ingresar" pasa
a decir "Ir a mi panel" cuando hay sesión (mismo destino `/app`, sin JS
progresivo). **Sigue sin resolver** el paywall en sí (forzar alta/pago antes
de entrar a Gestión) — eso no se tocó.

No tocar el paywall hasta que se retome explícitamente.

## Reportes de Finanzas: desglose mensual/diario — ✅ resuelto (2026-07-30)

Implementado en el chat dedicado, con una vuelta de feedback sobre la primera
versión (ver abajo). `FinancePanel` tiene 2 sub-tabs: **Resumen** y **Gastos**
(el alta/edición/borrado que ya andaba, sin tocar).

Resumen usa el mismo modelo de estados que la referencia que trajo el usuario
(otra app propia, tipo taller/POS): un `<Select>` de período con 3 opciones
elegibles — **Hoy (Detalle)** / **Este Mes (Diario)** / **Historial
(Mensual)** — más 2 que solo aparecen como indicador de navegación cuando ya
estás adentro (**Día Específico** / **Mes Específico**, alcanzadas con "Ver
detalle" desde una fila de Mes/Historial; "Volver al Mes"/"Volver al
Historial" para salir). Sin selector de mes prev/next — para ver otro mes se
pasa por Historial. Acciones: CSV (global + por fila en Historial/Mes) e
Imprimir vía `window.print()` + `.print-sheet` (global + por fila en
Historial) — ninguna requiere jsPDF ni navegar de vista para generarse (fetch
on-demand). **Se sacó la pestaña Métricas** (gráficos) que se había armado en
la primera vuelta — el usuario pidió quitarla; junto con eso se borró el
endpoint `/api/expenses/summary/categories` que solo alimentaba esos
gráficos.

Backend: `GET /api/expenses/summary/period?by=month|day` y `/transactions` en
`expenses.ts`, scopeados con `scope()`. `expenses.method` (migración
`0012_expenses_method.sql`) para desglosar por método de pago. Quedó afuera a
propósito (no aplica al dominio): hora de corte configurable, cierres de
caja, reimprimir ticket, categorías dinámicas. Detalle completo en
`C:\Users\WinterOS\.claude\plans\curious-tumbling-gray.md` si hace falta
retomarlo.

<details>
<summary>Pedido original (2026-07-26)</summary>

Se va a trabajar en un chat aparte — dejar esto bien autocontenido, sin dar por
sabido el contexto de esta conversación.

**Estado actual (ya existe, funciona):** pestaña "Finanzas" del panel de
gestión (`src/client/components/finance-panel.tsx`, componente `FinancePanel`
+ `PnlSummary`), respaldada por `src/worker/routes/expenses.ts`.
- Ingresos = suma de `receipts.amount` de recibos **cobrados** (`paid_at IS
  NOT NULL`) de los contratos del tenant (join `receipts` → `contracts`).
- Gastos = suma de `expenses.amount` con `paid = 1` (tabla `expenses`,
  migración `db/migrations/0010_expenses.sql`: categorías reparación,
  limpieza, impuestos, servicios, expensas, mantenimiento, comisión, seguro,
  otro).
- Resultado = ingresos − gastos, **siempre separado por moneda** (nunca se
  suma ARS + USD — regla ya aplicada en `GET /api/expenses/summary`, no
  romper esto).
- Desglose por propiedad (no por fecha). Endpoint: `GET /api/expenses/summary`
  → `{ rows: [{property_id, title, currency, income, expense}], totals:
  [{currency, income, expense}] }`.
- Todo lo demás (alta/edición/borrado de gastos, filtro por propiedad) ya
  anda, no tocar esa parte salvo que haga falta.

**Lo que falta (el pedido):** un desglose **mes a mes / día a día**, no solo
el acumulado total que hay hoy. Ahora mismo si cargás 6 meses de datos, ves
todo sumado en un solo número — no hay forma de ver "cuánto entró/salió en
julio" vs "en agosto", ni una vista tipo libro diario de movimientos.

**Para implementar, hay que:**
1. En el backend (`expenses.ts`), agregar agrupación por período a
   `GET /api/expenses/summary` (o un endpoint nuevo, ej. `/api/expenses/summary?by=month`):
   - Ingresos: agrupar por `strftime('%Y-%m', r.paid_at)` (o por día,
     `date(r.paid_at)`, según la granularidad pedida).
   - Gastos: agrupar por `strftime('%Y-%m', e.incurred_on)` — ojo que
     `incurred_on` puede ser NULL (fecha opcional hoy); definir qué hacer con
     esos gastos sin fecha (¿excluir del desglose temporal? ¿usar
     `created_at` como fallback?).
   - Mantener la separación por moneda (no mezclar ARS/USD en la misma fila).
2. En el frontend (`finance-panel.tsx`), agregar una vista con selector de
   granularidad (mensual/diario) y probablemente un gráfico simple (ya hay un
   patrón de barras CSS puro en `stats-modal.tsx`, reusar ese estilo en vez de
   sumar una librería de charts).
3. Decidir el rango por defecto (¿últimos 12 meses? ¿todo el histórico?) y si
   hace falta paginar/limitar filas en el caso diario (puede ser mucho volumen
   si el negocio tiene muchos movimientos).
4. Mismo patrón multi-tenant que ya usa `expenses.ts` (`scope()` por agencia o
   propietario particular) — cualquier query nueva tiene que heredar ese
   scoping, no escribir SQL nuevo sin pasarlo por `scope()`.

</details>

## Backlog UI/UX + producto, post primer deploy en vivo (2026-07-29)

Feedback del usuario probando la app ya deployada (`https://coopen-places.tomyredrebell.workers.dev`).
Organizado por apartado para ir cerrando de a uno hasta que quede "perfecto".
Marcar cada punto con `[x]` cuando quede resuelto.

### 1. Panel de Finanzas — ✅ dado por completo (2026-08-01), 1 punto suelto
- [x] No hay forma de exportar un resumen a Excel/CSV — resuelto (2026-07-30),
  export CSV client-side en las vistas Mes/Día/Historial de la nueva pestaña
  Resumen.
- [x] No hay historial mes a mes — resuelto (2026-07-30), ver sección
  **"Reportes de Finanzas: desglose mensual/diario"** más arriba (ahora
  marcada ✅).
- [x] Filas duplicadas por moneda en Histórico/Mes + orden ARS/USD
  inconsistente entre paneles — resuelto (2026-07-31). El endpoint agrupa
  por período+moneda, y antes cada combinación se pintaba como fila propia
  (ej. "Julio 2026" repetido una vez por moneda). Ahora `HistorialView` y
  `MesView` (`finance-panel.tsx`) agrupan con `groupByPeriod` en una sola
  fila por período, con las monedas apiladas adentro de cada columna
  (clase `.pl-stack` en `styles.css`, ARS arriba). De paso, `KpiCards`
  (compartido por Resumen y Gastos) ordena los totales con `currencyRank`
  (ARS→USD) porque el backend no garantiza el orden de `GROUP BY`. Los
  montos que difieren entre pestañas (Gastos = histórico completo, Resumen
  = por defecto "Este Mes") son comportamiento esperado, no bug.
- [x] ~~"se siente muy básico para venderlo como gestión financiera"~~ — dado
  por resuelto por el usuario (2026-08-01), no se va a seguir puliendo por
  ahora.
- [ ] **Único punto que queda abierto:** revisar cómo sale la
  descarga/impresión del resumen mensual (`window.print()` +
  `.print-sheet`, botón Imprimir de Historial/Mes en `finance-panel.tsx`)
  — el usuario no pudo previsualizarlo todavía. Antes de tocar nada, probar
  cómo renderiza hoy y recién ahí decidir si hace falta mejorarlo.

### 2. Estética de botones e íconos (2026-07-29/30 — resuelto en casi todo)

Se armó un mini design-system propio en `src/client/components/ui/` (Tailwind +
Radix + `lucide-react` + `cva`, paleta madera traducida a variables HSL en
`styles.css`, botones tipo pastilla). Detalle completo del approach en
`C:\Users\WinterOS\.claude\plans\compiled-noodling-naur.md` si hace falta
retomarlo.

- [x] Emojis como íconos → `lucide-react` (+ `react-icons/si` solo para los
  logos de WhatsApp/Facebook/Instagram) en `share-button.tsx` y
  `properties-panel.tsx`, y en el resto de componentes migrados (ver abajo).
- [ ] **Pendiente, no se hizo todavía:** mostrar el label en texto (no solo
  ícono+tooltip) en pantallas grandes para los íconos de acción de la tabla de
  Inventario — hoy tienen `title` con tooltip nativo, pero siguen siendo
  ícono-solo. Bajo impacto ahora que son íconos reales (no emoji), pero la
  idea original de "texto visible en desktop" no se implementó.
- [x] Los `<select>` nativos de los 7 archivos (`agency-workspace.tsx`,
  `clients-panel.tsx`, `contracts-panel.tsx`, `deals-panel.tsx`,
  `finance-panel.tsx`, `properties-panel.tsx`, `property-form.tsx`) →
  componente `Select` propio (`components/ui/select.tsx`, Radix), con
  popup con animación y sin el estilo nativo del SO.
- [x] Botones de acción sin hover (`.link-btn`) → componente `Button`
  (`components/ui/button.tsx`, variantes ghost/outline/secondary/destructive)
  con hover/focus reales, forma pastilla preservada.
- [x] Tarjetas KPI del Resumen → grid más denso con `Card` + ícono + tipografía
  más chica (`agency-workspace.tsx`, función `Resumen`).

### 3. Navegación entre pestañas del panel sin cache — confirmado (2026-08-01)
- [x] **Confirmado en el código, no era percepción**: en
  `src/client/components/agency-workspace.tsx`, cada pestaña
  (Resumen / Propiedades / Mapa / Clientes / Operaciones / Contratos /
  Finanzas / Consultas / Sucursales / Equipo) se renderiza con
  `{tab === 'x' && <Componente/>}` — React desmonta el componente al cambiar
  de pestaña, así que al volver se pierde todo el estado y se vuelve a pedir
  todo a la API desde cero. Verificado el mismo patrón (`useEffect(() => {
  load() }, [])` que se dispara de nuevo en cada montaje) en
  `properties-panel.tsx` y `clients-panel.tsx`; el resto de los paneles del
  tab bar sigue la misma forma. Mismo patrón en `dashboard.tsx`
  (`NonAgencyHome`). En local se nota menos porque la latencia a D1/R2 local
  es baja, pero en producción (deploy real) el efecto va a ser mayor.
- [ ] Pedido: que al cambiar de pestaña se muestre de inmediato lo último que
  ya se había cargado (si existe) mientras se refresca en segundo plano —
  patrón "stale-while-revalidate", no pantalla en blanco + spinner cada vez.
  Implica alguna de estas (a decidir): mantener los datos en un estado que
  sobreviva al cambio de pestaña (subirlo de nivel a `AgencyWorkspace` en vez
  de adentro de cada panel hijo), mantener los componentes montados con
  `display:none` en vez de desmontarlos, o cachear por key la última
  respuesta de cada endpoint.

### 4. Modales de confirmación — ✅ resuelto (2026-07-30)
- [x] Reemplazado `confirm()` nativo (los 11 lugares: `admin-console.tsx`,
  `agency-workspace.tsx`, `clients-panel.tsx`, `contracts-panel.tsx`,
  `deals-panel.tsx`, `finance-panel.tsx`, `properties-panel.tsx` x4) por
  `useConfirm()` (`components/ui/use-confirm.tsx`), un `AlertDialog` propio
  (Radix) con la estética de la app.
- [x] No cierra clickeando afuera — es el comportamiento por diseño de
  `AlertDialog` de Radix (a diferencia de `Dialog`), no hizo falta forzar nada
  extra. Solo Cancelar/Confirmar (o Escape) lo cierran.

### 5. Pago online (Mercado Pago) — en pausa, decisión de negocio pendiente (2026-08-01)
- [ ] Hoy no hay ningún botón para que alguien pague desde la app — todo el
  cobro es manual y fuera de la app (`lib/subscription.ts`: el trial y los
  pagos de las inmobiliarias los gestiona el super-admin a mano desde el
  panel de Admin).
- [ ] Pedido específico: integrar **Mercado Pago** (el método más común en
  Argentina) para que el pago se pueda hacer directo desde la app.
- [ ] Se cruza con la idea **"Entrada a Gestión + paywall"** (arriba en este
  mismo archivo) — probablemente conviene resolverlas juntas: el paywall
  define CUÁNDO se le pide pagar al usuario, esto define CÓMO paga.
- [ ] A definir antes de implementar: ¿se cobra la suscripción de la
  inmobiliaria (reemplazando el cobro manual actual) y/o pagos entre partes
  (ej. un inquilino paga el alquiler a través de la app)? Son dos alcances
  bien distintos, conviene no mezclarlos en la misma tarea.
- **Nota (2026-08-01):** el usuario todavía no definió el modelo de venta a
  clientes (mano a mano con transferencia directa, o cobro dentro de la
  app) — por ahora es mano a mano, así que esto y el paywall quedan
  parados hasta que se decida. No tocar hasta que se retome explícitamente.

### 6. Falta una pantalla de configuración de cuenta — ✅ resuelto (2026-08-01)
- [x] Se armó `AccountMenu` (`src/client/components/account-menu.tsx`), un
  menú de cuenta en el topbar (ítem al lado del nombre del usuario, en
  `dashboard.tsx`/`admin-console.tsx`) con acceso a Favoritos, Configuración
  y Cerrar sesión — mismo lugar para cualquier rol.
- [x] `SettingsPanel` (mismo archivo) es la pantalla de "Mi cuenta": nombre
  editable (nuevo `PUT /api/profile/name`), email de solo lectura (viene de
  Google), WhatsApp de contacto. Vive como **tab "Configuración"** en
  `AgencyWorkspace`/`NonAgencyHome` (no como modal — se probó como modal
  primero y no encajaba con el resto de la navegación por tabs) y como modal
  genérico solo en `AdminConsole` (que no tiene tabs).
- [x] El WhatsApp de la agencia se sacó de **Consultas**
  (`ConsultasPanel`) y ahora se edita desde Configuración (`PATCH
  /api/agencies`, ya existía el endpoint); en Consultas quedó un mensaje +
  botón que manda para allá.
- [x] De yapa: "Marca del sitio" en el mismo panel (solo admin/manager de
  agencia) — nombre de marca configurable en vivo (`site_settings` +
  `GET/PUT /api/site`), reemplaza "Coopen Places" en header/footer/títulos/
  topbar/login. Pensado para el modelo de "vender un deploy propio por
  cliente" (no estaba en el pedido original de este apartado, salió de una
  vuelta de feedback aparte el mismo día).

### 7. Colores de bajo contraste en Propiedades (2026-07-30)
- [ ] En la pestaña **Propiedades**, varios elementos quedaron con muy poco
  contraste contra el fondo crema — un marrón/terracota muy clarito que se
  pierde: los chips **Alquiler/Venta** (clase `.tag` en `styles.css`: texto
  `var(--accent)` sobre fondo `var(--bg)`, borde `var(--line)` — todo tonos
  muy cercanos entre sí), el contador de visitas 👁 (`.views-chip`, mismo
  problema), y los `<Select>` de **Estado** (disponible/reservada/alquilada/
  vendida) que ahora usan `STATUS_COLOR` en `properties-panel.tsx` (clases
  `text-ok` / `text-warn` / `text-muted-foreground`) — el texto de estado se
  distingue poco del trigger crema-sobre-crema.
- [ ] Hace falta otra paleta (o al menos otra intensidad/saturación) para
  estos indicadores puntuales — no necesariamente tocar el resto de la
  estética "madera", pero sí resolver que se puedan leer sin esfuerzo.

### 8. Mapa de la agencia (2026-07-30)
- [ ] **Asignado a otra persona (2026-08-01)**: lo va a trabajar el
  compañero del usuario, no tocar desde este chat salvo que se pida
  explícitamente.
- [ ] **Estética**: el mapa de `AgencyMap` (`src/client/components/agency-map.tsx`)
  usa tiles de OpenStreetMap por defecto (vía Leaflet) — se ve "feo" y con
  demasiada información (etiquetas de calles, íconos de POIs de colores
  variados) que no combina con la estética de la app. Evaluar un tile
  provider más minimalista/monocromático (ej. CartoDB Positron/Voyager,
  Stamen Toner Lite) o estilos custom de marcador, en vez del tile estándar
  de OSM.
- [x] **Bug**: al hacer click derecho sobre el mapa y crear una propiedad
  ahí, el mapa de fondo no se ocultaba/tapaba detrás del modal — resuelto
  (2026-08-01). Causa confirmada: `.agency-map-wrap` tenía `position:
  relative` pero sin `z-index`, así que no formaba stacking context propio;
  los panes/controles de Leaflet (z-index hasta 1000) terminaban compitiendo
  directo contra `.modal-backdrop` (z-index 50) en el stacking context del
  documento y le ganaban. Fix: `isolation: isolate` en `.agency-map-wrap`
  (`styles.css`) para que los z-index internos de Leaflet queden contenidos
  adentro del wrapper y no compitan con hermanos como el modal.

### 9. Consultas: responder por WhatsApp — ✅ resuelto (2026-07-30)
- [x] `ConsultasPanel` (`agency-workspace.tsx`) ahora muestra un botón redondo
  con el ícono `SiWhatsapp` (react-icons/si, verde `#1fab54`, estilo
  `.wa-icon-btn` en `styles.css`) a la derecha de cada consulta que tiene
  `phone` cargado, con link directo a `https://wa.me/<solo dígitos>` (sin
  mensaje precargado, abre el chat directo). Se oculta si la consulta no
  tiene `phone` (ej. viene de un `source` sin teléfono).

## Apartado "Correo": bandeja de equipo sobre una casilla de Gmail (2026-09-10)

Se va a trabajar en un chat aparte — esto queda autocontenido.

**Contexto de la app:** Cloudflare Worker (Hono) + D1 (SQLite) + R2 + SPA React,
un deploy por cliente (hoy El Muelle, `elmuelle.tomyredrebell.workers.dev`, repo
`Tms-mrl/TMS-PLACE`, local `C:\dev\tms-place`). Login con Google OAuth propio
(`src/worker/routes/auth.ts`). El panel de gestión tiene tabs
(`agency-workspace.tsx`): Resumen / Propiedades / Mapa / Clientes / Operaciones /
Contratos / Finanzas / Consultas / Sucursales / Equipo / Configuración.

**Lo que se quiere:** un apartado nuevo "Correo" en esa nav. El Muelle recibe las
consultas en **una sola casilla** (`elmuelle@gmail.com`, Gmail común, NO Workspace).
Flujo pedido:
1. Llega una consulta a esa casilla → aparece en el apartado "Correo" del panel.
2. Quien tría la marca como *pendiente para tal sucursal* (asignar `branch_id` +
   estado). La app ya sabe qué usuario es de qué sucursal (`agency_members.branch_id`).
3. Al usuario de esa sucursal le aparece la notificación / un badge de pendientes.
4. Ese usuario abre el hilo, escribe una respuesta y **abajo adjunta una o varias
   propiedades** con el mismo bloque que el "Compartir por WhatsApp" del Inventario
   (`🏡título - 📍dirección / link / precio-según-fechas`, ver `shareProps` en
   `properties-panel.tsx` y `quoteForRange` en `src/client/lib/season-price.ts`).
5. La respuesta sale de `elmuelle@gmail.com` y threadea bien.

**Enfoque recomendado (evaluado en el chat de la idea):**
- **API de Gmail + OAuth**, una sola cuenta conectada **una vez** por un admin
  (no cada usuario conecta su Gmail). Se guarda el *refresh token* cifrado (con un
  secret del Worker) y todos leen/responden a través de esa conexión.
- **Recibir:** cron cada 1 min (Cloudflare Cron Trigger, mínimo 1/min — latencia
  ok para consultas), sync incremental por `historyId` de Gmail, metadata + snippet
  a D1, adjuntos entrantes a R2 on-demand al abrir el hilo. (Gmail push vía Pub/Sub
  existe si algún día se quiere instantáneo, es más infra.)
- **Responder:** `messages.send` de Gmail con headers de hilo (`In-Reply-To` /
  `References` / `threadId`) → sale como `elmuelle@gmail.com`, queda en Enviados,
  no cae en spam, cero configuración de DNS.
- **Asignar + estados:** tabla nueva (ej. `mail_threads` con `gmail_thread_id`,
  `from_addr`, `subject`, `snippet`, `received_at`, `branch_id`, `status`,
  `assigned_at`) + PATCH. Estados tipo `nuevo` / `pendiente` / `respondido` /
  `archivado`. El "badge para el de la sucursal" = contador en la nav filtrado por
  el `branch_id` del usuario.
- **Adjuntar propiedades:** reusar el selector del Inventario + el armador de bloque
  de `shareProps` (texto plano casi gratis; una versión HTML con foto de portada es
  un poco más pero chica).

**Verificación de Google (importante, no bloqueante):** los scopes
`gmail.readonly` + `gmail.send`/`gmail.modify` son "restringidos". Publicada con
muchos usuarios, Google pide una auditoría de seguridad cara. **Como es una sola
cuenta**, se deja la OAuth app en modo **"Testing"** con `elmuelle@gmail.com` como
test user (tope 100) y funciona indefinidamente sin auditoría. Ese es el camino.
Alternativa que saca a Google del medio: "Contraseña de aplicación" de Gmail (con
2FA) + IMAP/SMTP — evita la verificación pero IMAP desde un Worker es más frágil
(no hay sockets persistentes cómodos); se prefiere la API en modo Testing.

**Fácil vs. con truco:**
- *Fácil / territorio conocido:* el apartado en la nav, la lista de hilos, el
  detalle, asignar + estados + badge, el composer, adjuntar propiedades, guardar
  en D1.
- *Donde está el laburo real:* OAuth de Gmail + pantalla de consentimiento en
  Google Cloud; sync incremental bien hecho (rate limits, `historyId` vencido →
  re-scan); cifrado del token; concurrencia (dos personas en el mismo hilo → se
  resuelve mostrando estado / "lo está viendo Fulano", sin bloquear); adjuntos
  entrantes.

**Tamaño estimado:** MVP usable (conectar casilla · lista · asignar + estado ·
badge de pendientes · abrir hilo · responder con propiedades · threading correcto)
≈ **1,5 a 3 semanas**. Mitad plumbing de Gmail, mitad UI + CRUD de asignación.
Notificaciones "de verdad" (push del navegador, o aviso por mail/WhatsApp al de la
sucursal) es una capa extra encima, chica pero fuera del MVP.

**Prerrequisitos de config (una vez):** proyecto de Google Cloud con Gmail API
habilitada, OAuth consent screen configurada, `elmuelle@gmail.com` como test user,
y alguien con acceso a esa casilla hace el consentimiento la primera vez. Sumar el
`redirect_uri` nuevo (mismo tema que ya documentado en CLAUDE.md para el OAuth de
login). El `GOOGLE_CLIENT_ID`/`_SECRET` puede ser el mismo del login o uno aparte.

## Posible eliminación de la barra de "completitud del aviso" (2026-09-11)

Tomy lo está pensando, no decidido todavía. Es la barrita marrón/verde debajo
del título en cada fila del Inventario (`prow-bar` en `property-row.tsx`,
calculada por `completeness()` en `src/client/lib/completeness.ts`): mide 8
ítems del aviso (fotos, precio, ciudad, dirección, ubicación en el mapa,
descripción, ambientes/baños/superficie, comodidades) y el tooltip dice qué
falta. Si se decide sacarla, tocar esos dos archivos (la barra en el JSX de
`property-row.tsx` y, si no queda usada en ningún otro lado, borrar
`completeness.ts` entero — confirmar antes con un grep de `completeness`).

---

Conviene trabajar de a un apartado por vez, en orden o por prioridad — no
todos juntos. Cuando un apartado quede resuelto del todo, tachar sus puntos
acá mismo (no hace falta un changelog aparte todavía).
