import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { toast } from '../lib/toast';
import { Modal } from './property-form';
import { Button } from './ui/button';
import { useConfirm } from './ui/use-confirm';

// Papelera de propiedades: lo eliminado queda 40 días con sus reservas, tarifas y fotos
// (ver worker/lib/trash.ts). Restaurar lo devuelve tal cual estaba.

type Item = {
  id: number; property_id: number; title: string; code: string | null; deleted_at: string; deleted_by: string | null;
  bookings_n: number; prices_n: number; photos_n: number; days_left: number;
};

const when = (s: string) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function TrashModal({ onClose, onRestored }: { onClose: () => void; onRestored: () => void }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const load = () => api<{ items: Item[] }>('/api/properties/trash/list').then((r) => setItems(r.items)).catch((e) => { toast(String((e as Error).message), 'err'); setItems([]); });
  useEffect(() => { load(); }, []);

  async function restore(it: Item) {
    setBusy(it.id);
    try {
      await api(`/api/properties/trash/${it.id}/restore`, { method: 'POST' });
      toast(`«${it.title}» restaurada con sus reservas y tarifas`, 'ok');
      onRestored(); await load();
    } catch (e) { toast(String((e as Error).message), 'err'); } finally { setBusy(null); }
  }
  async function purge(it: Item) {
    if (!(await confirm(`¿Eliminar "${it.title}" para siempre? Ya no se va a poder recuperar.`, { destructive: true, confirmLabel: 'Eliminar definitivamente' }))) return;
    setBusy(it.id);
    try { await api(`/api/properties/trash/${it.id}`, { method: 'DELETE' }); await load(); }
    catch (e) { toast(String((e as Error).message), 'err'); } finally { setBusy(null); }
  }

  return (
    <Modal title="Papelera" onClose={onClose}>
      <p className="muted small" style={{ marginTop: 0 }}>Las propiedades eliminadas quedan acá 40 días. Al restaurarlas vuelven con sus reservas, tarifas por temporada y fotos. Pasado ese plazo se borran para siempre.</p>
      {items === null && <p className="muted">Cargando…</p>}
      {items && !items.length && <p className="muted">La papelera está vacía.</p>}
      <div className="client-list">
        {(items || []).map((it) => (
          <div className="client-card" key={it.id} style={{ alignItems: 'flex-start' }}>
            <div className="client-main">
              <div className="client-name">{it.title} {it.code && <span className="chip">{it.code}</span>}</div>
              <div className="muted small">
                Eliminada {when(it.deleted_at)}{it.deleted_by ? ` por ${it.deleted_by}` : ''} · {it.days_left <= 1 ? 'se borra hoy' : `se borra en ${it.days_left} días`}
              </div>
              <div className="muted small">{plural(it.bookings_n, 'reserva', 'reservas')} · {plural(it.prices_n, 'tarifa de temporada', 'tarifas de temporada')} · {plural(it.photos_n, 'foto', 'fotos')}</div>
            </div>
            <div className="client-actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Button size="sm" disabled={busy === it.id} onClick={() => restore(it)}>{busy === it.id ? 'Restaurando…' : 'Restaurar'}</Button>
              <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => purge(it)}>Eliminar ya</Button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
