import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BarChart3, Bath, BedDouble, Calendar as CalendarIcon, Camera, Check, ChevronDown,
  Eye, EyeOff, Home, Link as LinkIcon, MoreHorizontal, Pencil, Ruler,
  Share2, Trash2, User, Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { mediaUrl, money, PERIOD_SUFFIX, type Property } from '../lib/types';
import { AMENITIES, parseAmenities } from '../lib/amenities';
import { completeness, completenessHint, completenessTone } from '../lib/completeness';
import { toast } from '../lib/toast';
import { useConfirm } from './ui/use-confirm';

const AMEN_MAP = new Map(AMENITIES.map((a) => [a.key, a]));

const STATUS_COLOR: Record<string, string> = {
  disponible: 'is-ok',
  reservada: 'is-warn',
  alquilada: 'is-mute',
  vendida: 'is-mute',
};

/** Etiqueta de solo lectura: el estado se calcula desde el calendario, no se elige. */
export function StatusChip({ status }: { status: string }) {
  return <span className={cn('pchip pchip-status', STATUS_COLOR[status])}>{status}</span>;
}

const OP_LABEL: Record<string, string> = { alquiler: 'Alquiler', venta: 'Venta', temporario: 'Temporario' };

/** "06/04/2026 16:52" — el ISO es formato de máquina, no de pantalla. */
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── Menú desplegable de la fila ──────────────────────────────────────────────
// No hay primitivo de dropdown en components/ui, y meter uno de Radix por esto sería
// traer un paquete para dos menús. Cierra con click afuera, Escape, o al elegir algo
// (el onClick del contenedor: los ítems son <button>).
function RowMenu({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="rmenu" ref={ref}>
      <button type="button" className={cn('rbtn', open && 'is-open')} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {icon}<span>{label}</span><ChevronDown className="rbtn-caret" />
      </button>
      {open && <div className="rmenu-pop" role="menu" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" role="menuitem" className={cn('rmenu-item', danger && 'is-danger')} onClick={onClick}>
      {icon}<span>{children}</span>
    </button>
  );
}

// ── La fila ──────────────────────────────────────────────────────────────────
// UNA sola versión para escritorio y celular: el layout es grid y se reacomoda por CSS.
// Antes había dos componentes (tabla + card mobile) con las mismas acciones duplicadas.
export function PropertyRow({ p, index, expanded, checked, shareMessage, onSelect, onToggle, onManage, onEdit, onCalendar, onLightbox, onStats, onReload }: {
  p: Property; index: number; expanded: boolean; checked: boolean; shareMessage: string; onSelect: () => void; onToggle: () => void;
  onManage: () => void; onEdit: () => void; onCalendar: () => void; onLightbox: (p: Property) => void; onStats: () => void; onReload: () => void;
}) {
  const confirm = useConfirm();

  async function patch(body: Record<string, unknown>) {
    try { await api(`/api/properties/${p.id}`, { method: 'PATCH', body: JSON.stringify(body) }); onReload(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function del() {
    if (!(await confirm(`¿Eliminar "${p.title}"? No se puede deshacer.`, { destructive: true, confirmLabel: 'Eliminar' }))) return;
    try { await api(`/api/properties/${p.id}`, { method: 'DELETE' }); onReload(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }
  function copyLink() {
    if (!p.external_url) { toast('Esta propiedad no tiene link del aviso — cargalo en Editar', 'err'); return; }
    navigator.clipboard?.writeText(p.external_url).then(
      () => toast('Link copiado ✓', 'ok'),
      () => toast('No se pudo copiar', 'err'),
    );
  }
  // wa.me sin número → WhatsApp abre el selector de contacto. El texto es el que la
  // inmobiliaria escribió en Configuración y abajo el link del aviso.
  function shareWhatsApp() {
    if (!p.external_url) return;
    const text = [shareMessage.trim(), p.external_url].filter(Boolean).join('\n\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  const c = completeness(p);
  const amen = parseAmenities(p.amenities);
  const where = [p.address, p.city, p.province].filter(Boolean).join(', ');
  const specs = [
    p.rooms ? { k: 'rooms', n: String(p.rooms), lbl: 'ambientes', ic: <BedDouble className="h-3.5 w-3.5" /> } : null,
    p.bathrooms ? { k: 'bath', n: String(p.bathrooms), lbl: 'baños', ic: <Bath className="h-3.5 w-3.5" /> } : null,
    p.capacity ? { k: 'cap', n: String(p.capacity), lbl: 'personas', ic: <Users className="h-3.5 w-3.5" /> } : null,
    p.area_m2 ? { k: 'area', n: `${p.area_m2} m²`, lbl: 'superficie', ic: <Ruler className="h-3.5 w-3.5" /> } : null,
  ].filter(Boolean) as { k: string; n: string; lbl: string; ic: ReactNode }[];

  return (
    <article
      className={cn('prow', checked && 'is-sel', p.archived_at && 'is-archived', !p.published && !p.archived_at && 'is-draft')}
      // El stagger se corta a las 12 primeras: con 50 por página, escalonar todas
      // haría esperar segundos a la última.
      style={index < 12 ? { animationDelay: `${index * 40}ms` } : undefined}
    >
      <label className="prow-check" aria-label={`Seleccionar ${p.title}`}>
        <input type="checkbox" checked={checked} onChange={onSelect} />
      </label>

      <button type="button" className="prow-thumb" onClick={() => onLightbox(p)} title="Ver galería de fotos">
        {p.cover_key ? <img src={mediaUrl(p.cover_key)} alt="" loading="lazy" /> : <Home className="prow-thumb-ph" />}
        {(p.photos ?? 0) > 0 && <span className="prow-count"><Camera className="h-3 w-3" />{p.photos}</span>}
      </button>

      <div className="prow-main">
        <div className="prow-where">
          <span className="prow-addr">{where || 'Sin dirección cargada'}</span>
          <span className="prow-ref">#{p.id}</span>
        </div>

        <h3 className="prow-title">
          <button type="button" onClick={onToggle}>{p.title}</button>
        </h3>

        <div className={cn('prow-bar', `is-${completenessTone(c.pct)}`)} title={completenessHint(c)}
          role="progressbar" aria-valuenow={c.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Completitud del aviso">
          <i style={{ width: `${c.pct}%` }} />
        </div>

        <div className="prow-chips">
          {p.kind && <span className="pchip">{p.kind}</span>}
          <StatusChip status={p.status} />
          {p.archived_at
            ? <span className="pchip pchip-flag is-mute">Archivada</span>
            : !p.published && <span className="pchip pchip-flag is-warn">Sin publicar</span>}
          {specs.map((s) => (
            <span className="pchip pchip-soft" key={s.k} title={`${s.n} ${s.lbl}`}>
              {s.ic}{s.n}<span className="sr">{s.lbl}</span>
            </span>
          ))}
          <span className="pchip pchip-soft" title="Visitas al aviso"><Eye className="h-3 w-3" />{p.views ?? 0}</span>
        </div>

        <div className="prow-modified">Últ. modificación: {fmtDateTime(p.updated_at || p.created_at)}</div>
      </div>

      <div className="prow-money">
        <span className="prow-op">{OP_LABEL[p.operation] || p.operation}</span>
        <b className="prow-price">{money(p.price, p.currency, null)}</b>
        {p.price != null && PERIOD_SUFFIX[p.price_period || ''] && <span className="prow-period">{PERIOD_SUFFIX[p.price_period || '']}</span>}
        {p.branch_name && <span className="prow-branch">{p.branch_name}</span>}
      </div>

      <div className="prow-actions">
        <button type="button" className="rbtn is-primary" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /><span>Editar</span></button>
        <button type="button" className="rbtn" onClick={onCalendar} title="Reservas / calendario">
          <CalendarIcon className="h-3.5 w-3.5" /><span>Calendario</span>
        </button>
        <button type="button" className="rbtn" onClick={shareWhatsApp} disabled={!p.external_url}
          title={p.external_url ? 'Compartir por WhatsApp' : 'Falta el link del aviso — cargalo en Editar'}>
          <Share2 className="h-3.5 w-3.5" /><span>Compartir</span>
        </button>

        <RowMenu label="Más opciones" icon={<MoreHorizontal className="h-3.5 w-3.5" />}>
          <MenuItem icon={<LinkIcon className="h-4 w-4" />} onClick={copyLink}>Copiar link</MenuItem>
          <MenuItem icon={<Camera className="h-4 w-4" />} onClick={onManage}>Gestionar fotos</MenuItem>
          <MenuItem icon={<BarChart3 className="h-4 w-4" />} onClick={onStats}>Estadísticas de visitas</MenuItem>
          <MenuItem icon={<ChevronDown className="h-4 w-4" />} onClick={onToggle}>{expanded ? 'Ocultar detalle' : 'Ver detalle'}</MenuItem>
          <hr className="rmenu-sep" />
          {p.published
            ? <MenuItem icon={<EyeOff className="h-4 w-4" />} onClick={() => patch({ published: false })}>Despublicar</MenuItem>
            : <MenuItem icon={<Eye className="h-4 w-4" />} onClick={() => patch({ published: true })}>Publicar en la web</MenuItem>}
          {p.archived_at
            ? <MenuItem icon={<Check className="h-4 w-4" />} onClick={() => patch({ archived: false })}>Desarchivar</MenuItem>
            : p.status === 'vendida'
              ? <>
                  <MenuItem icon={<Check className="h-4 w-4" />} onClick={() => patch({ status: 'disponible' })}>Reactivar</MenuItem>
                  <MenuItem icon={<Trash2 className="h-4 w-4" />} onClick={async () => {
                    if (await confirm(`¿Archivar "${p.title}"? Deja de aparecer en Inventario (y se despublica); queda como historial.`)) patch({ archived: true });
                  }}>Archivar</MenuItem>
                </>
              : <MenuItem icon={<Check className="h-4 w-4" />} onClick={async () => {
                  if (await confirm(`¿Marcar "${p.title}" como vendida? Deja de aceptar nuevas reservas o alquileres.`)) patch({ status: 'vendida' });
                }}>Marcar como vendida</MenuItem>}
          <hr className="rmenu-sep" />
          <MenuItem icon={<Trash2 className="h-4 w-4" />} danger onClick={del}>Eliminar</MenuItem>
        </RowMenu>
      </div>

      {expanded && (
        <div className="prow-detail">
          <div className="prow-detail-grid">
            <div>
              <b>Detalle</b>
              <div className="muted">{specs.map((s) => `${s.n} ${s.lbl}`).join(' · ') || '—'}</div>
              {(p.available_from || p.available_until) && (
                <div className="muted small prow-line"><CalendarIcon className="h-3.5 w-3.5" />Disponible {p.available_from || '…'} → {p.available_until || '…'}</div>
              )}
              {p.owner_client_name && <div className="muted small prow-line"><User className="h-3.5 w-3.5" />Propietario: {p.owner_client_name}</div>}
            </div>
            <div>
              <b>Comodidades</b>
              <div className="amen-row">{amen.length ? amen.map((k) => { const a = AMEN_MAP.get(k); return a ? <span className="amen-chip" key={k}>{a.icon} {a.label}</span> : null; }) : <span className="muted">—</span>}</div>
            </div>
          </div>
          {c.missing.length > 0 && (
            <p className="prow-todo">Para completar el aviso falta: <b>{c.missing.join(', ')}</b>.</p>
          )}
          {p.description && <p className="prow-desc">{p.description}</p>}
        </div>
      )}

    </article>
  );
}
