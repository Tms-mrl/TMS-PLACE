import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Heart, LogOut, Settings } from 'lucide-react';
import { api } from '../lib/api';
import type { Agency, User } from '../lib/types';
import { toast } from '../lib/toast';
import { Button } from './ui/button';
import { useConfirm } from './ui/use-confirm';

// Punto de entrada único a Favoritos/Configuración/Salir, para cualquier rol
// (agencia, propietario/inquilino). onFavorites es opcional (no todo caller
// tiene esa sección); onSettings siempre navega a la tab de Configuración del
// caller.
export function AccountMenu({ user, onLogout, onFavorites, onSettings }: {
  user: User; onLogout: () => void; onFavorites?: () => void; onSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="account-menu" ref={ref}>
      <button className="account-trigger" onClick={() => setOpen((v) => !v)}>
        <span className="muted">{user.name || user.email}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="account-dropdown">
          {onFavorites && (
            <button onClick={() => { setOpen(false); onFavorites(); }}>
              <Heart className="h-4 w-4" /> Favoritos
            </button>
          )}
          <button onClick={() => { setOpen(false); onSettings(); }}>
            <Settings className="h-4 w-4" /> Configuración
          </button>
          <button onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

// Contenido de Configuración: nombre + WhatsApp editables, email de solo
// lectura (viene de Google) + cerrar sesión. Se usa embebido como tab
// (Dashboard/AgencyWorkspace, con su propio <section className="panel">).
//
// El WhatsApp es contextual: si se pasa `agency` (tab de AgencyWorkspace),
// edita el WhatsApp público de la inmobiliaria (antes vivía en Consultas);
// si no, edita el WhatsApp personal del propietario/inquilino particular.
export function SettingsPanel({ user, onLogout, agency, onAgencySaved }: {
  user: User; onLogout: () => void; agency?: Agency; onAgencySaved?: () => void;
}) {
  const [name, setName] = useState(user.name || '');
  const [nameSaved, setNameSaved] = useState(false);
  const [wa, setWa] = useState(agency?.whatsapp || '');
  const [loaded, setLoaded] = useState(!!agency);
  const [waSaved, setWaSaved] = useState(false);
  const canEditBrand = !!agency && ['admin', 'manager'].includes(agency.role);
  const [brand, setBrand] = useState('');
  const [brandSaved, setBrandSaved] = useState(false);

  useEffect(() => {
    if (agency) { setWa(agency.whatsapp || ''); setLoaded(true); return; }
    api<{ whatsapp: string | null }>('/api/profile')
      .then((r) => setWa(r.whatsapp || ''))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [agency]);

  useEffect(() => {
    if (!canEditBrand) return;
    api<{ brandName: string }>('/api/site')
      .then((r) => setBrand(r.brandName))
      .catch(() => {});
  }, [canEditBrand]);

  async function saveName() {
    if (!name.trim()) return;
    try {
      await api('/api/profile/name', { method: 'PUT', body: JSON.stringify({ name: name.trim() }) });
      setNameSaved(true);
      setTimeout(() => window.location.reload(), 500);
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  async function saveWa() {
    try {
      if (agency) {
        await api('/api/agencies', { method: 'PATCH', body: JSON.stringify({ whatsapp: wa }) });
        onAgencySaved?.();
      } else {
        await api('/api/profile/whatsapp', { method: 'PUT', body: JSON.stringify({ whatsapp: wa }) });
      }
      setWaSaved(true);
      setTimeout(() => setWaSaved(false), 2000);
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  async function saveBrand() {
    if (!brand.trim()) return;
    try {
      await api('/api/site', { method: 'PUT', body: JSON.stringify({ brandName: brand.trim() }) });
      setBrandSaved(true);
      setTimeout(() => window.location.reload(), 500);
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  const body = (
    <div className="form">
      <div>
        <p className="muted small" style={{ margin: 0 }}>Nombre</p>
        <div className="addrow">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
          <Button size="sm" onClick={saveName}>{nameSaved ? '✓' : 'Guardar'}</Button>
        </div>
      </div>
      <div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>Email</p>
        <p style={{ margin: '2px 0 0' }}>{user.email}</p>
      </div>
      <div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>WhatsApp para consultas</p>
        <p className="muted small" style={{ margin: '2px 0 8px' }}>
          Los clientes ven un botón <b>“Consultar por WhatsApp”</b> en cada propiedad publicada. Configurá el número con código de país (ej: 5493415551234).
        </p>
        <div className="addrow">
          <input
            placeholder="Ej: 5493415551234"
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            disabled={!loaded}
            autoComplete="off"
          />
          <Button size="sm" onClick={saveWa}>{waSaved ? '✓' : 'Guardar'}</Button>
        </div>
      </div>
      {canEditBrand && (
        <div>
          <p className="muted small" style={{ margin: '10px 0 0' }}>Marca del sitio</p>
          <p className="muted small" style={{ margin: '2px 0 8px' }}>
            El nombre que se muestra en el sitio público y el panel (header, títulos, login).
          </p>
          <div className="addrow">
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Mi Inmobiliaria" />
            <Button size="sm" onClick={saveBrand}>{brandSaved ? '✓' : 'Guardar'}</Button>
          </div>
        </div>
      )}
      {canEditBrand && <TestimonialsEditor />}
      <Button variant="outline" onClick={onLogout}><LogOut className="h-4 w-4" /> Cerrar sesión</Button>
    </div>
  );

  return <section className="panel"><h2>Configuración</h2>{body}</section>;
}

type Testimonial = { id: number; author: string; role: string | null; quote: string; published: number };

/**
 * Testimonios del sitio público (prueba social).
 *
 * El landing decía "Detrás de cada casa, hay personas" sin una sola prueba de eso. Acá los
 * carga la inmobiliaria: **son reales o no hay sección** — con la lista vacía el sitio no
 * muestra nada, que es preferible a una reseña inventada.
 */
function TestimonialsEditor() {
  const confirm = useConfirm();
  const [list, setList] = useState<Testimonial[] | null>(null);
  const [f, setF] = useState({ author: '', role: '', quote: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const load = () => api<{ testimonials: Testimonial[] }>('/api/site/testimonials')
    .then((r) => setList(r.testimonials)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  async function add() {
    if (!f.author.trim() || !f.quote.trim()) return toast('Falta el nombre o el testimonio', 'err');
    setSaving(true);
    try {
      await api('/api/site/testimonials', { method: 'POST', body: JSON.stringify({ author: f.author.trim(), role: f.role.trim(), quote: f.quote.trim() }) });
      setF({ author: '', role: '', quote: '' });
      await load();
      toast('Testimonio publicado');
    } catch (e) { toast(String((e as Error).message), 'err'); }
    finally { setSaving(false); }
  }

  async function togglePub(t: Testimonial) {
    try {
      await api(`/api/site/testimonials/${t.id}`, { method: 'PATCH', body: JSON.stringify({ published: !t.published }) });
      await load();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  async function del(t: Testimonial) {
    if (!(await confirm(`¿Eliminar el testimonio de ${t.author}?`, { destructive: true, confirmLabel: 'Eliminar' }))) return;
    try { await api(`/api/site/testimonials/${t.id}`, { method: 'DELETE' }); await load(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }

  const live = (list || []).filter((t) => t.published).length;
  return (
    <div>
      <p className="muted small" style={{ margin: '10px 0 0' }}>Testimonios del sitio público</p>
      <p className="muted small" style={{ margin: '2px 0 8px' }}>
        Lo que dicen tus clientes, en la home. <b>Cargá solo testimonios reales</b>: si no hay
        ninguno publicado, la sección no aparece — es mejor que inventar uno.
        {list && ` (${live} publicado${live === 1 ? '' : 's'} de ${list.length})`}
      </p>
      {list && list.length > 0 && (
        <div className="acct-list" style={{ marginBottom: 10 }}>
          {list.map((t) => (
            <div key={t.id} className={t.published ? 'acct-row in' : 'acct-row'}>
              <div className="acct-who">
                <div className="acct-name">{t.author}{!t.published && <span className="chip">oculto</span>}</div>
                <div className="muted small">{t.role ? `${t.role} · ` : ''}“{t.quote}”</div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <button className="link-btn" onClick={() => togglePub(t)}>{t.published ? 'Ocultar' : 'Publicar'}</button>
                <button className="link-btn danger" onClick={() => del(t)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="row2">
        <input placeholder="Quién lo dijo (ej: Marta S.)" value={f.author} onChange={(e) => set('author', e.target.value)} />
        <input placeholder="Rol (ej: Inquilina en Pinamar)" value={f.role} onChange={(e) => set('role', e.target.value)} />
      </div>
      <textarea placeholder="Qué dijo, en sus palabras" rows={2} value={f.quote} onChange={(e) => set('quote', e.target.value)} style={{ marginTop: 8 }} />
      <Button size="sm" onClick={add} disabled={saving} style={{ marginTop: 8 }}>Agregar testimonio</Button>
    </div>
  );
}
