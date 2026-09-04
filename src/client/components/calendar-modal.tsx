import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { BOOKING_KINDS, type Booking, type Client, type Property } from '../lib/types';
import { toast } from '../lib/toast';
import { addCachedClient, cachedClients, loadClients } from '../lib/clients-cache';
import { Modal } from './property-form';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';

// Sentinels del <Select> (Radix no acepta value="") — nunca viajan al backend.
const NONE = '_none';

export const KIND_LABEL: Record<string, string> = { reserva: 'Reservada', alquiler: 'Alquilada' };

/** Reservas que el panel ya trae embebidas en cada propiedad (`/properties/mine`), en el
 *  mismo formato que devuelve el endpoint de reservas. Evita abrir el modal en blanco. */
function seedBookings(p: Property): Booking[] {
  try {
    const raw = JSON.parse(p.bookings || '[]') as {
      id?: number; f: string; t: string; k?: string; g?: string | null; ci?: number | null; c?: string | null;
    }[];
    return raw
      .filter((b) => b.id != null)
      .map((b) => ({
        id: b.id as number, from_date: b.f, to_date: b.t, kind: b.k || 'reserva',
        client_id: b.ci ?? null, client_name: b.c ?? null, client_phone: null,
        guest_name: b.g ?? null, notes: null,
      }))
      .sort((a, b) => a.from_date.localeCompare(b.from_date));
  } catch { return []; }
}

