import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Radix no permite value="" en un Item: se usa un centinela que nunca viaja al backend.
const ALL = '_all';

// Pestaña "Registro": quién cambió qué y cuándo (ver worker/lib/activity.ts). Solo lectura.
// Las ediciones muestran "campo: antes → después"; los borrados guardan una copia de lo que
// se eliminó (botón "Ver copia") para poder reconstrucción a mano si fue un error.

type Item = {
  id: number; created_at: string; user_id: number | null; user_label: string | null; action: string;
  entity: string | null; entity_id: number | null; summary: string; changes: string | null; body: string | null; has_snapshot: number;
};
type Resp = { items: Item[]; next: number | null; users: { user_id: number; user_label: string }[] };

const ENTITIES: [string, string][] = [
  ['', 'Todo'], ['properties', 'Propiedades'], ['bookings', 'Reservas'], ['property_season_prices', 'Tarifas'], ['property_media', 'Fotos'],
  ['clients', 'Contactos'], ['deals', 'Operaciones'], ['contracts', 'Contratos'], ['expenses', 'Gastos'], ['agency_members', 'Equipo'],
];
const ACTIONS: [string, string][] = [['', 'Cualquier acción'], ['create', 'Creó'], ['update', 'Editó'], ['delete', 'Eliminó'], ['other', 'Otras']];
const CHIP: Record<string, string> = { create: 'ok', update: '', delete: 'err', other: '' };

const FIELD: Record<string, string> = {
  title: 'título', price: 'precio', currency: 'moneda', description: 'descripción', address: 'dirección', city: 'ciudad', province: 'provincia',
  code: 'código', external_url: 'link del aviso', capacity: 'personas', rooms: 'ambientes', bathrooms: 'baños', area_m2: 'm²', kind: 'tipo',
  operation: 'operación', operation_secondary: 'operación secundaria', status: 'estado', published: 'publicada', branch_id: 'sucursal',
  from_date: 'desde', to_date: 'hasta', name: 'nombre', phone: 'teléfono', email: 'email', amount: 'monto', available_from: 'disponible desde',
  available_until: 'disponible hasta', amenities: 'comodidades', lat: 'latitud', lng: 'longitud', archived_at: 'archivada',
};
const show = (v: unknown) => (v == null || v === '' ? '—' : String(v));
const when = (s: string) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export function ActivityPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<Resp['users']>([]);
  const [next, setNext] = useState<number | null>(null);
  const [f, setF] = useState({ entity: '', action: '', user: '', q: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [snap, setSnap] = useState<{ id: number; json: string } | null>(null);

  function load(before?: number) {
    const p = new URLSearchParams({ limit: '50' });
    if (before) p.set('before', String(before));
    for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
    setLoading(true);
    api<Resp>(`/api/activity?${p}`)
      .then((r) => { setItems((prev) => (before ? [...prev, ...r.items] : r.items)); setNext(r.next); setUsers(r.users); setErr(''); })
      .catch((e) => setErr(String((e as Error).message)))
      .finally(() => setLoading(false));
  }
  useEffect(() => { const t = setTimeout(() => load(), f.q ? 300 : 0); return () => clearTimeout(t); }, [f.entity, f.action, f.user, f.q]);

  async function openSnapshot(id: number) {
    try {
      const r = await api<{ snapshot: unknown }>(`/api/activity/${id}/snapshot`);
      setSnap({ id, json: JSON.stringify(r.snapshot, null, 2) });
    } catch (e) { setErr(String((e as Error).message)); }
  }

  return (
    <div>
      <div className="panel-head"><h3>Registro de actividad</h3></div>
      <p className="muted small" style={{ marginTop: 0 }}>Todo lo que cambia el equipo en el panel: quién, qué y cuándo. Los borrados guardan una copia de lo eliminado.</p>
      <div className="filters pfilters">
        <Select value={f.entity || ALL} onValueChange={(v) => setF({ ...f, entity: v === ALL ? '' : v })}>
          <SelectTrigger className="w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>{ENTITIES.map(([v, l]) => <SelectItem key={v || ALL} value={v || ALL}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={f.action || ALL} onValueChange={(v) => setF({ ...f, action: v === ALL ? '' : v })}>
          <SelectTrigger className="w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>{ACTIONS.map(([v, l]) => <SelectItem key={v || ALL} value={v || ALL}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={f.user || ALL} onValueChange={(v) => setF({ ...f, user: v === ALL ? '' : v })}>
          <SelectTrigger className="w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los usuarios</SelectItem>
            {users.map((u) => <SelectItem key={u.user_id} value={String(u.user_id)}>{u.user_label}</SelectItem>)}
          </SelectContent>
        </Select>
        <input placeholder="Buscar (ej. nombre de propiedad)" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} style={{ minWidth: 240 }} />
      </div>
      {err && <p className="muted">{err}</p>}
      {!loading && !items.length && !err && <p className="muted">Todavía no hay actividad registrada con esos filtros.</p>}
      <div className="client-list">
        {items.map((it) => {
          const ch = it.changes ? (JSON.parse(it.changes) as Record<string, [unknown, unknown]>) : null;
          return (
            <div className="client-card" key={it.id} style={{ alignItems: 'flex-start' }}>
              <div className="client-main">
                <div className="client-name"><span className={`chip ${CHIP[it.action] || ''}`}>{ACTIONS.find((a) => a[0] === it.action)?.[1] || it.action}</span> {it.summary} <span className="muted">· por <b>{(it.user_label || 'Usuario').replace(/\s*<.*>$/, '')}</b></span></div>
                <div className="muted small">{when(it.created_at)}</div>
                {ch && (
                  <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {Object.entries(ch).map(([k, [a, b]]) => (
                      <li key={k}><b>{FIELD[k] || k}</b>: <span className="muted">{show(a)}</span> → {show(b)}</li>
                    ))}
                  </ul>
                )}
              </div>
              {it.has_snapshot ? <div className="client-actions"><Button variant="outline" size="sm" onClick={() => openSnapshot(it.id)}>Ver copia</Button></div> : null}
            </div>
          );
        })}
      </div>
      {next && <Button variant="outline" style={{ marginTop: 12 }} disabled={loading} onClick={() => load(next)}>{loading ? 'Cargando…' : 'Ver más'}</Button>}
      {snap && (
        <div className="panel-lite" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0 }}>Copia de lo eliminado (#{snap.id})</h4>
            <Button variant="ghost" size="sm" onClick={() => setSnap(null)}>Cerrar</Button>
          </div>
          <pre style={{ maxHeight: 360, overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap' }}>{snap.json}</pre>
        </div>
      )}
    </div>
  );
}
