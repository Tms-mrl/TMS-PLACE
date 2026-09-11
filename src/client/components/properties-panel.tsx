import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, EyeOff,
  Search, Share2, Tag, X,
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { mediaUrl, PROPERTY_KINDS, STATUSES, type Branch, type Media, type Property } from '../lib/types';
import { quoteForRange, rangeNights } from '../lib/season-price';
import { toast } from '../lib/toast';
import { prefetchClients } from '../lib/clients-cache';
import { CalendarModal } from './calendar-modal';
import { AskModal, PhotoManager, PropertyForm } from './property-form';
import { PropertyRow } from './property-row';
import { SeasonPricesModal } from './season-prices-modal';
import { StatsModal } from './stats-modal';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';

/** Filas por página. El listado del cliente que llega de BuscadorProp puede traer
 *  ~1000: pintarlas todas traba el navegador (gotcha del manual raíz §5). */
const PAGE_SIZE = 50;

// Sentinels para <Select> (Radix no permite value="" en un Item) — nunca viajan al backend.
const ALL = '_all';
const NONE = '_none';


// ¿Hay alguna reserva que se solape con el rango [from, to]? (test de solapamiento de intervalos)
function bookedInRange(bookingsJson: string | null, from: string, to: string): boolean {
  try { return (JSON.parse(bookingsJson || '[]') as { f: string; t: string }[]).some((b) => b.f <= to && from <= b.t); }
  catch { return false; }
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtShort = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

// Selector de rango de fechas por almanaque clickeable (mismo gesto que el CalendarModal
// de reservas), para reemplazar el par de <input type=date> del filtro de Inventario.
function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const first = new Date(ym.y, ym.m, 1).getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => `${ym.y}-${pad(ym.m + 1)}-${pad(i + 1)}`)];
  const monthName = new Date(ym.y, ym.m, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const shift = (d: number) => setYm(({ y, m }) => { const nd = new Date(y, m + d, 1); return { y: nd.getFullYear(), m: nd.getMonth() }; });

  // 1er click abre el rango, 2do lo cierra, y NO importa el orden: la fecha menor queda
  // de "desde". Mismo criterio que el calendario de reservas (calendar-modal.tsx).
  function pick(d: string) {
    if (!from || to) { onChange(d, ''); return; }
    onChange(d < from ? d : from, d < from ? from : d);
  }

  const label = from && to ? `${fmtShort(from)} → ${fmtShort(to)}` : from ? `${fmtShort(from)} → …` : 'Fechas';

  return (
    <div className="date-range-field" ref={ref}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <CalendarIcon className="h-4 w-4" />{label}
      </Button>
      {open && (
        <div className="date-range-pop">
          <div className="cal-head">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <b style={{ textTransform: 'capitalize' }}>{monthName}</b>
            <Button variant="ghost" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="cal-grid">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const inRange = !!from && !!to && d >= from && d <= to;
              const isEdge = d === from || d === to;
              return (
                <button key={i} type="button" className={cn('cal-day', 'cal-day-pick', inRange && 'in-range', isEdge && 'edge')} onClick={() => pick(d)}>
                  {Number(d.slice(-2))}
                </button>
              );
            })}
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <button type="button" className="link-btn" onClick={() => onChange('', '')}>Limpiar</button>
            <Button size="sm" onClick={() => setOpen(false)}>Listo</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Filtro preseteado desde los KPIs del Resumen. */
export type PropPreset = { status?: string; branch?: number; op?: string; published?: string };

// Importar una propiedad desde un link de Argenprop (extrae datos + fotos).
export function ImportArgenprop({ scope, onImported }: { scope: 'agency' | 'particular'; onImported: () => void }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  async function run(url: string) {
    setOpen(false); setBusy(true);
    try {
      const r = await api<{ imported: { photos: number } }>('/api/properties/import', { method: 'POST', body: JSON.stringify({ url, scope }) });
      toast(`Importada con ${r.imported.photos} foto(s). Quedó como borrador — revisala y publicala.`, 'ok');
      onImported();
    } catch (e) { toast(String((e as Error).message), 'err'); }
    finally { setBusy(false); }
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={busy}>
        <Download className="h-4 w-4" />{busy ? 'Importando…' : 'Importar de Argenprop'}
      </Button>
      {open && <AskModal title="Importar de Argenprop" label="Pegá el link de la propiedad en Argenprop." placeholder="https://www.argenprop.com/..." cta="Importar" onSubmit={run} onClose={() => setOpen(false)} />}
    </>
  );
}

// Visor de fotos a pantalla completa.
function Lightbox({ media, onClose }: { media: Media[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const n = media.length;
  const at = ((i % n) + n) % n;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => x + 1);
      if (e.key === 'ArrowLeft') setI((x) => x - 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!n) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-x" onClick={onClose}>✕</button>
      {n > 1 && <button className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); setI((x) => x - 1); }}>‹</button>}
      <img src={mediaUrl(media[at]!.r2_key)} alt="" onClick={(e) => e.stopPropagation()} />
      {n > 1 && <button className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); setI((x) => x + 1); }}>›</button>}
      {n > 1 && <div className="lb-count">{at + 1} / {n}</div>}
    </div>
  );
}

