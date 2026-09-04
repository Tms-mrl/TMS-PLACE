import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Download, Pencil, Printer, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import {
  money, type Expense, type FinanceSummary, type FinanceTotal, type PeriodSummary, type Property, type Transaction,
} from '../lib/types';
import { toast } from '../lib/toast';
import { Modal } from './property-form';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';

const ALL = '_all';
const NONE = '_none';

// Categorías de gasto (deben coincidir con CATEGORIES del worker).
const OTHER = { label: 'Otro', emoji: '📌' };
const CAT: Record<string, { label: string; emoji: string }> = {
  reparacion: { label: 'Reparación', emoji: '🔧' },
  limpieza: { label: 'Limpieza', emoji: '🧹' },
  impuestos: { label: 'Impuestos', emoji: '🏛️' },
  servicios: { label: 'Servicios', emoji: '💡' },
  expensas: { label: 'Expensas', emoji: '🏢' },
  mantenimiento: { label: 'Mantenimiento', emoji: '🛠️' },
  comision: { label: 'Comisión', emoji: '💼' },
  seguro: { label: 'Seguro', emoji: '🛡️' },
  otro: OTHER,
};
const CAT_KEYS = Object.keys(CAT);
const catOf = (k: string) => CAT[k] ?? OTHER;

const METHODS: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', otro: 'Otro' };

