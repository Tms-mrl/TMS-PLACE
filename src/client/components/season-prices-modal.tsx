import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { toast } from '../lib/toast';
import { money, MONTHS_ES, SEASON_MONTH_ORDER, type Property, type SeasonPrice } from '../lib/types';
import { Modal } from './property-form';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';

// Planilla interna de tarifas por temporada. Una fila por mes: "por mes" vale para todo el
// mes; "por día"/"por semana"/"por quincena" se cargan por quincena (1ª = 1-15, 2ª = 16-fin).
// Pesos, todo opcional. No toca la ficha pública — es referencia para cotizar.
const FIELDS = [
  'price_month',
  'price_day_q1', 'price_week_q1', 'price_fortnight_q1',
  'price_day_q2', 'price_week_q2', 'price_fortnight_q2',
] as const;
type Draft = Record<(typeof FIELDS)[number], string>;
const EMPTY: Draft = Object.fromEntries(FIELDS.map((k) => [k, ''])) as Draft;

const numStr = (v: number | null) => (v != null ? String(v) : '');
const toDraft = (r: SeasonPrice | undefined): Draft =>
  r ? (Object.fromEntries(FIELDS.map((k) => [k, numStr(r[k])])) as Draft) : { ...EMPTY };

// Resumen corto de una tarifa cargada, para el chip del mes.
function summarize(r: SeasonPrice): string {
  const parts: string[] = [];
  if (r.price_month != null) parts.push(`mes ${money(r.price_month, 'ARS')}`);
  const day = r.price_day_q1 ?? r.price_day_q2;
  if (day != null) parts.push(`día ${money(day, 'ARS')}`);
  const week = r.price_week_q1 ?? r.price_week_q2;
  if (week != null) parts.push(`sem ${money(week, 'ARS')}`);
  const fort = r.price_fortnight_q1 ?? r.price_fortnight_q2;
  if (fort != null) parts.push(`quinc ${money(fort, 'ARS')}`);
  return parts.join(' · ') || 'sin datos';
}

export function SeasonPricesModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const confirm = useConfirm();
  const [rates, setRates] = useState<SeasonPrice[]>([]);
  const [month, setMonth] = useState(12);
  const [d, setD] = useState<Draft>({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft, v: string) => setD((p) => ({ ...p, [k]: v }));

  const load = () => api<{ rates: SeasonPrice[] }>(`/api/properties/${property.id}/season-prices`)
    .then((r) => setRates(r.rates)).catch(() => {});
  useEffect(() => { load(); }, []);

  const savedForMonth = useMemo(() => rates.find((r) => r.month === month), [rates, month]);
  // Al cambiar de mes (o al (re)cargar la lista) traigo al formulario lo guardado de ese mes.
  useEffect(() => { setD(toDraft(savedForMonth)); }, [savedForMonth]);

  const withRate = useMemo(() => new Set(rates.map((r) => r.month)), [rates]);
  const dirty = JSON.stringify(d) !== JSON.stringify(toDraft(savedForMonth));

  async function pickMonth(m: number) {
    if (m === month) return;
    if (dirty && !(await confirm(`Tenés cambios sin guardar en ${MONTHS_ES[month - 1]}. ¿Descartarlos?`))) return;
    setMonth(m);
  }

  async function save() {
    setBusy(true);
    try {
      const body = Object.fromEntries(FIELDS.map((k) => [k, d[k].trim() === '' ? null : Number(d[k])]));
      const r = await api<{ deleted?: boolean }>(
        `/api/properties/${property.id}/season-prices/${month}`,
        { method: 'PUT', body: JSON.stringify(body) },
      );
      toast(r.deleted ? `${MONTHS_ES[month - 1]} quedó sin tarifas` : `${MONTHS_ES[month - 1]} guardado`, 'ok');
      await load();
    } catch (e) { toast(String((e as Error).message), 'err'); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={`Precios por temporada · ${property.title}`} onClose={onClose}>
      <div className="form">
        <p className="muted small" style={{ margin: 0 }}>
          Tarifas de referencia para cotizar, en pesos. Es interno: no cambia el aviso público.
        </p>

        <label className="fld">
          <span className="fld-lbl">Mes</span>
          <Select value={String(month)} onValueChange={(v) => pickMonth(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEASON_MONTH_ORDER.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {MONTHS_ES[m - 1]}{withRate.has(m) ? ' ·' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="fld">
          <span className="fld-lbl">Precio por mes (todo el mes)</span>
          <input type="number" min={0} placeholder="$"
            value={d.price_month} onChange={(e) => set('price_month', e.target.value)} />
        </label>

        <div className="season-grid">
          <span />
          <b>1ª quincena</b>
          <b>2ª quincena</b>
          <span className="fld-lbl">Por día</span>
          <input type="number" min={0} placeholder="$" value={d.price_day_q1} onChange={(e) => set('price_day_q1', e.target.value)} />
          <input type="number" min={0} placeholder="$" value={d.price_day_q2} onChange={(e) => set('price_day_q2', e.target.value)} />
          <span className="fld-lbl">Por semana</span>
          <input type="number" min={0} placeholder="$" value={d.price_week_q1} onChange={(e) => set('price_week_q1', e.target.value)} />
          <input type="number" min={0} placeholder="$" value={d.price_week_q2} onChange={(e) => set('price_week_q2', e.target.value)} />
          <span className="fld-lbl">Por quincena</span>
          <input type="number" min={0} placeholder="$" value={d.price_fortnight_q1} onChange={(e) => set('price_fortnight_q1', e.target.value)} />
          <input type="number" min={0} placeholder="$" value={d.price_fortnight_q2} onChange={(e) => set('price_fortnight_q2', e.target.value)} />
        </div>

        <Button disabled={busy} onClick={save}>
          {busy ? 'Guardando…' : `Guardar ${MONTHS_ES[month - 1]}`}
        </Button>

        {rates.length > 0 && (
          <>
            <hr className="rmenu-sep" />
            <p className="muted small" style={{ margin: 0 }}>Meses con tarifa cargada</p>
            <div className="season-chips">
              {rates.slice().sort((a, b) => a.month - b.month).map((r) => (
                <button key={r.month} type="button" className="season-chip" onClick={() => pickMonth(r.month)}>
                  {MONTHS_ES[r.month - 1]}
                  <span className="muted">{summarize(r)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
