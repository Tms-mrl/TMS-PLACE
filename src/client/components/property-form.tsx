import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { api, upload } from '../lib/api';
import { mediaUrl, PRICE_PERIODS, PROPERTY_KINDS, type Branch, type Media, type Property } from '../lib/types';
import { AMENITIES, parseAmenities } from '../lib/amenities';
import { toast } from '../lib/toast';
import { LocationPicker } from './location-picker';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const NONE = '_none';
const NEW_KIND = '_new_kind';

// Modal genérico de un input (reemplaza prompt()).
export function AskModal({ title, label, placeholder, defaultValue, cta, onSubmit, onClose }: {
  title: string; label?: string; placeholder?: string; defaultValue?: string; cta?: string; onSubmit: (v: string) => void; onClose: () => void;
}) {
  const [v, setV] = useState(defaultValue || '');
  const go = () => { if (v.trim()) onSubmit(v.trim()); };
  return (
    <Modal title={title} onClose={onClose}>
      <div className="form">
        {label && <p className="muted small" style={{ margin: 0 }}>{label}</p>}
        <input autoFocus placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') go(); }} />
        <Button onClick={go}>{cta || 'Aceptar'}</Button>
      </div>
    </Modal>
  );
}

function initForm(edit?: Property) {
  if (!edit) return { ...emptyForm };
  const s = (v: unknown) => (v != null ? String(v) : '');
  return {
    title: edit.title || '', operation: edit.operation || 'alquiler', kind: edit.kind || '',
    price: s(edit.price), currency: edit.currency || 'ARS', price_period: edit.price_period || '', rooms: s(edit.rooms), bathrooms: s(edit.bathrooms),
    area_m2: s(edit.area_m2), capacity: s(edit.capacity), available_from: edit.available_from || '', available_until: edit.available_until || '',
    address: edit.address || '', city: edit.city || '', province: edit.province || '', description: edit.description || '',
    external_url: edit.external_url || '',
  };
}

export // Redimensiona/comprime en el navegador antes de subir (máx 1600px, JPEG 82%).
async function downscale(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale >= 1 && file.size < 500_000) { bmp.close?.(); return file; }
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'); if (!ctx) { bmp.close?.(); return file; }
    ctx.drawImage(bmp, 0, 0, w, h); bmp.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
    return blob && blob.size < file.size ? blob : file;
  } catch { return file; }
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div>
        {children}
      </div>
    </div>
  );
}