const pad = (n: number) => String(n).padStart(2, '0');
/** 'YYYY-MM-DD' → 'DD/MM/AAAA'. La base sigue guardando ISO; esto es solo para mostrar. */
export function fmtDay(iso: string): string {
  const [y, m, d] = (iso || '').split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/** Alta rápida de contacto sin salir del calendario (popup propio). Solo lo mínimo:
 *  el resto de la ficha se completa después desde Clientes. */
function NewClientModal({ onCreated, onClose }: { onCreated: (c: Client) => void; onClose: () => void }) {
  const [nf, setNf] = useState({ name: '', phone: '', email: '' });
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!nf.name.trim()) return toast('Poné el nombre del contacto', 'err');
    setBusy(true);
    try {
      const r = await api<{ client: Client }>('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: nf.name.trim(), phone: nf.phone.trim(), email: nf.email.trim(), kind: 'interesado' }),
      });
      onCreated(r.client);
      onClose();
    } catch (e) { toast(String((e as Error).message), 'err'); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Nuevo contacto" onClose={onClose}>
      <div className="form">
        <input autoFocus placeholder="Nombre y apellido" value={nf.name}
          onChange={(e) => setNf((s) => ({ ...s, name: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') create(); }} />
        <div className="row2">
          <input placeholder="Teléfono (opcional)" value={nf.phone} onChange={(e) => setNf((s) => ({ ...s, phone: e.target.value }))} />
          <input placeholder="Email (opcional)" value={nf.email} onChange={(e) => setNf((s) => ({ ...s, email: e.target.value }))} />
        </div>
        <Button disabled={busy} onClick={create}>Crear contacto</Button>
      </div>
    </Modal>
  );
}

/** Con quién es la reserva: contacto del CRM ya cargado o uno nuevo en el momento.
 *  Reemplaza al viejo texto libre "huésped / referencia", que no se podía cruzar
 *  después con sus operaciones ni contratos. El alta va en un botón aparte y no como
 *  opción del desplegable: crear no es "elegir", y mezclarlos hace tocar mal. */
function ClientPicker({ clients, value, placeholder, onChange, onCreated }: {
  clients: Client[]; value: number | null; placeholder: string;
  onChange: (id: number | null) => void; onCreated: (c: Client) => void;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="picker-row">
      <Select value={value == null ? NONE : String(value)} onValueChange={(v) => onChange(v === NONE ? null : Number(v))}>
        <SelectTrigger className="h-9 picker-select"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{placeholder}</SelectItem>
          {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" className="h-9 picker-new" title="Crear un contacto nuevo" onClick={() => setCreating(true)}>
        <UserPlus className="h-4 w-4" />Nuevo
      </Button>
      {creating && (
        <NewClientModal
          onClose={() => setCreating(false)}
          onCreated={(c) => { addCachedClient(c); onCreated(c); onChange(c.id); }}
        />
      )}
    </div>
  );
}

/** Pasar una reserva a alquiler efectivo exige saber QUIÉN alquila. */
function ConfirmRentModal({ booking, clients, onCreated, onConfirm, onClose }: {
  booking: Booking; clients: Client[]; onCreated: (c: Client) => void;
  onConfirm: (clientId: number) => void; onClose: () => void;
}) {
  const [clientId, setClientId] = useState<number | null>(booking.client_id);
  return (
    <Modal title="Confirmar como alquilada" onClose={onClose}>
      <p className="muted small" style={{ margin: '0 0 10px' }}>
        {fmtDay(booking.from_date)} → {fmtDay(booking.to_date)} · ¿Quién alquila?
      </p>
      <div className="form">
        <ClientPicker
          clients={clients} value={clientId} placeholder="Elegí un contacto"
          onChange={setClientId} onCreated={onCreated}
        />
        <Button disabled={clientId == null} onClick={() => clientId != null && onConfirm(clientId)}>Confirmar alquiler</Button>
      </div>
    </Modal>
  );
}

// Calendario de reservas: cada rango cargado se etiqueta Reservada o Alquilada, y ese
// es el dato que gobierna el estado calculado de la propiedad (ver StatusChip).
export function CalendarModal({ property, onClose }: { property: Property; onClose: () => void }) {
  // Arranca con lo que el panel YA tenía cargado (reservas embebidas en /properties/mine
  // + cartera cacheada): el modal abre con todo pintado y el fetch de abajo solo refresca.
  const [bookings, setBookings] = useState<Booking[]>(() => seedBookings(property));
  const [clients, setClients] = useState<Client[]>(cachedClients);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [f, setF] = useState<{ from: string; to: string; kind: string; clientId: number | null }>({ from: '', to: '', kind: 'reserva', clientId: null });
  /** Reserva "enfocada" desde la lista: se resalta en la grilla y en la fila. */
  const [focusId, setFocusId] = useState<number | null>(null);
  /** Reserva que se está pasando a alquiler (abre el modal que pide el contacto). */
  const [renting, setRenting] = useState<Booking | null>(null);
  const sold = property.status === 'vendida';
  const confirm = useConfirm();
  const load = () => api<{ bookings: Booking[] }>(`/api/properties/${property.id}/bookings`).then((r) => setBookings(r.bookings)).catch(() => {});
  useEffect(() => {
    load();
    loadClients().then(setClients).catch(() => {});
  }, []);

  const bookingOn = (d: string) => bookings.find((b) => b.from_date <= d && d <= b.to_date);
  /** ¿El rango pisa alguna reserva ya cargada? (solapamiento de intervalos) */
  const clashes = (from: string, to: string) => bookings.some((b) => b.from_date <= to && from <= b.to_date);

  async function add() {
    if (!f.from || !f.to) return toast('Elegí las fechas desde y hasta', 'err');
    if (f.kind === 'alquiler' && f.clientId == null) return toast('Elegí quién alquila', 'err');
    try {
      await api(`/api/properties/${property.id}/bookings`, {
        method: 'POST',
        body: JSON.stringify({ from_date: f.from, to_date: f.to, kind: f.kind, client_id: f.clientId }),
      });
      setF({ from: '', to: '', kind: 'reserva', clientId: null }); load();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  // Quitar una reserva borra el rango del calendario y con él el estado que la propiedad
  // muestra: se pregunta antes, igual que el resto de las acciones destructivas del panel.
  async function del(b: Booking) {
    const quien = b.client_name || b.guest_name;
    const ok = await confirm(
      `¿Quitar la reserva del ${fmtDay(b.from_date)} → ${fmtDay(b.to_date)}${quien ? ` de ${quien}` : ''}? No se puede deshacer.`,
      { confirmLabel: 'Quitar', destructive: true },
    );
    if (!ok) return;
    try { await api(`/api/properties/${property.id}/bookings/${b.id}`, { method: 'DELETE' }); load(); } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function confirmAlquilada(id: number, clientId: number) {
    try {
      await api(`/api/properties/${property.id}/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ kind: 'alquiler', client_id: clientId }) });
      setRenting(null); load();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  // Con el contacto ya cargado no hay nada que preguntar: confirma directo. El popup
  // aparece solo cuando falta saber quién alquila.
  const startConfirm = (b: Booking) => (b.client_id != null ? confirmAlquilada(b.id, b.client_id) : setRenting(b));

  // Click en una reserva de la lista → el calendario salta a SU mes y la resalta. Sin
  // esto, una reserva de otro mes no se ve en la grilla y hay que buscarla con las flechas.
  const goToBooking = (b: Booking) => {
    const [y, m] = b.from_date.split('-').map(Number);
    if (y && m) setYm({ y, m: m - 1 });
    setFocusId(b.id);
  };

  // Elegir el rango tocando el calendario: el 1er día abre la selección y el 2º la
  // cierra. No importa el orden — la fecha menor es el "desde" y la mayor el "hasta".
  function pickDay(d: string) {
    const b = bookingOn(d);
    if (b) { goToBooking(b); return; }   // día ocupado: no se selecciona, muestra de qué reserva es
    if (sold) return;
    if (!f.from || f.to) { setF((s) => ({ ...s, from: d, to: '' })); return; }
    const from = d < f.from ? d : f.from;
    const to = d < f.from ? f.from : d;
    if (clashes(from, to)) return toast('Ese rango pisa una reserva ya cargada', 'err');
    setF((s) => ({ ...s, from, to }));
  }

  const first = new Date(ym.y, ym.m, 1).getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => `${ym.y}-${pad(ym.m + 1)}-${pad(i + 1)}`)];
  const monthName = new Date(ym.y, ym.m, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const shift = (d: number) => setYm(({ y, m }) => { const nd = new Date(y, m + d, 1); return { y: nd.getFullYear(), m: nd.getMonth() }; });

  return (
    <Modal title={`Reservas · ${property.title}`} onClose={onClose}>
      <div className="cal-head">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <b style={{ textTransform: 'capitalize' }}>{monthName}</b>
        <Button variant="ghost" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="cal-grid">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const b = bookingOn(d);
          const cls = b ? (b.kind === 'alquiler' ? 'cal-day booked' : 'cal-day booked-reserva') : 'cal-day';
          const focus = b && b.id === focusId ? ' cal-focus' : '';
          const inSel = !b && f.from && (f.to ? d >= f.from && d <= f.to : d === f.from);
          const sel = inSel ? (d === f.from || d === f.to ? ' cal-sel cal-sel-edge' : ' cal-sel') : '';
          return (
            <button
              key={i} type="button" className={cls + focus + sel}
              title={b ? `${KIND_LABEL[b.kind] || b.kind}${b.client_name || b.guest_name ? ` · ${b.client_name || b.guest_name}` : ''}` : undefined}
              onClick={() => pickDay(d)}
            >{Number(d.slice(-2))}</button>
          );
        })}
      </div>
      {sold ? (
        <p className="muted small" style={{ marginTop: 14 }}>Esta propiedad está vendida — no acepta nuevas reservas ni alquileres.</p>
      ) : (
        <div className="form" style={{ marginTop: 14 }}>
          <p className="muted small" style={{ margin: 0 }}>
            {f.from && f.to
              ? <>Seleccionado: <b>{fmtDay(f.from)} → {fmtDay(f.to)}</b> · <button className="link-btn" onClick={() => setF((s) => ({ ...s, from: '', to: '' }))}>Limpiar</button></>
              : f.from
                ? <>Desde <b>{fmtDay(f.from)}</b> — tocá el día de salida.</>
                : 'Tocá un día para el "desde" y otro para el "hasta".'}
          </p>
          <div className="row2">
            <label className="date-lbl">Desde<input type="date" value={f.from} onChange={(e) => setF((s) => ({ ...s, from: e.target.value }))} /></label>
            <label className="date-lbl">Hasta<input type="date" value={f.to} onChange={(e) => setF((s) => ({ ...s, to: e.target.value }))} /></label>
          </div>
          <Select value={f.kind} onValueChange={(v) => setF((s) => ({ ...s, kind: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{BOOKING_KINDS.map((k) => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}</SelectContent>
          </Select>
          <ClientPicker
            clients={clients} value={f.clientId}
            placeholder={f.kind === 'alquiler' ? 'Elegí quién alquila' : 'Sin contacto (opcional)'}
            onChange={(id) => setF((s) => ({ ...s, clientId: id }))}
            onCreated={(c) => setClients((cs) => [c, ...cs])}
          />
          <button className="btn" onClick={add}>Bloquear estas fechas</button>
        </div>
      )}
      <h4 style={{ margin: '14px 0 6px' }}>Reservas cargadas</h4>
      {bookings.length === 0 ? <p className="muted small">Sin reservas. Las fechas que bloquees se marcan en el calendario.</p> : (
        <div className="bk-list">
          {bookings.map((b) => (
            <div className={`bk-row${b.id === focusId ? ' bk-active' : ''}`} key={b.id}>
              {/* Clickeable: lleva el calendario al mes de esta reserva y la resalta. */}
              <span
                className="bk-when"
                role="button"
                tabIndex={0}
                title="Ver estas fechas en el calendario"
                onClick={() => goToBooking(b)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToBooking(b); } }}
              >
                {/* Estado y contacto van DEBAJO de las fechas: en una sola línea la fila
                    se parte sola y cada reserva queda de un alto distinto. */}
                <span className="bk-dates">📅 {fmtDay(b.from_date)} → {fmtDay(b.to_date)}</span>
                <span className="bk-meta">
                  <span className={b.kind === 'alquiler' ? 'text-muted-foreground' : 'text-warn'}>{KIND_LABEL[b.kind] || b.kind}</span>
                  {b.client_name || b.guest_name ? ` · ${b.client_name || b.guest_name}` : ''}
                </span>
              </span>
              <span className="bk-actions">
                {b.kind === 'reserva' && <button className="bk-btn" title="Pasarla a alquiler efectivo" onClick={() => startConfirm(b)}>Confirmar</button>}
                <button className="bk-btn danger" onClick={() => del(b)}>Quitar</button>
              </span>
            </div>
          ))}
        </div>
      )}
      {renting && (
        <ConfirmRentModal
          booking={renting} clients={clients}
          onCreated={(c) => setClients((cs) => [c, ...cs])}
          onConfirm={(clientId) => confirmAlquilada(renting.id, clientId)}
          onClose={() => setRenting(null)}
        />
      )}
    </Modal>
  );
}
