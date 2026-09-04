import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { money, type Client, type Match } from '../lib/types';
import { prefsSummary } from '../lib/prefs';
import { Modal } from './property-form';
import { toast } from '../lib/toast';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';
import { ClientDetailView } from './client-detail';

const ALL = '_all';

// CRM: contactos (interesados + propietarios) + cruce interesado→propiedades.
export function ClientsPanel() {
  const confirm = useConfirm();
  const [clients, setClients] = useState<Client[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [matchFor, setMatchFor] = useState<Client | null>(null);
  /** Contacto abierto en ficha completa (reemplaza la lista). */
  const [openId, setOpenId] = useState<number | null>(null);

  const load = () => api<{ clients: Client[] }>('/api/clients').then((r) => setClients(r.clients)).catch(() => {});
  useEffect(() => { load(); }, []);

  if (openId != null) {
    const cl = clients.find((x) => x.id === openId);
    return (
      <>
        <ClientDetailView
          clientId={openId}
          onBack={() => setOpenId(null)}
          onMatches={() => cl && setMatchFor(cl)}
        />
        {matchFor && <MatchesModal client={matchFor} onClose={() => setMatchFor(null)} />}
      </>
    );
  }

  return (
    <div>
      <div className="panel-head">
        <h3>Contactos y clientes · {clients.length}</h3>
        <button className="btn" onClick={() => setShowNew(true)}>Nuevo contacto</button>
      </div>
      {clients.length === 0 ? (
        <p className="muted">Todavía no cargaste contactos. Sumá propietarios en consignación e interesados.</p>
      ) : (
        <div className="client-list">
          {clients.map((cl) => (
            <div className="client-card" key={cl.id}>
              {/* Abre la ficha completa. Es un botón (no la card entera) para no tragarse
                  los clicks de "Ver coincidencias" y "Eliminar" que están al lado. */}
              <div
                className="client-main client-open"
                role="button"
                tabIndex={0}
                title="Ver ficha completa"
                onClick={() => setOpenId(cl.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(cl.id); } }}
              >
                <div className="client-name">{cl.name} <span className={cl.kind === 'propietario' ? 'chip' : 'chip ok'}>{cl.kind}</span></div>
                <div className="muted small">{[cl.phone, cl.email].filter(Boolean).join(' · ') || 'Sin contacto'}</div>
                {cl.kind === 'interesado' && <div className="muted small">Busca: {prefsSummary(cl.prefs)}</div>}
              </div>
              <div className="client-actions">
                {cl.kind === 'interesado' && <Button variant="outline" size="sm" onClick={() => setMatchFor(cl)}>Ver coincidencias</Button>}
                <Button
                  variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={async () => { if (await confirm(`¿Eliminar a ${cl.name}?`, { destructive: true, confirmLabel: 'Eliminar' })) { await api(`/api/clients/${cl.id}`, { method: 'DELETE' }); load(); } }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showNew && <ClientForm onClose={() => setShowNew(false)} onSaved={load} />}
      {matchFor && <MatchesModal client={matchFor} onClose={() => setMatchFor(null)} />}
    </div>
  );
}

function ClientForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<'interesado' | 'propietario'>('interesado');
  const [f, setF] = useState({ name: '', email: '', phone: '', notes: '', operation: '', city: '', capacity: '', max_price: '', currency: 'ARS', min_rooms: '' });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  async function save() {
    if (!f.name.trim()) return toast('Falta el nombre', 'err');
    try {
      await api('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          kind, name: f.name, email: f.email, phone: f.phone, notes: f.notes,
          operation: f.operation, city: f.city,
          capacity: f.capacity ? Number(f.capacity) : undefined,
          max_price: f.max_price ? Number(f.max_price) : undefined,
          currency: f.max_price ? f.currency : undefined,
          min_rooms: f.min_rooms ? Number(f.min_rooms) : undefined,
        }),
      });
      onSaved(); onClose();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  return (
    <Modal title="Nuevo contacto" onClose={onClose}>
      <div className="form">
        <div className="seg">
          <button className={kind === 'interesado' ? 'on' : ''} onClick={() => setKind('interesado')}>Interesado</button>
          <button className={kind === 'propietario' ? 'on' : ''} onClick={() => setKind('propietario')}>Propietario</button>
        </div>
        <input placeholder="Nombre y apellido" value={f.name} onChange={(e) => set('name', e.target.value)} />
        <div className="row2">
          <input placeholder="Teléfono" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
          <input placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        {kind === 'interesado' && (
          <>
            <p className="muted small">¿Qué busca? (para cruzar con las propiedades)</p>
            <div className="row2">
              <Select value={f.operation || ALL} onValueChange={(v) => set('operation', v === ALL ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Cualquier operación</SelectItem>
                  <SelectItem value="alquiler">Alquiler</SelectItem>
                  <SelectItem value="venta">Venta</SelectItem>
                  <SelectItem value="temporario">Temporario</SelectItem>
                </SelectContent>
              </Select>
              <input placeholder="Ciudad" value={f.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="row2">
              <input type="number" min={1} placeholder="👥 Personas" title="Cuántos duermen: el cruce trae las que entren esa cantidad o más" value={f.capacity} onChange={(e) => set('capacity', e.target.value)} />
              <input type="number" min={1} placeholder="Ambientes mín" value={f.min_rooms} onChange={(e) => set('min_rooms', e.target.value)} />
            </div>
            <div className="row2">
              <input type="number" placeholder="Presupuesto máx" value={f.max_price} onChange={(e) => set('max_price', e.target.value)} />
              <Select value={f.currency} onValueChange={(v) => set('currency', v)}>
                <SelectTrigger title="Moneda del presupuesto"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">$ ARS</SelectItem>
                  <SelectItem value="USD">US$</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        <textarea placeholder="Notas" rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        <button className="btn" onClick={save}>Guardar contacto</button>
      </div>
    </Modal>
  );
}

/** DD/MM: el ISO es formato de máquina (misma regla que la lista de reservas). */
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function MatchesModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  useEffect(() => {
    api<{ matches: Match[] }>(`/api/clients/${client.id}/matches`).then((r) => setMatches(r.matches)).catch(() => setMatches([]));
  }, [client.id]);
  const criterios = prefsSummary(client.prefs);
  return (
    <Modal title={`Coincidencias para ${client.name}`} onClose={onClose}>
      {/* Los criterios a la vista: sin esto, un cruce vacío no dice si falta cartera o
          si las preferencias cargadas no son las que uno cree. */}
      <p className="muted small">Busca: {criterios}</p>
      {matches === null ? <p className="muted">Buscando…</p> : matches.length === 0 ? (
        <p className="muted">Ninguna propiedad de la cartera cumple esos criterios. Probá ampliarlos.</p>
      ) : (
        <div className="match-list">
          {matches.map((m) => (
            <div className="match-row" key={m.id}>
              <div className="match-main">
                <div className="match-title">
                  <b>{m.title}</b>
                  {m.status && m.status !== 'disponible' && <span className="chip">{m.status}</span>}
                </div>
                <div className="muted small">
                  {[m.operation, m.city, m.capacity ? `👥 ${m.capacity}` : null, m.rooms ? `${m.rooms} amb` : null].filter(Boolean).join(' · ')}
                  {/* "Reservada" no es "no se la ofrezcas": son fechas. Mostrarlas evita
                      descartar una casa que está libre justo cuando el cliente la quiere. */}
                  {m.busy_from && m.busy_to ? ` · ocupada ${dm(m.busy_from)}–${dm(m.busy_to)}` : ''}
                </div>
              </div>
              <b className="match-price">{money(m.price, m.currency)}</b>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
