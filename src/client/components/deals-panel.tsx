import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { money, type Client, type Deal, type Property } from '../lib/types';
import { toast } from '../lib/toast';
import { Modal } from './property-form';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';

const NONE = '_none';

const ACTIVE = ['visita', 'oferta', 'reserva', 'firma'];
const LABEL: Record<string, string> = { visita: 'Visita', oferta: 'Oferta', reserva: 'Reserva', firma: 'Firma', cerrada: 'Cerrada', perdida: 'Perdida' };

// Pipeline de operaciones (kanban): visita → oferta → reserva → firma → cerrada/perdida.
export function DealsPanel() {
  const confirm = useConfirm();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [props, setProps] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showNew, setShowNew] = useState(false);

  const load = () => api<{ deals: Deal[] }>('/api/deals').then((r) => setDeals(r.deals)).catch(() => {});
  useEffect(() => {
    load();
    api<{ properties: Property[] }>('/api/properties/mine').then((r) => setProps(r.properties)).catch(() => {});
    api<{ clients: Client[] }>('/api/clients').then((r) => setClients(r.clients)).catch(() => {});
  }, []);

  async function move(d: Deal, stage: string) {
    try { await api(`/api/deals/${d.id}`, { method: 'PATCH', body: JSON.stringify({ stage }) }); load(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function del(d: Deal) {
    if (!(await confirm('¿Eliminar esta operación? No se puede deshacer.', { destructive: true, confirmLabel: 'Eliminar' }))) return;
    try { await api(`/api/deals/${d.id}`, { method: 'DELETE' }); load(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }

  const closed = deals.filter((d) => d.stage === 'cerrada' || d.stage === 'perdida');
  const activeCount = deals.filter((d) => ACTIVE.includes(d.stage)).length;

  return (
    <div>
      <div className="panel-head">
        <h3>Operaciones · {activeCount} activa{activeCount === 1 ? '' : 's'}</h3>
        <button className="btn" onClick={() => setShowNew(true)}>Nueva operación</button>
      </div>
      {activeCount === 0 && closed.length === 0 && <p className="muted">Todavía no hay operaciones. Creá una desde “Nueva operación” (visita, oferta, etc.).</p>}
      <div className="kanban">
        {ACTIVE.map((st) => {
          const col = deals.filter((d) => d.stage === st);
          return (
            <div className="kcol" key={st}>
              <div className="kcol-h">{LABEL[st]} <span className="muted">{col.length}</span></div>
              {col.map((d) => <DealCard key={d.id} d={d} onMove={move} onDel={del} />)}
            </div>
          );
        })}
      </div>
      {closed.length > 0 && (
        <details className="closed-deals">
          <summary>Cerradas / perdidas ({closed.length})</summary>
          <div className="client-list" style={{ marginTop: 10 }}>
            {closed.map((d) => (
              <div className="client-card" key={d.id}>
                <div className="client-main">
                  <div className="client-name">{d.property_title || '(sin propiedad)'} <span className={d.stage === 'cerrada' ? 'chip ok' : 'chip blocked'}>{LABEL[d.stage]}</span></div>
                  <div className="muted small">{d.client_name || 'Sin cliente'}</div>
                </div>
                <div className="client-actions">
                  <Button variant="ghost" size="sm" onClick={() => move(d, 'visita')}>Reabrir</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => del(d)}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
      {showNew && <NewDealModal props={props} clients={clients} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

function DealCard({ d, onMove, onDel }: { d: Deal; onMove: (d: Deal, s: string) => void; onDel: (d: Deal) => void }) {
  const idx = ACTIVE.indexOf(d.stage);
  return (
    <div className="deal-card">
      <div className="deal-title">{d.property_title || '(sin propiedad)'}</div>
      <div className="muted small">{d.client_name ? `👤 ${d.client_name}${d.client_phone ? ' · ' + d.client_phone : ''}` : 'Sin cliente'}</div>
      {d.property_price != null && <div className="muted small">{money(d.property_price, d.property_currency || 'ARS')}</div>}
      {d.notes && <div className="deal-notes">{d.notes}</div>}
      <div className="deal-actions">
        <Button variant="ghost" size="icon" title="Etapa anterior" disabled={idx <= 0} onClick={() => onMove(d, ACTIVE[idx - 1]!)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" title="Etapa siguiente" disabled={idx >= ACTIVE.length - 1} onClick={() => onMove(d, ACTIVE[idx + 1]!)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => onMove(d, 'cerrada')}><Check className="h-4 w-4" />Cerrada</Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onMove(d, 'perdida')}><X className="h-4 w-4" />Perdida</Button>
        <Button variant="ghost" size="icon" title="Eliminar" onClick={() => onDel(d)} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function NewDealModal({ props, clients, onClose, onSaved }: { props: Property[]; clients: Client[]; onClose: () => void; onSaved: () => void }) {
  const [propId, setPropId] = useState('');
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  async function save() {
    try {
      await api('/api/deals', { method: 'POST', body: JSON.stringify({ property_id: propId ? Number(propId) : null, client_id: clientId ? Number(clientId) : null, notes, stage: 'visita' }) });
      onSaved();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  return (
    <Modal title="Nueva operación" onClose={onClose}>
      <div className="form">
        <Select value={propId || NONE} onValueChange={(v) => setPropId(v === NONE ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Propiedad (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Propiedad (opcional)</SelectItem>
            {props.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clientId || NONE} onValueChange={(v) => setClientId(v === NONE ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Cliente (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Cliente (opcional)</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <textarea placeholder="Notas (ej: visita el sábado 15hs)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className="btn" onClick={save}>Crear operación</button>
      </div>
    </Modal>
  );
}