// Tira de fotos con subir (multiple) y borrar, contra R2.
function PhotoStrip({ propertyId, media, setMedia }: { propertyId: number; media: Media[]; setMedia: (m: Media[]) => void }) {
  const [busy, setBusy] = useState(false);
  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const added: Media[] = [];
      for (const f of Array.from(files)) {
        const opt = await downscale(f);
        const r = await upload<{ media: Media }>(`/api/properties/${propertyId}/media`, opt);
        added.push(r.media);
      }
      setMedia([...media, ...added]);
    } catch (err) {
      toast(String((err as Error).message), 'err');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }
  async function del(id: number) {
    try {
      await api(`/api/properties/${propertyId}/media/${id}`, { method: 'DELETE' });
      setMedia(media.filter((m) => m.id !== id));
    } catch (err) { toast(String((err as Error).message), 'err'); }
  }
  return (
    <div>
      <div className="thumbs">
        {media.map((m) => (
          <div className="thumb" key={m.id}>
            <img src={mediaUrl(m.r2_key)} alt="" />
            <Button variant="ghost" size="icon" className="x" onClick={() => del(m.id)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
        {media.length === 0 && <span className="muted small">Sin fotos todavía.</span>}
      </div>
      <label className="btn ghost file">
        {busy ? 'Subiendo…' : '+ Agregar fotos'}
        <input type="file" accept="image/*" multiple onChange={onFiles} hidden />
      </label>
    </div>
  );
}

const emptyForm = {
  title: '', operation: 'alquiler', kind: 'departamento', price: '', currency: 'ARS', price_period: '',
  rooms: '', bathrooms: '', area_m2: '', capacity: '', available_from: '', available_until: '',
  address: '', city: '', province: '', description: '', external_url: '',
};

// Alta de propiedad (campos) → luego fotos + publicar.
export type InitialLoc = { lat: number; lng: number; city?: string; province?: string; address?: string };

export function PropertyForm({ scope, branches, edit, initial, onClose, onSaved }: {
  scope: 'agency' | 'particular'; branches?: Branch[]; edit?: Property; initial?: InitialLoc; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState(() => {
    const base = initForm(edit);
    return !edit && initial ? { ...base, city: initial.city || '', province: initial.province || '', address: initial.address || '' } : base;
  });
  const [latLng, setLatLng] = useState<{ lat: number | null; lng: number | null }>(() =>
    edit ? { lat: edit.lat, lng: edit.lng } : initial ? { lat: initial.lat, lng: initial.lng } : { lat: null, lng: null });
  const [branchId, setBranchId] = useState(edit?.branch_id != null ? String(edit.branch_id) : '');
  // Propietario: el contacto del CRM que dejó la propiedad en consignación. Es lo que
  // conecta la ficha del cliente con sus propiedades, sus ingresos y sus gastos.
  const [ownerClientId, setOwnerClientId] = useState(edit?.owner_client_id != null ? String(edit.owner_client_id) : '');
  const [owners, setOwners] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    if (scope !== 'agency') return;
    api<{ clients: { id: number; name: string; kind: string }[] }>('/api/clients')
      .then((r) => setOwners(r.clients.filter((x) => x.kind === 'propietario').map(({ id, name }) => ({ id, name }))))
      .catch(() => {});
  }, [scope]);
  const [amenities, setAmenities] = useState<string[]>(() => parseAmenities(edit?.amenities));
  const toggleAmen = (k: string) => setAmenities((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const [created, setCreated] = useState<number | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [busy, setBusy] = useState(false);
  const [creatingKind, setCreatingKind] = useState(false);
  const set = (k: keyof typeof emptyForm, v: string) => setF((s) => ({ ...s, [k]: v }));
  const close = () => { onSaved(); onClose(); };

  const commonBody = () => ({
    title: f.title, operation: f.operation, kind: f.kind, description: f.description,
    price: Number(f.price) || null, currency: f.currency, price_period: f.price_period, rooms: Number(f.rooms) || null,
    bathrooms: Number(f.bathrooms) || null, area_m2: Number(f.area_m2) || null, capacity: Number(f.capacity) || null,
    available_from: f.available_from || null, available_until: f.available_until || null,
    address: f.address, city: f.city, province: f.province, external_url: f.external_url.trim() || null,
    branch_id: branchId ? Number(branchId) : null, amenities,
    owner_client_id: ownerClientId ? Number(ownerClientId) : null,
  });

  // Si no hay coordenadas (no vino del mapa) pero hay dirección/ciudad, geocodifico (Nominatim).
  async function resolveCoords(): Promise<{ lat: number | null; lng: number | null }> {
    if (latLng.lat != null && latLng.lng != null) return latLng;
    if (!f.address && !f.city) return latLng;
    const q = [f.address, f.city, f.province, 'Argentina'].filter(Boolean).join(', ');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'es' } });
      const j = await r.json();
      if (j && j[0]) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
    } catch { /* best-effort */ }
    return latLng;
  }

  async function save() {
    if (!edit) return;
    if (!f.title.trim()) return toast('Falta el título', 'err');
    setBusy(true);
    try {
      const coords = await resolveCoords();
      await api(`/api/properties/${edit.id}`, { method: 'PATCH', body: JSON.stringify({ ...commonBody(), lat: coords.lat, lng: coords.lng }) });
      onSaved(); onClose();
    } catch (e) { toast(String((e as Error).message), 'err'); } finally { setBusy(false); }
  }

  async function create() {
    if (!f.title.trim()) return toast('Falta el título', 'err');
    setBusy(true);
    try {
      const coords = await resolveCoords();
      const r = await api<{ property: { id: number } }>('/api/properties', {
        method: 'POST',
        body: JSON.stringify({
          ...f, price: Number(f.price) || null, rooms: Number(f.rooms) || null,
          bathrooms: Number(f.bathrooms) || null, area_m2: Number(f.area_m2) || null, scope,
          branch_id: branchId ? Number(branchId) : null, amenities,
          lat: coords.lat, lng: coords.lng,
        }),
      });
      setCreated(r.property.id);
      // El propietario es un encargo (`mandates`), no una columna: se asigna con un PATCH
      // después de crear, porque recién ahí existe el id de la propiedad.
      if (ownerClientId) {
        try {
          await api(`/api/properties/${r.property.id}`, { method: 'PATCH', body: JSON.stringify({ owner_client_id: Number(ownerClientId) }) });
        } catch { /* no bloquea el alta: se puede asignar después desde Editar */ }
      }
    } catch (e) { toast(String((e as Error).message), 'err'); } finally { setBusy(false); }
  }
  async function publishAndClose(pub: boolean) {
    try {
      if (created && pub) await api(`/api/properties/${created}`, { method: 'PATCH', body: JSON.stringify({ published: true }) });
    } catch (e) { toast(String((e as Error).message), 'err'); }
    close();
  }

  return (
    <Modal title={edit ? 'Editar propiedad' : created ? 'Fotos y publicación' : 'Nueva propiedad'} onClose={close}>
      {edit || created === null ? (
        <div className="form">
          <input placeholder="Título del aviso" value={f.title} onChange={(e) => set('title', e.target.value)} />
          {scope === 'agency' && branches && branches.length > 0 && (
            <Select value={branchId || NONE} onValueChange={(v) => setBranchId(v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Sin sucursal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin sucursal</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {/* Propietario: conecta esta propiedad con su ficha de contacto (ingresos, gastos). */}
          {scope === 'agency' && owners.length > 0 && (
            <label className="fld">
              <span className="fld-lbl">Propietario</span>
              <Select value={ownerClientId || NONE} onValueChange={(v) => setOwnerClientId(v === NONE ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Sin propietario asignado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin propietario asignado</SelectItem>
                  {owners.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
          )}
          <div className="row2">
            <Select value={f.operation} onValueChange={(v) => set('operation', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alquiler">Alquiler</SelectItem>
                <SelectItem value="venta">Venta</SelectItem>
                <SelectItem value="temporario">Temporario</SelectItem>
              </SelectContent>
            </Select>
            <Select value={f.kind} onValueChange={(v) => (v === NEW_KIND ? setCreatingKind(true) : set('kind', v))}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                {/* Si el valor actual (dato viejo o importado de Argenprop) no está en la
                    lista, se agrega como opción extra para que no se pierda de la vista. */}
                {f.kind && !PROPERTY_KINDS.some((k) => k.v === f.kind) && <SelectItem value={f.kind}>{f.kind}</SelectItem>}
                {PROPERTY_KINDS.map((k) => <SelectItem key={k.v} value={k.v}>{k.label}</SelectItem>)}
                <SelectItem value={NEW_KIND} className="select-new">+ Agregar tipo nuevo…</SelectItem>
              </SelectContent>
            </Select>
            {creatingKind && (
              <AskModal
                title="Nuevo tipo de propiedad" label="Ej: Quinta, Oficina, Cochera…" placeholder="Tipo" cta="Crear"
                onSubmit={(v) => { set('kind', v); setCreatingKind(false); }}
                onClose={() => setCreatingKind(false)}
              />
            )}
          </div>
          <div className="row2">
            <input type="number" placeholder="Precio" value={f.price} onChange={(e) => set('price', e.target.value)} />
            <Select value={f.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
            </Select>
            <Select value={f.price_period || NONE} onValueChange={(v) => set('price_period', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRICE_PERIODS.map((p) => <SelectItem key={p.v || NONE} value={p.v || NONE}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="row2">
            <input type="number" placeholder="🛏 Ambientes" value={f.rooms} onChange={(e) => set('rooms', e.target.value)} />
            <input type="number" placeholder="🚿 Baños" value={f.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
            <input type="number" placeholder="👥 Personas" value={f.capacity} onChange={(e) => set('capacity', e.target.value)} />
            <input type="number" placeholder="m²" value={f.area_m2} onChange={(e) => set('area_m2', e.target.value)} />
          </div>
          <div className="row2">
            <label className="date-lbl">Disponible desde<input type="date" value={f.available_from} onChange={(e) => set('available_from', e.target.value)} /></label>
            <label className="date-lbl">hasta<input type="date" value={f.available_until} onChange={(e) => set('available_until', e.target.value)} /></label>
          </div>
          <div>
            <p className="muted small" style={{ margin: '2px 0 6px' }}>Comodidades</p>
            <div className="amen-pick">
              {AMENITIES.map((a) => (
                <button type="button" key={a.key} className={amenities.includes(a.key) ? 'amen-opt on' : 'amen-opt'} onClick={() => toggleAmen(a.key)}>{a.icon} {a.label}</button>
              ))}
            </div>
          </div>
          <input placeholder="Dirección" value={f.address} onChange={(e) => set('address', e.target.value)} />
          <div className="row2">
            <input placeholder="Ciudad" value={f.city} onChange={(e) => set('city', e.target.value)} />
            <input placeholder="Provincia" value={f.province} onChange={(e) => set('province', e.target.value)} />
          </div>
          <div>
            <p className="muted small" style={{ margin: '2px 0 6px' }}>Ubicación en el mapa</p>
            <LocationPicker lat={latLng.lat} lng={latLng.lng} address={f.address} city={f.city} province={f.province}
              onChange={(lat, lng) => setLatLng({ lat, lng })} />
          </div>
          <textarea placeholder="Descripción" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} />
          <div>
            <input placeholder="Link del aviso en el sitio de El Muelle" value={f.external_url} onChange={(e) => set('external_url', e.target.value)} />
            <p className="muted small" style={{ margin: '4px 0 0' }}>Es lo que se manda cuando compartís la propiedad por WhatsApp desde el Inventario.</p>
          </div>
          <Button disabled={busy} onClick={edit ? save : create}>{busy ? 'Guardando…' : edit ? 'Guardar cambios' : 'Crear propiedad'}</Button>
        </div>
      ) : (
        <div className="form">
          <p className="muted small">Propiedad creada. Subí fotos y publicá cuando quieras.</p>
          <PhotoStrip propertyId={created} media={media} setMedia={setMedia} />
          <div className="row2">
            <Button onClick={() => publishAndClose(true)}>Publicar</Button>
            <Button variant="outline" onClick={() => publishAndClose(false)}>Guardar borrador</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Gestión de fotos + publicar de una propiedad existente.
export function PhotoManager({ property, onClose, onSaved }: { property: Property; onClose: () => void; onSaved: () => void }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [published, setPublished] = useState(!!property.published);
  const close = () => { onSaved(); onClose(); };
  useEffect(() => {
    api<{ media: Media[] }>(`/api/properties/${property.id}/media`).then((r) => setMedia(r.media)).catch(() => {});
  }, [property.id]);
  async function togglePublish() {
    const np = !published;
    try {
      await api(`/api/properties/${property.id}`, { method: 'PATCH', body: JSON.stringify({ published: np }) });
      setPublished(np);
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  return (
    <Modal title={property.title} onClose={close}>
      <div className="form">
        <PhotoStrip propertyId={property.id} media={media} setMedia={setMedia} />
        <label className="row"><input type="checkbox" checked={published} onChange={togglePublish} /> Publicada en el marketplace</label>
        <Button onClick={close}>Listo</Button>
      </div>
    </Modal>
  );
}