// ── Fechas: helpers de mes/día compartidos por Resumen ──
const currentMonth = () => new Date().toISOString().slice(0, 7);
const todayStr = () => new Date().toISOString().slice(0, 10);
// 'YYYY-MM' viene siempre controlado (currentMonth() o el `period` que devuelve el worker, ya
// validado ahí como YYYY-MM) — el tuple cast es seguro pese a noUncheckedIndexedAccess.
const monthParts = (m: string) => m.split('-').map(Number) as [number, number];
const monthLabel = (m: string) => {
  const [y, mo] = monthParts(m);
  return new Date(y, mo - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
};
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
const dayShort = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' });

// CSV client-side: sin endpoint nuevo, arma el archivo a partir de los datos ya cargados.
// BOM al inicio para que Excel abra los acentos bien en UTF-8.
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const text = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

type PrintJob = { title: string; rows: { label: string; income: number; expense: number; currency: string }[] };

// Gestión financiera: Resumen (filtro de período + drill-down + export/print) y Gastos
// (alta/edición/borrado, sin tocar — ya andaba). scope='agency' | 'particular': solo cambia el
// contexto server-side (mismo backend para ambos).
export function FinancePanel({ scope, businessName }: { scope: 'agency' | 'particular'; businessName?: string }) {
  const [tab, setTab] = useState<'resumen' | 'gastos'>('resumen');
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  useEffect(() => {
    if (!printJob) return;
    const id = setTimeout(() => window.print(), 50);
    return () => clearTimeout(id);
  }, [printJob]);

  return (
    <div>
      <nav className="tabs">
        <button className={tab === 'resumen' ? 'tab active' : 'tab'} onClick={() => setTab('resumen')}>Resumen</button>
        <button className={tab === 'gastos' ? 'tab active' : 'tab'} onClick={() => setTab('gastos')}>Gastos</button>
      </nav>
      {tab === 'resumen' && <ResumenTab scope={scope} onPrint={setPrintJob} />}
      {tab === 'gastos' && <GastosTab scope={scope} />}
      <PrintSheet job={printJob} businessName={businessName} />
    </div>
  );
}

// Período mostrado en Resumen — mismo modelo de estados que la referencia del usuario (otra app):
// 3 valores elegibles desde el desplegable ("today"/"month"/"all") + 2 que solo aparecen como
// indicador visual cuando ya estás navegando adentro ("specific"/"specific_month"), no elegibles
// a mano. "specific" siempre vuelve a "month" y "specific_month" siempre vuelve a "all" — así de
// simple es en la referencia, se replica igual acá.
type FilterPeriod = 'today' | 'month' | 'all' | 'specific' | 'specific_month';
const PERIOD_LABELS: Record<FilterPeriod, string> = {
  today: 'Hoy (Detalle)', month: 'Este Mes (Diario)', all: 'Historial (Mensual)',
  specific: 'Día Específico', specific_month: 'Mes Específico',
};

// KPIs (Ingresos/Gastos/Balance) del período activo, separados por moneda (nunca se mezclan ARS/USD).
// Orden fijo ARS→USD: el backend no ordena por moneda (sale en el orden que devuelva SQLite,
// que no está garantizado), y sin esto el mismo panel podía mostrar ARS primero en un lugar y
// USD primero en otro.
function KpiCards({ totals }: { totals: FinanceTotal[] }) {
  if (!totals.length) return <p className="muted">Sin movimientos en este período.</p>;
  const sorted = [...totals].sort((a, b) => currencyRank(a.currency) - currencyRank(b.currency));
  return (
    <>
      {sorted.map((t) => {
        const result = t.income - t.expense;
        return (
          <div className="pnl-kpis" key={t.currency}>
            <div className="kpi"><div className="kpi-n pl-pos">{money(t.income, t.currency)}</div><div className="kpi-l">Ingresos ({t.currency})</div></div>
            <div className="kpi"><div className="kpi-n pl-neg">{money(t.expense, t.currency)}</div><div className="kpi-l">Gastos ({t.currency})</div></div>
            <div className="kpi"><div className={`kpi-n ${result >= 0 ? 'pl-pos' : 'pl-neg'}`}>{money(result, t.currency)}</div><div className="kpi-l">Balance ({t.currency})</div></div>
          </div>
        );
      })}
    </>
  );
}

// ══════════════════════════ Tab Resumen: Select de período (Hoy/Mes/Historial + drill-down) ══════════════════════════
function ResumenTab({ scope, onPrint }: { scope: 'agency' | 'particular'; onPrint: (job: PrintJob) => void }) {
  const confirm = useConfirm();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCatFilter] = useState('');

  const [historial, setHistorial] = useState<PeriodSummary | null>(null);
  const [monthRows, setMonthRows] = useState<PeriodSummary | null>(null);
  const [tx, setTx] = useState<Transaction[]>([]);

  // "month"/"specific_month" comparten la misma tabla diaria; "today"/"specific" comparten la
  // misma tabla de transacciones. El mes/día activo depende de si hay un drill-down en curso.
  const activeMonth = filterPeriod === 'specific_month' && selectedMonth ? selectedMonth : currentMonth();
  const activeDate = filterPeriod === 'specific' && selectedDate ? selectedDate : todayStr();

  const loadHistorial = () => api<PeriodSummary>('/api/expenses/summary/period?by=month').then(setHistorial).catch(() => {});
  const loadMonthRows = (m: string) => api<PeriodSummary>(`/api/expenses/summary/period?by=day&month=${m}`).then(setMonthRows).catch(() => {});
  const loadTx = (d: string) => {
    const qs = new URLSearchParams({ date: d });
    if (typeFilter !== 'all') qs.set('type', typeFilter);
    if (typeFilter === 'expense' && catFilter) qs.set('category', catFilter);
    api<{ transactions: Transaction[] }>(`/api/expenses/transactions?${qs}`).then((r) => setTx(r.transactions)).catch(() => {});
  };

  useEffect(() => { loadHistorial(); }, [scope]);
  useEffect(() => {
    if (filterPeriod === 'month' || filterPeriod === 'specific_month') loadMonthRows(activeMonth);
  }, [filterPeriod, activeMonth, scope]);
  useEffect(() => {
    if (filterPeriod === 'today' || filterPeriod === 'specific') loadTx(activeDate);
  }, [filterPeriod, activeDate, typeFilter, catFilter, scope]);

  const dayTotals = useMemo(() => {
    const m = new Map<string, { currency: string; income: number; expense: number }>();
    for (const t of tx) {
      let e = m.get(t.currency);
      if (!e) { e = { currency: t.currency, income: 0, expense: 0 }; m.set(t.currency, e); }
      if (t.type === 'income') e.income += t.amount; else e.expense += t.amount;
    }
    return [...m.values()];
  }, [tx]);

  const totals = filterPeriod === 'all' ? (historial?.totals ?? [])
    : filterPeriod === 'month' || filterPeriod === 'specific_month' ? (monthRows?.totals ?? [])
    : dayTotals;

  // Cambiar el desplegable a mano: resetea filtros y limpia el día/mes puntual que no aplique
  // (igual criterio que la referencia: "specific"/"specific_month" solo existen mientras estás
  // navegando adentro de ellos).
  function onSelectPeriod(v: string) {
    const fp = v as FilterPeriod;
    setFilterPeriod(fp);
    setTypeFilter('all'); setCatFilter('');
    if (fp !== 'specific') setSelectedDate(null);
    if (fp !== 'specific_month') setSelectedMonth(null);
  }
  function openMonth(period: string) { setSelectedMonth(period); setFilterPeriod('specific_month'); setTypeFilter('all'); setCatFilter(''); }
  function openDay(date: string) { setSelectedDate(date); setFilterPeriod('specific'); setTypeFilter('all'); setCatFilter(''); }
  function backToMonth() { setFilterPeriod('month'); }
  function backToHistorial() { setFilterPeriod('all'); }

  async function delTx(t: Transaction) {
    if (!(await confirm(`¿Eliminar este ${t.type === 'income' ? 'ingreso' : 'gasto'}? No se puede deshacer.`, { destructive: true, confirmLabel: 'Eliminar' }))) return;
    try {
      if (t.source === 'expense') await api(`/api/expenses/${t.id}`, { method: 'DELETE' });
      else await api(`/api/contracts/receipts/${t.id}`, { method: 'DELETE' });
      loadTx(activeDate); loadMonthRows(activeMonth); loadHistorial();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  // Export/print de un mes puntual: se piden los datos on-demand (sirve tanto para el mes activo
  // como para cualquier fila del Historial, sin tener que navegar a esa vista primero).
  async function exportMonthCsv(period: string) {
    const r = await api<PeriodSummary>(`/api/expenses/summary/period?by=day&month=${period}`).catch(() => null);
    const rows = [...(r?.periods ?? [])].sort((a, b) => a.period.localeCompare(b.period));
    downloadCsv(`finanzas-${period}.csv`, ['Día', 'Moneda', 'Ingresos', 'Gastos', 'Balance'],
      rows.map((row) => [row.period, row.currency, row.income, row.expense, row.income - row.expense]));
  }
  async function printMonth(period: string) {
    const r = await api<PeriodSummary>(`/api/expenses/summary/period?by=day&month=${period}`).catch(() => null);
    const rows = [...(r?.periods ?? [])].sort((a, b) => a.period.localeCompare(b.period))
      .map((row) => ({ label: dayShort(row.period), income: row.income, expense: row.expense, currency: row.currency }));
    onPrint({ title: monthLabel(period), rows });
  }
  async function exportDayCsv(date: string) {
    const r = await api<{ transactions: Transaction[] }>(`/api/expenses/transactions?date=${date}`).catch(() => null);
    downloadCsv(`movimientos-${date}.csv`, ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Método', 'Monto', 'Moneda'],
      (r?.transactions ?? []).map((t) => [t.date || '', t.type === 'income' ? 'Ingreso' : 'Gasto', t.category ? catOf(t.category).label : '', t.description || '', t.method ? (METHODS[t.method] || t.method) : '', t.amount, t.currency]));
  }
  function exportHistorialCsv() {
    const rows = [...(historial?.periods ?? [])].sort((a, b) => a.period.localeCompare(b.period));
    downloadCsv('finanzas-historico.csv', ['Mes', 'Moneda', 'Ingresos', 'Gastos', 'Balance'],
      rows.map((r) => [monthLabel(r.period), r.currency, r.income, r.expense, r.income - r.expense]));
  }
  function printHistorial() {
    const rows = [...(historial?.periods ?? [])].sort((a, b) => a.period.localeCompare(b.period))
      .map((r) => ({ label: monthLabel(r.period), income: r.income, expense: r.expense, currency: r.currency }));
    onPrint({ title: 'Histórico mes a mes', rows });
  }
  function exportTxCsv() {
    downloadCsv(`movimientos-${activeDate}.csv`, ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Método', 'Monto', 'Moneda'],
      tx.map((t) => [t.date || '', t.type === 'income' ? 'Ingreso' : 'Gasto', t.category ? catOf(t.category).label : '', t.description || '', t.method ? (METHODS[t.method] || t.method) : '', t.amount, t.currency]));
  }

  const showBack = filterPeriod === 'specific' || filterPeriod === 'specific_month';

  return (
    <div>
      <KpiCards totals={totals} />

      <div className="panel-head" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <Select value={filterPeriod} onValueChange={onSelectPeriod}>
            <SelectTrigger className="h-10 w-auto min-w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{PERIOD_LABELS.today}</SelectItem>
              <SelectItem value="month">{PERIOD_LABELS.month}</SelectItem>
              <SelectItem value="all">{PERIOD_LABELS.all}</SelectItem>
              {filterPeriod === 'specific' && <SelectItem value="specific">{PERIOD_LABELS.specific}</SelectItem>}
              {filterPeriod === 'specific_month' && <SelectItem value="specific_month">{PERIOD_LABELS.specific_month}</SelectItem>}
            </SelectContent>
          </Select>
          {showBack && (
            <Button variant="ghost" size="sm" onClick={filterPeriod === 'specific' ? backToMonth : backToHistorial}>
              <ChevronLeft className="h-4 w-4" /> {filterPeriod === 'specific' ? 'Volver al Mes' : 'Volver al Historial'}
            </Button>
          )}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {filterPeriod === 'all' && <Button variant="outline" size="sm" onClick={printHistorial}><Printer className="h-4 w-4" /> Imprimir</Button>}
          {(filterPeriod === 'month' || filterPeriod === 'specific_month') && <Button variant="outline" size="sm" onClick={() => printMonth(activeMonth)}><Printer className="h-4 w-4" /> Imprimir</Button>}
          <Button variant="outline" size="sm" onClick={
            filterPeriod === 'all' ? exportHistorialCsv
              : (filterPeriod === 'month' || filterPeriod === 'specific_month') ? () => exportMonthCsv(activeMonth)
              : exportTxCsv
          }><Download className="h-4 w-4" /> CSV</Button>
        </div>
      </div>

      {filterPeriod === 'all' && <HistorialView data={historial} onOpen={openMonth} onExportRow={exportMonthCsv} onPrintRow={printMonth} />}
      {(filterPeriod === 'month' || filterPeriod === 'specific_month') && (
        <MesView month={activeMonth} data={monthRows} onOpenDay={openDay} onExportRow={exportDayCsv} />
      )}
      {(filterPeriod === 'today' || filterPeriod === 'specific') && (
        <DiaView day={activeDate} tx={tx} typeFilter={typeFilter} setTypeFilter={setTypeFilter} catFilter={catFilter} setCatFilter={setCatFilter} onDelete={delTx} />
      )}
    </div>
  );
}

// ARS antes que USD, resto alfabético — orden estable para las líneas apiladas dentro de una fila.
const CURRENCY_RANK: Record<string, number> = { ARS: 0, USD: 1 };
const currencyRank = (c: string) => CURRENCY_RANK[c] ?? 2;

// Une las filas period+currency del worker en una sola fila por período, con las monedas
// apiladas adentro de cada columna — antes se mostraba una fila entera por moneda, lo que
// repetía el label del período tantas veces como monedas tuviera (ej. "Julio 2026" x2).
function groupByPeriod(rows: { period: string; currency: string; income: number; expense: number }[]) {
  const m = new Map<string, typeof rows>();
  for (const r of rows) { const arr = m.get(r.period) ?? []; arr.push(r); m.set(r.period, arr); }
  return [...m.entries()]
    .map(([period, rs]) => ({ period, rows: [...rs].sort((a, b) => currencyRank(a.currency) - currencyRank(b.currency)) }))
    .sort((a, b) => b.period.localeCompare(a.period));
}

function HistorialView({ data, onOpen, onExportRow, onPrintRow }: {
  data: PeriodSummary | null; onOpen: (period: string) => void; onExportRow: (period: string) => void; onPrintRow: (period: string) => void;
}) {
  const groups = groupByPeriod(data?.periods ?? []);
  return (
    <div className="panel-lite">
      <h4 style={{ margin: '0 0 8px' }}>Histórico mes a mes</h4>
      {!data && <p className="muted">Cargando…</p>}
      {data && !groups.length && <p className="muted">Todavía no hay movimientos registrados.</p>}
      {groups.length > 0 && (
        <div className="pl-grid">
          <div className="pl-row pl-row-6 pl-head"><span>Mes</span><span>Ingresos</span><span>Gastos</span><span>Balance</span><span /><span /></div>
          {groups.map(({ period, rows }) => (
            <div className="pl-row pl-row-6" key={period}>
              <span className="pl-name" style={{ textTransform: 'capitalize' }}>{monthLabel(period)}</span>
              <span className="pl-stack">{rows.map((r) => <span key={r.currency} className="pl-pos">{money(r.income, r.currency)}</span>)}</span>
              <span className="pl-stack">{rows.map((r) => <span key={r.currency} className="pl-neg">{money(r.expense, r.currency)}</span>)}</span>
              <span className="pl-stack">{rows.map((r) => { const result = r.income - r.expense; return <span key={r.currency} className={result >= 0 ? 'pl-pos' : 'pl-neg'}>{money(result, r.currency)}</span>; })}</span>
              <span className="pl-row-icons">
                <Button variant="ghost" size="icon" title="Imprimir" onClick={() => onPrintRow(period)}><Printer className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Descargar CSV" onClick={() => onExportRow(period)}><Download className="h-4 w-4" /></Button>
              </span>
              <span><Button variant="ghost" size="sm" onClick={() => onOpen(period)}>Ver detalle</Button></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MesView({ month, data, onOpenDay, onExportRow }: {
  month: string; data: PeriodSummary | null; onOpenDay: (day: string) => void; onExportRow: (day: string) => void;
}) {
  const groups = groupByPeriod(data?.periods ?? []);
  return (
    <div className="panel-lite">
      <h4 style={{ margin: '0 0 8px', textTransform: 'capitalize' }}>{monthLabel(month)}</h4>
      {!data && <p className="muted">Cargando…</p>}
      {data && !groups.length && <p className="muted">Sin movimientos este mes.</p>}
      {groups.length > 0 && (
        <div className="pl-grid">
          <div className="pl-row pl-row-6 pl-head"><span>Día</span><span>Ingresos</span><span>Gastos</span><span>Balance</span><span /><span /></div>
          {groups.map(({ period, rows }) => (
            <div className="pl-row pl-row-6" key={period}>
              <span className="pl-name" style={{ textTransform: 'capitalize' }}>{dayShort(period)}</span>
              <span className="pl-stack">{rows.map((r) => <span key={r.currency} className="pl-pos">{money(r.income, r.currency)}</span>)}</span>
              <span className="pl-stack">{rows.map((r) => <span key={r.currency} className="pl-neg">{money(r.expense, r.currency)}</span>)}</span>
              <span className="pl-stack">{rows.map((r) => { const result = r.income - r.expense; return <span key={r.currency} className={result >= 0 ? 'pl-pos' : 'pl-neg'}>{money(result, r.currency)}</span>; })}</span>
              <span className="pl-row-icons">
                <Button variant="ghost" size="icon" title="Descargar CSV" onClick={() => onExportRow(period)}><Download className="h-4 w-4" /></Button>
              </span>
              <span><Button variant="ghost" size="sm" onClick={() => onOpenDay(period)}>Ver detalle</Button></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiaView({ day, tx, typeFilter, setTypeFilter, catFilter, setCatFilter, onDelete }: {
  day: string; tx: Transaction[]; typeFilter: 'all' | 'income' | 'expense'; setTypeFilter: (v: 'all' | 'income' | 'expense') => void;
  catFilter: string; setCatFilter: (v: string) => void; onDelete: (t: Transaction) => void;
}) {
  return (
    <div className="panel-lite">
      <h4 style={{ margin: '0 0 8px', textTransform: 'capitalize' }}>{dayLabel(day)}</h4>
      <nav className="subnav">
        <button className={typeFilter === 'all' ? 'on' : ''} onClick={() => setTypeFilter('all')}>Todos</button>
        <button className={typeFilter === 'income' ? 'on' : ''} onClick={() => setTypeFilter('income')}>Ingresos</button>
        <button className={typeFilter === 'expense' ? 'on' : ''} onClick={() => setTypeFilter('expense')}>Gastos</button>
        {typeFilter === 'expense' && (
          <Select value={catFilter || ALL} onValueChange={(v) => setCatFilter(v === ALL ? '' : v)}>
            <SelectTrigger className="h-9 w-auto min-w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las categorías</SelectItem>
              {CAT_KEYS.map((k) => <SelectItem key={k} value={k}>{catOf(k).emoji} {catOf(k).label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </nav>
      {!tx.length && <p className="muted">Sin movimientos{typeFilter !== 'all' ? ' de este tipo' : ''} en este día.</p>}
      <div className="contract-list">
        {tx.map((t) => {
          const title = t.type === 'income'
            ? `Cobro${t.property_title ? ' · ' + t.property_title : ''}`
            : (t.category ? `${catOf(t.category).emoji} ${catOf(t.category).label}` : 'Gasto');
          const subtitle = t.description || (t.type === 'income' ? 'Recibo cobrado' : 'Sin descripción');
          return (
            <div className="contract-card" key={`${t.source}-${t.id}`}>
              <div className="ct-main">
                <div className="ct-title">
                  <span className={`chip ${t.type === 'income' ? 'ok' : 'blocked'}`}>{t.type === 'income' ? 'Ingreso' : 'Gasto'}</span>{' '}
                  {title}
                </div>
                <div className="muted small">
                  {subtitle}{t.type === 'expense' && t.property_title ? ` · ${t.property_title}` : ''}{t.method ? ` · ${METHODS[t.method] || t.method}` : ''}
                </div>
                <div className="ct-facts">
                  <span className={t.type === 'income' ? 'inc-amount' : 'exp-amount'}>{t.type === 'income' ? '+ ' : '− '}{money(t.amount, t.currency)}</span>
                </div>
              </div>
              <div className="ct-actions">
                <Button variant="ghost" size="icon" title="Eliminar" onClick={() => onDelete(t)} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Vista imprimible: oculta el resto de la página vía CSS (@media print, ver styles.css) y solo
// muestra esto — funciona para "Imprimir" y para "Guardar como PDF" desde el diálogo del browser.
function PrintSheet({ job, businessName }: { job: PrintJob | null; businessName?: string }) {
  if (!job) return null;
  const byCurrency = new Map<string, PrintJob['rows']>();
  for (const r of job.rows) { const arr = byCurrency.get(r.currency) ?? []; arr.push(r); byCurrency.set(r.currency, arr); }
  const th = { textAlign: 'left', borderBottom: '1px solid #999', padding: '4px 8px', fontSize: 12 } as const;
  const td = { borderBottom: '1px solid #ddd', padding: '4px 8px', fontSize: 13 } as const;
  return (
    <div className="print-sheet">
      <div className="print-head">
        <h2 style={{ margin: '0 0 2px' }}>{businessName || 'Reporte financiero'}</h2>
        <p className="muted" style={{ margin: 0 }}>{job.title} · Generado el {new Date().toLocaleDateString('es-AR')}</p>
      </div>
      {[...byCurrency.entries()].map(([cur, rows]) => {
        const totIncome = rows.reduce((a, r) => a + r.income, 0);
        const totExpense = rows.reduce((a, r) => a + r.expense, 0);
        return (
          <div key={cur} style={{ marginTop: 16 }}>
            <h4 style={{ margin: '0 0 6px' }}>{cur}</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Período</th><th style={th}>Ingresos</th><th style={th}>Gastos</th><th style={th}>Balance</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}><td style={td}>{r.label}</td><td style={td}>{money(r.income, cur)}</td><td style={td}>{money(r.expense, cur)}</td><td style={td}>{money(r.income - r.expense, cur)}</td></tr>
                ))}
                <tr style={{ fontWeight: 700 }}><td style={td}>Total</td><td style={td}>{money(totIncome, cur)}</td><td style={td}>{money(totExpense, cur)}</td><td style={td}>{money(totIncome - totExpense, cur)}</td></tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════ Tab Gastos: alta/edición/borrado + P&L histórico por propiedad ══════════════════════════
// Contenido original de FinancePanel, sin cambios de comportamiento — solo se agregó el campo `method`.
function GastosTab({ scope }: { scope: 'agency' | 'particular' }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [props, setProps] = useState<Property[]>([]);
  const [filterProp, setFilterProp] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const loadList = (pid: string) =>
    api<{ expenses: Expense[] }>(`/api/expenses${pid ? `?property_id=${pid}` : ''}`).then((r) => setItems(r.expenses)).catch(() => {});
  const loadSummary = () => api<FinanceSummary>('/api/expenses/summary').then(setSummary).catch(() => {});
  const reload = () => { loadList(filterProp); loadSummary(); };

  useEffect(() => {
    loadSummary();
    api<{ properties: Property[] }>('/api/properties/mine').then((r) => setProps(r.properties)).catch(() => {});
  }, [scope]);
  useEffect(() => { loadList(filterProp); }, [filterProp, scope]);

  async function del(e: Expense) {
    if (!(await confirm('¿Eliminar este gasto? No se puede deshacer.', { destructive: true, confirmLabel: 'Eliminar' }))) return;
    try { await api(`/api/expenses/${e.id}`, { method: 'DELETE' }); reload(); }
    catch (err) { toast(String((err as Error).message), 'err'); }
  }

  return (
    <div>
      <PnlSummary summary={summary} />

      <div className="panel-head">
        <h3>Gastos {items.length ? `· ${items.length}` : ''}</h3>
        <div className="row" style={{ gap: 8 }}>
          <Select value={filterProp || ALL} onValueChange={(v) => setFilterProp(v === ALL ? '' : v)}>
            <SelectTrigger className="h-9 w-auto min-w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las propiedades</SelectItem>
              {props.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNew(true)}>+ Nuevo gasto</Button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="muted">Todavía no cargaste gastos. Registrá reparaciones, limpieza, impuestos o servicios de tus propiedades para ver el resultado (ingresos − gastos).</p>
      )}
      <div className="contract-list">
        {items.map((e) => {
          const cat = catOf(e.category);
          return (
            <div className="contract-card" key={e.id}>
              <div className="ct-main">
                <div className="ct-title">
                  {cat.emoji} {e.description || cat.label}
                  {e.paid ? null : <span className="chip muted">Pendiente</span>}
                </div>
                <div className="muted small">
                  {cat.label} · {e.property_title || 'Sin propiedad'}{e.vendor ? ` · ${e.vendor}` : ''}{e.method ? ` · ${METHODS[e.method] || e.method}` : ''}
                </div>
                <div className="ct-facts">
                  <span className="exp-amount">− {money(e.amount, e.currency)}</span>
                  {e.incurred_on && <span>📅 {e.incurred_on}</span>}
                </div>
              </div>
              <div className="ct-actions">
                <Button variant="ghost" size="icon" title="Editar" onClick={() => setEditing(e)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Eliminar" onClick={() => del(e)} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      {(showNew || editing) && (
        <ExpenseForm props={props} edit={editing} defaultProp={filterProp}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); reload(); }} />
      )}
    </div>
  );
}

// Resumen ingresos vs gastos histórico por propiedad, separado por moneda (nunca se mezclan ARS/USD).
function PnlSummary({ summary }: { summary: FinanceSummary | null }) {
  if (!summary) return <p className="muted">Cargando resumen…</p>;
  if (!summary.totals.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <KpiCards totals={summary.totals} />
      {summary.rows.length > 0 && (
        <div className="panel-lite" style={{ marginTop: 12 }}>
          <h4>Por propiedad (histórico)</h4>
          <div className="pl-grid">
            <div className="pl-row pl-head"><span>Propiedad</span><span>Ingresos</span><span>Gastos</span><span>Resultado</span></div>
            {summary.rows.map((r) => {
              const result = r.income - r.expense;
              return (
                <div className="pl-row" key={`${r.property_id ?? 0}-${r.currency}`}>
                  <span className="pl-name">{r.title || 'Sin propiedad'} <span className="muted">· {r.currency}</span></span>
                  <span className="pl-pos">{money(r.income, r.currency)}</span>
                  <span className="pl-neg">{money(r.expense, r.currency)}</span>
                  <span className={result >= 0 ? 'pl-pos' : 'pl-neg'}>{money(result, r.currency)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseForm({ props, edit, defaultProp, onClose, onSaved }: {
  props: Property[]; edit: Expense | null; defaultProp: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState({
    property_id: edit?.property_id ? String(edit.property_id) : defaultProp || '',
    category: edit?.category || 'reparacion',
    description: edit?.description || '',
    amount: edit?.amount != null ? String(edit.amount) : '',
    currency: edit?.currency || 'ARS',
    // Al CREAR default hoy; al EDITAR respetá la fecha existente (o vacía si no tenía) —
    // no la pises con hoy solo por abrir el form.
    incurred_on: edit ? (edit.incurred_on || '') : new Date().toISOString().slice(0, 10),
    vendor: edit?.vendor || '',
    method: edit?.method || 'efectivo',
    paid: edit ? edit.paid === 1 : true,
    notes: edit?.notes || '',
  });
  const set = (k: string, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  async function save() {
    if (!f.amount) { toast('Ingresá el monto', 'err'); return; }
    const payload = {
      property_id: f.property_id ? Number(f.property_id) : null,
      category: f.category, description: f.description || null,
      amount: Number(f.amount), currency: f.currency,
      incurred_on: f.incurred_on || null, vendor: f.vendor || null, method: f.method || null,
      paid: f.paid, notes: f.notes || null,
    };
    try {
      if (edit) await api(`/api/expenses/${edit.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await api('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });
      onSaved();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  return (
    <Modal title={edit ? 'Editar gasto' : 'Nuevo gasto'} onClose={onClose}>
      <div className="form">
        <Select value={f.property_id || NONE} onValueChange={(v) => set('property_id', v === NONE ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Propiedad (opcional — gasto general)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Propiedad (opcional — gasto general)</SelectItem>
            {props.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="row2">
          <Select value={f.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CAT_KEYS.map((k) => <SelectItem key={k} value={k}>{catOf(k).emoji} {catOf(k).label}</SelectItem>)}
            </SelectContent>
          </Select>
          <input placeholder="Proveedor (opcional)" value={f.vendor} onChange={(e) => set('vendor', e.target.value)} />
        </div>
        <input placeholder="Descripción (ej: arreglo de canilla)" value={f.description} onChange={(e) => set('description', e.target.value)} />
        <div className="row2">
          <input type="number" placeholder="Monto" value={f.amount} onChange={(e) => set('amount', e.target.value)} />
          <Select value={f.currency} onValueChange={(v) => set('currency', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="row2">
          <label className="fld"><span>Fecha</span><input type="date" value={f.incurred_on} onChange={(e) => set('incurred_on', e.target.value)} /></label>
          <Select value={f.method} onValueChange={(v) => set('method', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="chk"><input type="checkbox" checked={f.paid} onChange={(e) => set('paid', e.target.checked)} /> Pagado</label>
        <textarea placeholder="Notas" rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        <Button onClick={save}>{edit ? 'Guardar cambios' : 'Registrar gasto'}</Button>
      </div>
    </Modal>
  );
}