const EMPTY_F = { text: '', op: '', status: '', branch: '', kind: '', priced: '', capacity: '', dateFrom: '', dateTo: '', published: '', archived: false };

export function PropertiesPanel({ branches, onChanged, preset }: { branches: Branch[]; onChanged?: () => void; preset?: PropPreset }) {
  const confirm = useConfirm();
  const [props, setProps] = useState<Property[]>([]);
  const [managing, setManaging] = useState<Property | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lb, setLb] = useState<Media[] | null>(null);
  const [editing, setEditing] = useState<Property | null>(null);
  const [cal, setCal] = useState<Property | null>(null);
  const [stats, setStats] = useState<Property | null>(null);
  const [seasonP, setSeasonP] = useState<Property | null>(null);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [f, setF] = useState({ ...EMPTY_F });
  const set = (k: keyof typeof EMPTY_F, v: string) => setF((s) => ({ ...s, [k]: v }));
  const [page, setPage] = useState(0);
  const [capped, setCapped] = useState(false);

  const load = () => api<{ properties: Property[]; capped?: boolean }>('/api/properties/mine')
    .then((r) => { setProps(r.properties); setCapped(!!r.capped); })
    .catch(() => {});
  useEffect(() => {
    load();
    prefetchClients();
  }, []);
  useEffect(() => {
    if (!preset) return;
    setF({ ...EMPTY_F, status: preset.status || '', branch: preset.branch != null ? String(preset.branch) : '', op: preset.op || '', published: preset.published || '' });
  }, [preset]);
  const reload = () => { load(); onChanged?.(); };

  // Rango de fechas activo (mismo criterio que el DateRangePicker: un solo día clickeado
  // cuenta como "desde y hasta" ese día). Lo usa el filtro de reservas solapadas, el
  // mensaje de "Compartir" y el orden por precio (para cotizar según la tarifa del rango
  // en vez del precio fijo).
  const dFrom = f.dateFrom || f.dateTo;
  const dTo = f.dateTo || f.dateFrom;
  const dateActive = !!dFrom;
  /** Precio a usar para ordenar: con fechas activas, la tarifa cotizada para ese rango
   *  (semana/quincena/día según `quoteForRange`); si la propiedad no tiene esa tarifa
   *  cargada, o no hay fechas, cae al precio fijo. */
  const sortPrice = (p: Property): number => {
    const q = dateActive ? quoteForRange(p.season_prices, dFrom, dTo) : null;
    return q ?? p.price ?? -Infinity;
  };

  function toggleSel(id: number) { setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  async function bulkPatch(body: Record<string, unknown>) {
    await Promise.all([...selected].map((id) => api(`/api/properties/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).catch(() => {})));
    setSelected(new Set()); reload();
  }
  async function bulkDelete() {
    if (!(await confirm(`¿Eliminar ${selected.size} propiedad(es)? No se puede deshacer.`, { destructive: true, confirmLabel: 'Eliminar' }))) return;
    await Promise.all([...selected].map((id) => api(`/api/properties/${id}`, { method: 'DELETE' }).catch(() => {})));
    setSelected(new Set()); reload();
  }
  // Compartir por WhatsApp: un bloque por propiedad separado por un renglón en blanco —
  //   🏡<nombre> - 📍<dirección, ciudad>   (el título de la cartera ya trae "- dir, ciudad";
  //                                          si no, se le suma acá antes de partirlo)
  //   <link del aviso>
  //   <N días x $precio>  ← calculado desde "Precios por temporada" según el rango del filtro
  // La línea de precio se omite si no hay filtro de fechas o la propiedad no tiene esa tarifa.
  // No muta nada, así que no limpia la selección.
  async function shareProps(list: Property[]) {
    const withUrl = list.filter((p) => p.external_url);
    if (!withUrl.length) { toast('Ninguna de esas propiedades tiene el link del aviso cargado', 'err'); return; }
    if (withUrl.length > 15 && !(await confirm(`Vas a compartir ${withUrl.length} avisos en un mensaje. WhatsApp puede recortar los mensajes largos. ¿Seguir?`))) return;
    const skipped = list.length - withUrl.length;
    if (skipped) toast(`${skipped} sin link: no se ${skipped === 1 ? 'incluyó' : 'incluyeron'}`, 'ok');
    const blocks = withUrl.map((p) => {
      const where = [p.address, p.city].filter(Boolean).join(', ');
      // Base = título (que ya suele traer "- dirección, ciudad" por la 0022); si es una
      // propiedad nueva sin eso, se lo sumamos. Después partimos en el último " - " para
      // meter 🏡 antes del nombre y 📍 antes de la ubicación.
      const base = where && p.address && !p.title.includes(p.address) ? `${p.title} - ${where}` : p.title;
      const cut = base.lastIndexOf(' - ');
      const l1 = cut === -1 ? `🏡${base}` : `🏡${base.slice(0, cut)} - 📍${base.slice(cut + 3)}`;
      const lines = [l1, p.external_url as string];
      const price = dFrom ? quoteForRange(p.season_prices, dFrom, dTo) : null;
      if (price != null) {
        const n = rangeNights(dFrom, dTo);
        const days = n ? `${n} día${n === 1 ? '' : 's'} x ` : '';
        lines.push(`${days}$${Math.round(price).toLocaleString('es-AR')}`);
      }
      return lines.join('\n');
    });
    const waUrl = `https://wa.me/?text=${encodeURIComponent(blocks.join('\n\n'))}`;
    // En el celu, wa.me redirige ("deep-linkea") a la app de WhatsApp — con _blank eso
    // deja una pestaña de más atrás en el navegador (a veces se ve un about:blank pelado
    // mientras arranca), así que ahí navegamos en la misma pestaña. En escritorio no hay
    // deep link, así que seguimos abriendo aparte para no perder el estado del Inventario
    // (selección, filtros, página) al volver.
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) window.location.href = waUrl;
    else window.open(waUrl, '_blank', 'noopener');
  }
  const bulkShare = () => shareProps(props.filter((p) => selected.has(p.id)));

  async function openLightbox(p: Property) {
    try {
      const r = await api<{ media: Media[] }>(`/api/properties/${p.id}/media`);
      if (!r.media.length) { toast('Esta propiedad todavía no tiene fotos.', 'err'); return; }
      setLb(r.media);
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  const filtered = props.filter((p) => {
    // Archivadas ocultas por defecto (el toggle "Ver archivadas" invierte esto).
    if (f.archived ? !p.archived_at : !!p.archived_at) return false;
    if (f.text) { const q = f.text.toLowerCase(); if (!(`${p.title} ${p.city || ''}`.toLowerCase().includes(q))) return false; }
    if (f.op && p.operation !== f.op) return false;
    if (f.status && p.status !== f.status) return false;
    if (f.branch && String(p.branch_id) !== f.branch) return false;
    if (f.kind && (p.kind || '') !== f.kind) return false;
    if (f.priced) {
      // Solo mira "Precios por temporada" — el precio fijo (p.price) no cuenta acá.
      const hasPrice = !!p.season_prices && p.season_prices !== '[]';
      if (f.priced === 'yes' && !hasPrice) return false;
      if (f.priced === 'no' && hasPrice) return false;
    }
    if (f.published === 'yes' && !p.published) return false;
    if (f.published === 'no' && p.published) return false;
    // "Personas" ya no filtra: reordena (ver `sorted`). Pedir N personas trae todo, con
    // las de N y las más grandes arriba (a pedido de Tomy, 2026-09-07 — revierte la
    // "capacidad exacta" de Charly del 2026-08-07).
    if (dateActive) {
      // Solo excluye si hay una reserva que se solape. "Disponible desde/hasta" es la
      // temporada habitual del anuncio, no un bloqueo de fechas: si no hay una reserva
      // puntual en el medio, la propiedad SÍ está libre para el rango (decisión de
      // producto, 2026-08-20 — antes también filtraba por esa ventana).
      if (bookedInRange(p.bookings, dFrom, dTo)) return false;
    }
    return true;
  });
  const dirty = JSON.stringify(f) !== JSON.stringify(EMPTY_F);

  // Orden por "Personas": no oculta nada. Primero la capacidad pedida y las mayores
  // (ascendente: N, N+1, N+2…), después las menores (N-1, N-2…) y al final las que no
  // tienen el dato cargado. Un lugar para N personas sirve si entran N o más. Un orden
  // manual elegido en el <Select> (Precio, Título…) tiene prioridad sobre esto.
  const capN = Number(f.capacity);
  const capRank = (cap: number | null): [number, number] =>
    cap == null ? [2, 0] : cap >= capN ? [0, cap - capN] : [1, capN - cap];
  const sorted = sort ? [...filtered].sort((a, b) => {
    const k = sort.key as keyof Property;
    if (k === 'price') return (sortPrice(a) - sortPrice(b)) * sort.dir;
    const av = String(a[k] ?? '').toLowerCase(); const bv = String(b[k] ?? '').toLowerCase();
    return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
  }) : (f.capacity && capN > 0) ? [...filtered].sort((a, b) => {
    const [ga, da] = capRank(a.capacity); const [gb, db] = capRank(b.capacity);
    return ga - gb || da - db;
  }) : filtered;

  // Con Desde/Hasta activo, el chip de Estado tiene que hablar DEL RANGO, no del estado
  // global de hoy: una casa con una reserva en otro mes está libre en las fechas buscadas
  // y mostrarla como "Reservada" confunde. Y como el filtro de arriba ya sacó del listado
  // a toda la que tenga una reserva solapada, lo que queda ES lo disponible en el rango.
  const displayRows = dateActive
    ? sorted.map((p) => (p.status === 'vendida' || p.status === 'disponible' ? p : { ...p, status: 'disponible' }))
    : sorted;

  // Los KPIs cuentan sobre lo NO archivado (que es lo que el panel muestra por defecto):
  // sumar las archivadas daría un total que no coincide con ninguna lista de la pantalla.
  const kpis = useMemo(() => {
    const vivas = props.filter((p) => !p.archived_at);
    const porOp = (op: string) => vivas.filter((p) => p.operation === op).length;
    return {
      total: vivas.length,
      venta: porOp('venta'),
      alquiler: porOp('alquiler'),
      temporario: porOp('temporario'),
      sinPublicar: vivas.filter((p) => !p.published).length,
      publicadas: vivas.filter((p) => p.published).length,
    };
  }, [props]);

  // Un cambio de filtro puede dejarte parado en una página que ya no existe.
  const pages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  useEffect(() => { setPage(0); }, [f.text, f.op, f.status, f.branch, f.kind, f.priced, f.capacity, f.dateFrom, f.dateTo, f.published, f.archived, sort]);
  const pageRows = displayRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const allSel = pageRows.length > 0 && pageRows.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(pageRows.map((p) => p.id)));
  /** Hay más resultados que los de esta página y todavía no están todos marcados. */
  const canSelectAllMatches = allSel && displayRows.length > pageRows.length && selected.size < displayRows.length;
  const shownFrom = displayRows.length ? safePage * PAGE_SIZE + 1 : 0;
  const shownTo = Math.min(displayRows.length, (safePage + 1) * PAGE_SIZE);

  /** Un KPI clickeado deja SOLO ese filtro puesto (no se acumulan entre sí). */
  const applyKpi = (patch: Partial<typeof EMPTY_F>) => { setF({ ...EMPTY_F, ...patch }); };

  return (
    <div>
      <div className="panel-head">
        <div className="phead-title">
          <h3>Mis propiedades</h3>
          <p className="muted small">{props.length} propiedad{props.length === 1 ? '' : 'es'} cargada{props.length === 1 ? '' : 's'}</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <ImportArgenprop scope="agency" onImported={reload} />
          <Button onClick={() => setShowNew(true)}>Nueva propiedad</Button>
        </div>
      </div>

      <div className="pkpis">
        <button type="button" className="pkpi" onClick={() => applyKpi({ op: 'venta' })}>
          <Tag className="pkpi-ic" /><b>{kpis.venta}</b><span>En venta</span>
        </button>
        <button type="button" className="pkpi" onClick={() => applyKpi({ op: 'alquiler' })}>
          <Tag className="pkpi-ic" /><b>{kpis.alquiler}</b><span>En alquiler</span>
        </button>
        <button type="button" className="pkpi" onClick={() => applyKpi({ op: 'temporario' })}>
          <CalendarIcon className="pkpi-ic" /><b>{kpis.temporario}</b><span>Temporario</span>
        </button>
        <button type="button" className={cn('pkpi', kpis.sinPublicar > 0 && 'is-alert')} onClick={() => applyKpi({ published: 'no' })}>
          <EyeOff className="pkpi-ic" /><b>{kpis.sinPublicar}</b><span>Sin publicar</span>
        </button>
        <div className="pkpi-side">
          <div><b>{kpis.total}</b> en tu cartera</div>
          <div><b>{kpis.publicadas}</b> publicada{kpis.publicadas === 1 ? '' : 's'} en tu web</div>
        </div>
      </div>

      {capped && (
        <p className="pnotice">Tenés más propiedades de las que el panel puede traer de una vez: se cargaron las <b>{props.length}</b> más recientes. Los filtros y la búsqueda trabajan sobre esas.</p>
      )}

      <div className="psearch">
        <div className="psearch-field">
          <Search className="psearch-ic" />
          <input placeholder="Buscar título / ciudad" value={f.text} onChange={(e) => set('text', e.target.value)} />
          {f.text && <button type="button" className="psearch-x" onClick={() => set('text', '')} aria-label="Limpiar búsqueda"><X className="h-4 w-4" /></button>}
        </div>
        <Button variant={f.archived ? 'secondary' : 'outline'} size="sm" onClick={() => setF((s) => ({ ...s, archived: !s.archived }))}>
          {f.archived ? 'Viendo archivadas' : 'Ver archivadas'}
        </Button>
        {dirty && <Button variant="ghost" size="sm" onClick={() => setF({ ...EMPTY_F })}><X className="h-4 w-4" />Limpiar</Button>}
      </div>

      <div className="filters pfilters">
        <Select value={f.op || ALL} onValueChange={(v) => set('op', v === ALL ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Operación</SelectItem>
            <SelectItem value="alquiler">Alquiler</SelectItem>
            <SelectItem value="venta">Venta</SelectItem>
            <SelectItem value="temporario">Temporario</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.status || ALL} onValueChange={(v) => set('status', v === ALL ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Estado</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.branch || ALL} onValueChange={(v) => set('branch', v === ALL ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Sucursal</SelectItem>
            {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.kind || ALL} onValueChange={(v) => set('kind', v === ALL ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tipo</SelectItem>
            {PROPERTY_KINDS.map((k) => <SelectItem key={k.v} value={k.v}>{k.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.priced || ALL} onValueChange={(v) => set('priced', v === ALL ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[130px]" title="Tiene (o no) tarifa cargada en Precios por temporada"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Precio</SelectItem>
            <SelectItem value="yes">Con precio</SelectItem>
            <SelectItem value="no">Sin precio</SelectItem>
          </SelectContent>
        </Select>
        <input type="number" min={1} placeholder="Pers." title="Ordena por capacidad: primero las de esa cantidad y las más grandes. No oculta ninguna." value={f.capacity} onChange={(e) => set('capacity', e.target.value)} style={{ maxWidth: 74 }} />
        <DateRangePicker from={f.dateFrom} to={f.dateTo} onChange={(dateFrom, dateTo) => setF((s) => ({ ...s, dateFrom, dateTo }))} />
      </div>
      <div className={selected.size > 0 ? 'bulk-bar-wrap open' : 'bulk-bar-wrap'}>
        <div className="bulk-bar-inner">
          <div className="bulk-bar">
            <span><b>{selected.size}</b> seleccionada{selected.size === 1 ? '' : 's'}</span>
            {canSelectAllMatches && (
              <button type="button" className="link-btn" onClick={() => setSelected(new Set(displayRows.map((p) => p.id)))}>
                Seleccionar las {displayRows.length} que coinciden
              </button>
            )}
            <Button size="sm" variant="secondary" onClick={bulkShare}><Share2 className="h-4 w-4" />Compartir por WhatsApp</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkPatch({ published: true })}>Publicar</Button>
            <Button size="sm" variant="outline" onClick={() => bulkPatch({ published: false })}>Despublicar</Button>
            <Button size="sm" variant="outline" onClick={() => bulkPatch({ status: 'vendida' })}>Marcar como vendida</Button>
            <Select value={ALL} onValueChange={(v) => { if (v === NONE) bulkPatch({ branch_id: null }); else if (v !== ALL) bulkPatch({ branch_id: Number(v) }); }}>
              <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Mover a sucursal…</SelectItem>
                <SelectItem value={NONE}>— Sin sucursal</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="destructive" onClick={bulkDelete}>Eliminar</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Cancelar</Button>
          </div>
        </div>
      </div>
      <div className="pbar">
        <label className="chk-all">
          <input type="checkbox" checked={allSel} onChange={toggleAll} />
          <span>Todas{displayRows.length > pageRows.length ? ' (esta página)' : ''}</span>
        </label>
        <Select
          value={sort ? `${sort.key}:${sort.dir}` : ALL}
          onValueChange={(v) => { if (v === ALL) { setSort(null); return; } const [k, d] = v.split(':'); setSort({ key: k!, dir: Number(d) as 1 | -1 }); }}
        >
          <SelectTrigger className="h-9 w-auto min-w-[160px] text-xs" title={dateActive ? 'Con Fechas puesto, ordena por la tarifa cotizada para ese rango' : 'Ordena por el precio fijo de la propiedad'}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Más recientes</SelectItem>
            <SelectItem value="price:1">Precio ↑</SelectItem>
            <SelectItem value="price:-1">Precio ↓</SelectItem>
            <SelectItem value="title:1">Título A→Z</SelectItem>
            <SelectItem value="status:1">Estado</SelectItem>
          </SelectContent>
        </Select>
        <div className="ppager">
          <span className="ppager-count">{shownFrom}-{shownTo} de {displayRows.length}</span>
          <button type="button" className="ppager-btn" onClick={() => setPage((n) => Math.max(0, n - 1))} disabled={safePage === 0} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" className="ppager-btn" onClick={() => setPage((n) => Math.min(pages - 1, n + 1))} disabled={safePage >= pages - 1} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {displayRows.length === 0 ? (
        <p className="pempty">No hay propiedades con esos filtros.</p>
      ) : (
        <div className="plist">
          {pageRows.map((p, i) => (
            <PropertyRow key={p.id} p={p} index={i} expanded={expanded === p.id}
              checked={selected.has(p.id)} selectMode={selected.size > 0} selectedCount={selected.size} onSelect={() => toggleSel(p.id)}
              onToggle={() => setExpanded((e) => (e === p.id ? null : p.id))}
              onManage={() => setManaging(p)} onEdit={() => setEditing(p)} onCalendar={() => setCal(p)}
              onSeasonPrices={() => setSeasonP(p)} onShare={() => shareProps([p])} onShareAll={bulkShare}
              onLightbox={openLightbox} onStats={() => setStats(p)} onReload={reload} />
          ))}
        </div>
      )}
      {showNew && <PropertyForm scope="agency" branches={branches} onClose={() => setShowNew(false)} onSaved={reload} />}
      {editing && <PropertyForm scope="agency" branches={branches} edit={editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {managing && <PhotoManager property={managing} onClose={() => setManaging(null)} onSaved={reload} />}
      {cal && <CalendarModal property={cal} onClose={() => { setCal(null); reload(); }} />}
      {stats && <StatsModal property={stats} onClose={() => setStats(null)} />}
      {seasonP && <SeasonPricesModal property={seasonP} onClose={() => setSeasonP(null)} />}
      {lb && <Lightbox media={lb} onClose={() => setLb(null)} />}
    </div>
  );
}
