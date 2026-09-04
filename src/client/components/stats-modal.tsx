import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Property, PropertyStats } from '../lib/types';
import { Modal } from './property-form';

const pad = (n: number) => String(n).padStart(2, '0');
function lastDays(n: number): string[] {
  const out: string[] = [];
  const t = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(t); d.setDate(t.getDate() - i);
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return out;
}

// Estadísticas de visitas de una propiedad: total, gráfico de 30 días y una proyección
// naïve (promedio ponderado 7d/30d) para empezar a trabajar predicciones.
export function StatsModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api<PropertyStats>(`/api/properties/${property.id}/stats`).then(setStats).catch((e) => setErr(String((e as Error).message)));
  }, [property.id]);

  return (
    <Modal title={`Estadísticas · ${property.title}`} onClose={onClose}>
      {err && <p className="err">{err}</p>}
      {!stats && !err && <p className="muted">Cargando…</p>}
      {stats && <StatsBody stats={stats} />}
    </Modal>
  );
}

function StatsBody({ stats }: { stats: PropertyStats }) {
  const days = lastDays(30);
  const map = new Map(stats.series.map((s) => [s.day, s.count]));
  const data = days.map((day) => ({ day, count: map.get(day) || 0 }));
  const max = Math.max(1, ...data.map((d) => d.count));

  // Proyección naïve: ritmo diario = mezcla del promedio de 7d (peso 0.6) y 30d (peso 0.4).
  const daily = (stats.last7 / 7) * 0.6 + (stats.last30 / 30) * 0.4;
  const proj7 = Math.round(daily * 7);
  const proj30 = Math.round(daily * 30);
  const fmtDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

  return (
    <div className="stats">
      <div className="stat-row">
        <div className="stat-kpi"><b>{stats.total}</b><span>visitas totales</span></div>
        <div className="stat-kpi"><b>{stats.last7}</b><span>últimos 7 días</span></div>
        <div className="stat-kpi"><b>{stats.last30}</b><span>últimos 30 días</span></div>
        <div className="stat-kpi"><b>{daily.toFixed(1)}</b><span>promedio/día</span></div>
      </div>

      <h4 className="stat-h">Visitas por día (últimos 30)</h4>
      <div className="chart">
        {data.map((d, i) => (
          <div className="bar-wrap" key={d.day} title={`${fmtDay(d.day)}: ${d.count} visita${d.count === 1 ? '' : 's'}`}>
            <div className="bar" style={{ height: `${(d.count / max) * 100}%` }} />
            {i % 5 === 0 && <span className="bar-lbl">{fmtDay(d.day)}</span>}
          </div>
        ))}
      </div>

      <div className="proj">
        <span className="proj-ic">🔮</span>
        <div>
          <b>Proyección</b>
          <p className="muted small">Al ritmo actual, se estiman <b>~{proj7} visitas</b> en los próximos 7 días y <b>~{proj30}</b> en los próximos 30. Cuantos más datos, mejor la predicción.</p>
        </div>
      </div>
      {stats.total === 0 && <p className="muted small" style={{ marginTop: 8 }}>Todavía no hay visitas registradas. Compartí el link de la propiedad para empezar a medir.</p>}
    </div>
  );
}
