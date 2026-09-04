import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { mediaUrl, money, type ClientDetail as Detail } from '../lib/types';
import { prefsSummary } from '../lib/prefs';
import { Button } from './ui/button';

// Ficha del contacto: todo lo que la inmobiliaria sabe de él en una sola vista.
// Los totales van SIEMPRE por moneda (ARS y USD no se suman), igual que el P&L.

const STAGE_LABEL: Record<string, string> = {
  visita: 'Visita', oferta: 'Oferta', reserva: 'Reserva', firma: 'Firma',
  cerrada: 'Cerrada', perdida: 'Perdida',
};

const prefsList = prefsSummary;

export function ClientDetailView({ clientId, onBack, onMatches }: {
  clientId: number; onBack: () => void; onMatches: () => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api<Detail>(`/api/clients/${clientId}`)
      .then(setD)
      .catch((e) => setErr(String((e as Error).message)));
  }, [clientId]);

  if (err) return <div><BackBtn onBack={onBack} /><p className="err">{err}</p></div>;
  if (!d) return <div><BackBtn onBack={onBack} /><p className="muted">Cargando ficha…</p></div>;

  const { client: cl } = d;
  const isOwner = cl.kind === 'propietario';
  // Un contacto sin nada cargado no debería ver tres secciones vacías.
  const vacio = !d.properties.length && !d.deals.length && !d.contracts.length;

  return (
    <div className="cd">
      <BackBtn onBack={onBack} />

      <div className="cd-head">
        <div>
          <h3 className="cd-title">{cl.name} <span className={isOwner ? 'chip' : 'chip ok'}>{cl.kind}</span></h3>
          <div className="muted small">{[cl.phone, cl.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</div>
        </div>
        {!isOwner && <Button variant="outline" size="sm" onClick={onMatches}>Ver coincidencias</Button>}
      </div>

      {!isOwner && <p className="muted small cd-prefs">Busca: {prefsList(cl.prefs)}</p>}
      {cl.notes && <p className="cd-notes">{cl.notes}</p>}

      {/* KPIs: una tarjeta por moneda para no mezclar ARS con USD. */}
      <div className="cd-kpis">
        <div className="kpi"><span className="kpi-lbl">Propiedades</span><b>{d.properties.length}</b></div>
        {d.income.length === 0 && d.expenses.length === 0 && (
          <div className="kpi"><span className="kpi-lbl">Movimientos</span><b className="muted">—</b></div>
        )}
        {d.income.map((i) => (
          <div className="kpi" key={`in-${i.currency}`}>
            <span className="kpi-lbl">Cobrado {i.currency}</span>
            <b>{i.total.toLocaleString('es-AR')}</b>
          </div>
        ))}
        {d.expenses.map((e) => (
          <div className="kpi" key={`ex-${e.currency}`}>
            <span className="kpi-lbl">Gastos {e.currency}</span>
            <b>{e.paid.toLocaleString('es-AR')}</b>
            {e.pending > 0 && <span className="kpi-sub text-warn">+{e.pending.toLocaleString('es-AR')} pendiente</span>}
          </div>
        ))}
      </div>

      {vacio && (
        <p className="muted cd-empty">
          Todavía no hay nada asociado a este contacto.
          {isOwner && ' Para vincularle propiedades, editá una propiedad y elegilo en "Propietario".'}
        </p>
      )}

      {d.properties.length > 0 && (
        <section className="cd-sec">
          <h4>Propiedades en consignación · {d.properties.length}</h4>
          <div className="cd-props">
            {d.properties.map((p) => (
              <div className="cd-prop" key={p.id}>
                {p.cover_key
                  ? <img src={mediaUrl(p.cover_key)} alt="" loading="lazy" />
                  : <div className="cd-prop-noimg">🏠</div>}
                <div className="cd-prop-body">
                  <b>{p.title}</b>
                  <div className="muted small">
                    {p.operation} · {p.city || 's/ciudad'} · {money(p.price, p.currency, p.price_period)}
                  </div>
                  <div className="cd-prop-chips">
                    <span className="chip">{p.status}</span>
                    {p.archived_at ? <span className="chip">archivada</span>
                      : !p.published && <span className="chip">sin publicar</span>}
                    {p.commission_pct != null && <span className="chip">{p.commission_pct}% comisión</span>}
                    {!!p.exclusive && <span className="chip">exclusiva</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.deals.length > 0 && (
        <section className="cd-sec">
          <h4>Operaciones · {d.deals.length}</h4>
          <div className="bk-list">
            {d.deals.map((op) => (
              <div className="bk-row" key={op.id}>
                <span>{op.property_title || 'Sin propiedad'}{op.notes ? ` — ${op.notes}` : ''}</span>
                <span className="chip ok">{STAGE_LABEL[op.stage] || op.stage}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.contracts.length > 0 && (
        <section className="cd-sec">
          <h4>Contratos · {d.contracts.length}</h4>
          <div className="bk-list">
            {d.contracts.map((ct) => (
              <div className="bk-row" key={ct.id}>
                <span>
                  {ct.property_title || 'Sin propiedad'} · {ct.operation}
                  {ct.amount != null ? ` · ${money(ct.amount, ct.currency)}` : ''}
                  {ct.start_date ? ` · desde ${ct.start_date}` : ''}
                </span>
                <span className="row" style={{ gap: 8 }}>
                  {/* Distingue el contrato que firmó él del que corre sobre su propiedad. */}
                  {ct.role === 'propietario' && <span className="chip">su propiedad</span>}
                  <span className="muted small">cobrado {ct.currency} {ct.collected.toLocaleString('es-AR')}</span>
                  <span className="chip">{ct.status}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="cd-back" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" /> Volver a contactos
    </Button>
  );
}
