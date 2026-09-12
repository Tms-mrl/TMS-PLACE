import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import type { AgencyBooking } from '../lib/types';
import { fmtDay } from './calendar-modal';
import { Modal } from './property-form';
import { Button } from './ui/button';

const pad = (n: number) => String(n).padStart(2, '0');
const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type DayInfo = { ingresos: AgencyBooking[]; desocupaciones: AgencyBooking[] };

// from_date → ingreso, to_date → desocupación. Cada reserva aporta exactamente 2
// entradas puntuales al mapa (nunca los días intermedios), y ambas pueden caer en la
// misma fecha si from_date === to_date.
function buildDayMap(bookings: AgencyBooking[]): Map<string, DayInfo> {
  const map = new Map<string, DayInfo>();
  const bump = (d: string, key: keyof DayInfo, b: AgencyBooking) => {
    let e = map.get(d);
    if (!e) { e = { ingresos: [], desocupaciones: [] }; map.set(d, e); }
    e[key].push(b);
  };
  for (const b of bookings) { bump(b.from_date, 'ingresos', b); bump(b.to_date, 'desocupaciones', b); }
  return map;
}

export function CalendarioPanel() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [bookings, setBookings] = useState<AgencyBooking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const monthParam = `${ym.y}-${pad(ym.m + 1)}`;
  useEffect(() => {
    setLoaded(false);
    api<{ bookings: AgencyBooking[] }>(`/api/properties/bookings?month=${monthParam}`)
      .then((r) => setBookings(r.bookings))
      .catch(() => setBookings([]))
      .finally(() => setLoaded(true));
  }, [monthParam]);

  const dayMap = useMemo(() => buildDayMap(bookings), [bookings]);
  const monthName = new Date(ym.y, ym.m, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const shift = (d: number) => setYm(({ y, m }) => { const nd = new Date(y, m + d, 1); return { y: nd.getFullYear(), m: nd.getMonth() }; });

  const firstDow = new Date(ym.y, ym.m, 1).getDay(); // 0=domingo..6=sábado
  const leadBlanks = (firstDow + 6) % 7; // reindexado a lunes=0 (lunes a domingo)
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(leadBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${ym.y}-${pad(ym.m + 1)}-${pad(i + 1)}`),
  ];

  return (
    <div>
      <div className="panel-head"><h3>Calendario</h3></div>
      <div className="cal-head">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <b style={{ textTransform: 'capitalize' }}>{monthName}</b>
        <Button variant="ghost" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      {!loaded ? <p className="muted">Cargando…</p> : (
        <>
          <div className="cal-grid movecal-grid">
            {DOW.map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const info = dayMap.get(d);
              const hasIn = !!info?.ingresos.length;
              const hasOut = !!info?.desocupaciones.length;
              const cls = ['movecal-day', hasIn && hasOut ? 'movecal-both' : hasIn ? 'movecal-in' : hasOut ? 'movecal-out' : ''].filter(Boolean).join(' ');
              return (
                <button key={i} type="button" className={cls} disabled={!hasIn && !hasOut} onClick={() => setOpenDay(d)}>
                  <span className="movecal-num">{Number(d.slice(-2))}</span>
                </button>
              );
            })}
          </div>
          <div className="movecal-legend">
            <span><i className="movecal-dot movecal-dot-in" /> Ingreso</span>
            <span><i className="movecal-dot movecal-dot-out" /> Desocupación</span>
          </div>
        </>
      )}
      {openDay && dayMap.get(openDay) && (
        <DayDetailModal day={openDay} info={dayMap.get(openDay)!} onClose={() => setOpenDay(null)} />
      )}
    </div>
  );
}

function DayDetailModal({ day, info, onClose }: { day: string; info: DayInfo; onClose: () => void }) {
  const who = (b: AgencyBooking) => b.client_name || b.guest_name || 'Sin nombre';
  return (
    <Modal title={fmtDay(day)} onClose={onClose}>
      {info.desocupaciones.length > 0 && (
        <div className="movecal-section">
          <h4>Desocupaciones</h4>
          <div className="client-list">
            {info.desocupaciones.map((b) => (
              <div className="client-card" key={`out-${b.id}`}>
                <div className="client-main">
                  <div className="client-name">{b.property_title} <span className="chip blocked">Desocupación</span></div>
                  <div className="muted small">{who(b)} · Ingreso {fmtDay(b.from_date)} → Desocupación {fmtDay(b.to_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {info.ingresos.length > 0 && (
        <div className="movecal-section">
          <h4>Ingresos</h4>
          <div className="client-list">
            {info.ingresos.map((b) => (
              <div className="client-card" key={`in-${b.id}`}>
                <div className="client-main">
                  <div className="client-name">{b.property_title} <span className="chip ok">Ingreso</span></div>
                  <div className="muted small">{who(b)} · Ingreso {fmtDay(b.from_date)} → Desocupación {fmtDay(b.to_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
