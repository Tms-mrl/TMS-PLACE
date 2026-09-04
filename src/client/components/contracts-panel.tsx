import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { money, type Client, type Contract, type Property, type Receipt } from '../lib/types';
import { toast } from '../lib/toast';
import { Modal } from './property-form';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';

const NONE = '_none';

const STATUS_LABEL: Record<string, string> = { activo: 'Activo', vencido: 'Vencido', rescindido: 'Rescindido', finalizado: 'Finalizado' };
const STATUS_LIST = ['activo', 'vencido', 'rescindido', 'finalizado'];

function daysTo(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00'); if (isNaN(+d)) return null;
  return Math.round((+d - Date.now()) / 86400000);
}

// Contratos y recibos. scope='agency' usa el CRM (cliente); 'particular' usa texto libre.
export function ContractsPanel({ scope }: { scope: 'agency' | 'particular' }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Contract[]>([]);
  const [props, setProps] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [receiptsOf, setReceiptsOf] = useState<Contract | null>(null);

  const load = () => api<{ contracts: Contract[] }>('/api/contracts').then((r) => setItems(r.contracts)).catch(() => {});
  useEffect(() => {
    load();
    api<{ properties: Property[] }>('/api/properties/mine').then((r) => setProps(r.properties)).catch(() => {});
    if (scope === 'agency') api<{ clients: Client[] }>('/api/clients').then((r) => setClients(r.clients)).catch(() => {});
  }, [scope]);

  async function setStatus(ct: Contract, status: string) {
    try { await api(`/api/contracts/${ct.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function del(ct: Contract) {
    if (!(await confirm('¿Eliminar este contrato y sus recibos? No se puede deshacer.', { destructive: true, confirmLabel: 'Eliminar' }))) return;
    try { await api(`/api/contracts/${ct.id}`, { method: 'DELETE' }); load(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }

  const active = items.filter((c) => c.status === 'activo');
  return (
    <div>
      <div className="panel-head">
        <h3>Contratos · {active.length} activo{active.length === 1 ? '' : 's'}</h3>
        <button className="btn" onClick={() => setShowNew(true)}>Nuevo contrato</button>
      </div>
      {items.length === 0 && <p className="muted">Todavía no cargaste contratos. Registrá un alquiler o venta para llevar vencimientos, aumentos y recibos.</p>}
      <div className="contract-list">
        {items.map((ct) => {
          const dl = daysTo(ct.end_date);
          const overdue = ct.status === 'activo' && dl != null && dl < 0;
          const soon = ct.status === 'activo' && dl != null && dl >= 0 && dl <= 30;
          return (
            <div className="contract-card" key={ct.id}>
              <div className="ct-main">
                <div className="ct-title">{ct.property_title || '(sin propiedad)'} <span className={`chip ${ct.status === 'activo' ? 'ok' : 'muted'}`}>{STATUS_LABEL[ct.status]}</span></div>
                <div className="muted small">
                  {ct.operation === 'venta' ? '🏷️ Venta' : '🔑 Alquiler'} · {ct.client_name || 'Sin inquilino'}{ct.client_phone ? ` · ${ct.client_phone}` : ''}
                </div>
                <div className="ct-facts">
                  <span>{money(ct.amount, ct.currency)}{ct.operation === 'alquiler' ? '/mes' : ''}</span>
                  {ct.deposit != null && <span>Depósito {money(ct.deposit, ct.currency)}</span>}
                  {ct.adjust_months && <span>Ajusta c/{ct.adjust_months}m{ct.adjust_index ? ` (${ct.adjust_index})` : ''}</span>}
                  {ct.end_date && <span className={overdue ? 'ct-over' : soon ? 'ct-soon' : ''}>Vence {ct.end_date}{overdue ? ' · vencido' : soon ? ` · en ${dl}d` : ''}</span>}
                  <span>💵 Cobrado {money(ct.paid_total, ct.currency)}</span>
                </div>
              </div>
              <div className="ct-actions">
                <Button variant="ghost" size="sm" onClick={() => setReceiptsOf(ct)}>Recibos ({ct.receipts_count})</Button>
                <Select value={ct.status} onValueChange={(v) => setStatus(ct, v)}>
                  <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="icon" title="Editar" onClick={() => setEditing(ct)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Eliminar" onClick={() => del(ct)} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
      {(showNew || editing) && (
        <ContractForm scope={scope} props={props} clients={clients} edit={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); load(); }} />
      )}
      {receiptsOf && <ReceiptsModal contract={receiptsOf} onClose={() => setReceiptsOf(null)} onChanged={load} />}
    </div>
  );
}

function ContractForm({ scope, props, clients, edit, onClose, onSaved }: {
  scope: 'agency' | 'particular'; props: Property[]; clients: Client[]; edit: Contract | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState({
    property_id: edit?.property_id ? String(edit.property_id) : '',
    client_id: edit?.client_id ? String(edit.client_id) : '',
    tenant_name: edit?.tenant_name || '', tenant_phone: edit?.tenant_phone || '',
    operation: edit?.operation || 'alquiler', amount: edit?.amount != null ? String(edit.amount) : '',
    currency: edit?.currency || 'ARS', deposit: edit?.deposit != null ? String(edit.deposit) : '',
    start_date: edit?.start_date || '', end_date: edit?.end_date || '',
    adjust_months: edit?.adjust_months != null ? String(edit.adjust_months) : '', adjust_index: edit?.adjust_index || '',
    notes: edit?.notes || '',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  async function save() {
    const payload = {
      property_id: f.property_id ? Number(f.property_id) : null,
      client_id: scope === 'agency' && f.client_id ? Number(f.client_id) : null,
      tenant_name: f.tenant_name || null, tenant_phone: f.tenant_phone || null,
      operation: f.operation, amount: f.amount ? Number(f.amount) : null, currency: f.currency,
      deposit: f.deposit ? Number(f.deposit) : null, start_date: f.start_date || null, end_date: f.end_date || null,
      adjust_months: f.adjust_months ? Number(f.adjust_months) : null, adjust_index: f.adjust_index || null, notes: f.notes || null,
    };
    try {
      if (edit) await api(`/api/contracts/${edit.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await api('/api/contracts', { method: 'POST', body: JSON.stringify(payload) });
      onSaved();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  return (
    <Modal title={edit ? 'Editar contrato' : 'Nuevo contrato'} onClose={onClose}>
      <div className="form">
        <Select value={f.property_id || NONE} onValueChange={(v) => set('property_id', v === NONE ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Propiedad (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Propiedad (opcional)</SelectItem>
            {props.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {scope === 'agency'
          ? <Select value={f.client_id || NONE} onValueChange={(v) => set('client_id', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Inquilino / comprador (del CRM)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Inquilino / comprador (del CRM)</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          : <div className="row2"><input placeholder="Inquilino / comprador" value={f.tenant_name} onChange={(e) => set('tenant_name', e.target.value)} /><input placeholder="Teléfono" value={f.tenant_phone} onChange={(e) => set('tenant_phone', e.target.value)} /></div>}
        <div className="row2">
          <Select value={f.operation} onValueChange={(v) => set('operation', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="alquiler">Alquiler</SelectItem><SelectItem value="venta">Venta</SelectItem></SelectContent>
          </Select>
          <Select value={f.currency} onValueChange={(v) => set('currency', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="row2">
          <input type="number" placeholder={f.operation === 'venta' ? 'Monto total' : 'Monto mensual'} value={f.amount} onChange={(e) => set('amount', e.target.value)} />
          <input type="number" placeholder="Depósito / garantía" value={f.deposit} onChange={(e) => set('deposit', e.target.value)} />
        </div>
        <div className="row2">
          <label className="fld"><span>Inicio</span><input type="date" value={f.start_date} onChange={(e) => set('start_date', e.target.value)} /></label>
          <label className="fld"><span>Vencimiento</span><input type="date" value={f.end_date} onChange={(e) => set('end_date', e.target.value)} /></label>
        </div>
        {f.operation === 'alquiler' && (
          <div className="row2">
            <input type="number" placeholder="Ajusta cada (meses)" value={f.adjust_months} onChange={(e) => set('adjust_months', e.target.value)} />
            <input placeholder="Índice (ICL, IPC, %…)" value={f.adjust_index} onChange={(e) => set('adjust_index', e.target.value)} />
          </div>
        )}
        <textarea placeholder="Notas" rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        <button className="btn" onClick={save}>{edit ? 'Guardar cambios' : 'Crear contrato'}</button>
      </div>
    </Modal>
  );
}

function ReceiptsModal({ contract, onClose, onChanged }: { contract: Contract; onClose: () => void; onChanged: () => void }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState(contract.amount != null ? String(contract.amount) : '');
  const [method, setMethod] = useState('efectivo');
  const [paid, setPaid] = useState(true);

  const load = () => api<{ receipts: Receipt[] }>(`/api/contracts/${contract.id}/receipts`).then((r) => setReceipts(r.receipts)).catch(() => {});
  useEffect(() => { load(); }, [contract.id]);

  async function add() {
    if (!amount) { toast('Ingresá el monto', 'err'); return; }
    const today = new Date().toISOString().slice(0, 10);
    try {
      await api(`/api/contracts/${contract.id}/receipts`, { method: 'POST', body: JSON.stringify({ period: period || null, amount: Number(amount), currency: contract.currency, paid_at: paid ? today : null, method }) });
      setPeriod(''); load(); onChanged();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function del(r: Receipt) {
    try { await api(`/api/contracts/receipts/${r.id}`, { method: 'DELETE' }); load(); onChanged(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }

  return (
    <Modal title={`Recibos · ${contract.property_title || 'contrato'}`} onClose={onClose}>
      <div className="form">
        <div className="row2">
          <input placeholder="Período (2026-07, seña…)" value={period} onChange={(e) => setPeriod(e.target.value)} />
          <input type="number" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="row2">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          <label className="chk"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Cobrado</label>
        </div>
        <Button size="sm" onClick={add}>+ Registrar recibo</Button>
      </div>
      <div className="receipt-list">
        {receipts.length === 0 && <p className="muted small">Sin recibos todavía.</p>}
        {receipts.map((r) => (
          <div className="receipt-row" key={r.id}>
            <span>{r.period || '—'}</span>
            <span>{money(r.amount, r.currency)}</span>
            <span className={r.paid_at ? 'chip ok' : 'chip muted'}>{r.paid_at ? `Cobrado ${r.paid_at}` : 'Pendiente'}</span>
            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => del(r)} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
