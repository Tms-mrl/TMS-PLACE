import { useEffect, useState } from 'react';
import {
  Home, CheckCircle2, Clock, Key, Banknote, Megaphone, Users, MapPinned,
} from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { api } from '../lib/api';
import { useVisited } from '../lib/use-visited';
import type { Agency, Branch, Inquiry, Member, Sub, Summary, User } from '../lib/types';
import { PropertiesPanel, type PropPreset } from './properties-panel';
import { ClientsPanel } from './clients-panel';
import { AgencyMap } from './agency-map';
import { DealsPanel } from './deals-panel';
import { ContractsPanel } from './contracts-panel';
import { FinancePanel } from './finance-panel';
import { SettingsPanel } from './account-menu';
import { toast } from '../lib/toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConfirm } from './ui/use-confirm';

const NONE = '_none';

const origin = typeof window !== 'undefined' ? window.location.origin : '';
const accessUrl = (t: string | null) => (t ? `${origin}/i/${t}` : '');
const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => {}, () => {});

export type Tab = 'resumen' | 'propiedades' | 'mapa' | 'clientes' | 'operaciones' | 'contratos' | 'finanzas' | 'consultas' | 'sucursales' | 'equipo' | 'configuracion';
const TABS: { k: Tab; label: string }[] = [
  { k: 'resumen', label: 'Resumen' },
  { k: 'propiedades', label: 'Propiedades' },
  { k: 'mapa', label: 'Mapa' },
  { k: 'clientes', label: 'Clientes' },
  { k: 'operaciones', label: 'Operaciones' },
  { k: 'contratos', label: 'Contratos' },
  { k: 'finanzas', label: 'Finanzas' },
  { k: 'consultas', label: 'Consultas' },
  { k: 'sucursales', label: 'Sucursales' },
  { k: 'equipo', label: 'Equipo' },
  { k: 'configuracion', label: 'Configuración' },
];

export function AgencyWorkspace({ agency, user, onLogout, tab, setTab }: {
  agency: Agency; user: User; onLogout: () => void; tab: Tab; setTab: (t: Tab) => void;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ag, setAg] = useState<Agency>(agency);
  const [preset, setPreset] = useState<PropPreset | undefined>(undefined);
  const visited = useVisited(tab);

  const loadMine = () => api<{ agency: Agency; role: string | null; subscription: Sub; branches: Branch[] }>('/api/agencies/mine')
    .then((r) => { setSub(r.subscription); setBranches(r.branches || []); if (r.agency) setAg({ ...r.agency, role: r.role || r.agency.role }); }).catch(() => {});
  const loadSummary = () => api<Summary>('/api/agencies/summary').then(setSummary).catch(() => {});
  useEffect(() => { loadMine(); loadSummary(); }, []);

  // Desde un KPI del Resumen → salta a Propiedades con el filtro aplicado.
  const goProps = (p: PropPreset) => { setPreset(p); setTab('propiedades'); };

  return (
    <div className="ws">
      {/* Se sacó el título "<nombre> / Panel de la inmobiliaria" a pedido de Tomy
          (2026-09-11) — con un solo tenant no aporta nada, es obvio de qué panel es.
          El badge de suscripción queda, alineado a la derecha (antes lo empujaba el
          título con justify-content: space-between). */}
      <div className="ws-head" style={{ justifyContent: 'flex-end' }}>
        <SubBadge sub={sub} />
      </div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.k} className={tab === t.k ? 'tab active' : 'tab'} onClick={() => { setPreset(undefined); setTab(t.k); }}>{t.label}</button>
        ))}
      </nav>
      {visited.has('resumen') && <div hidden={tab !== 'resumen'}><Resumen summary={summary} branches={branches} onFilter={goProps} onNav={setTab} /></div>}
      {visited.has('propiedades') && <div hidden={tab !== 'propiedades'}><PropertiesPanel branches={branches} onChanged={loadSummary} preset={preset} /></div>}
      {visited.has('mapa') && <div hidden={tab !== 'mapa'}><AgencyMap branches={branches} active={tab === 'mapa'} /></div>}
      {visited.has('clientes') && <div hidden={tab !== 'clientes'}><ClientsPanel /></div>}
      {visited.has('operaciones') && <div hidden={tab !== 'operaciones'}><DealsPanel /></div>}
      {visited.has('contratos') && <div hidden={tab !== 'contratos'}><ContractsPanel scope="agency" /></div>}
      {visited.has('finanzas') && <div hidden={tab !== 'finanzas'}><FinancePanel scope="agency" businessName={ag.name} /></div>}
      {visited.has('consultas') && <div hidden={tab !== 'consultas'}><ConsultasPanel onGoSettings={() => setTab('configuracion')} /></div>}
      {visited.has('sucursales') && <div hidden={tab !== 'sucursales'}><BranchesPanel branches={branches} summary={summary} onChanged={() => { loadMine(); loadSummary(); }} /></div>}
      {visited.has('equipo') && <div hidden={tab !== 'equipo'}><TeamPanel branches={branches} /></div>}
      {visited.has('configuracion') && <div hidden={tab !== 'configuracion'}><SettingsPanel user={user} onLogout={onLogout} agency={ag} onAgencySaved={loadMine} /></div>}
    </div>
  );
}

function TeamPanel({ branches }: { branches: Branch[] }) {
  const confirm = useConfirm();
  const [members, setMembers] = useState<Member[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [nf, setNf] = useState({ name: '', email: '', role: 'agent', branch: '' });
  const [newLink, setNewLink] = useState('');
  const [invited, setInvited] = useState('');
  const load = () => api<{ members: Member[]; role: string | null; ownerUserId: number }>('/api/agencies/members')
    .then((r) => { setMembers(r.members); setRole(r.role); setOwnerId(r.ownerUserId); }).catch(() => {});
  useEffect(() => { load(); }, []);
  const isAdmin = role === 'admin';

  async function invite() {
    if (!nf.name.trim()) return;
    try {
      // Con email = invitación a su cuenta del ecosistema (entra con su Google de siempre).
      // Sin email = agente sin cuenta, se le genera un link de acceso.
      const body = { name: nf.name, role: nf.role, branch_id: nf.branch ? Number(nf.branch) : null, email: nf.email.trim() || undefined };
      const r = await api<{ accessUrl?: string; invitedEmail?: string }>('/api/agencies/members', { method: 'POST', body: JSON.stringify(body) });
      setNewLink(r.accessUrl || ''); setInvited(r.invitedEmail || '');
      setNf({ name: '', email: '', role: 'agent', branch: '' }); load();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function patch(uid: number, body: Record<string, unknown>) { try { await api(`/api/agencies/members/${uid}`, { method: 'PATCH', body: JSON.stringify(body) }); load(); } catch (e) { toast(String((e as Error).message), 'err'); } }
  async function remove(uid: number, name: string) { if (!(await confirm(`¿Quitar a ${name} del equipo?`, { destructive: true, confirmLabel: 'Quitar' }))) return; try { await api(`/api/agencies/members/${uid}`, { method: 'DELETE' }); load(); } catch (e) { toast(String((e as Error).message), 'err'); } }

  return (
    <div>
      {isAdmin && (
        <div className="panel-lite" style={{ marginBottom: 16 }}>
          <h4>Sumar al equipo</h4>
          <p className="muted small">
            <b>Con email</b>: entra con su cuenta de siempre (la del ecosistema) y ve este panel.
            <br /><b>Sin email</b>: se genera un <b>link de acceso único</b> para que entre sin contraseña.
          </p>
          <div className="addrow">
            <input placeholder="Nombre" value={nf.name} onChange={(e) => setNf((s) => ({ ...s, name: e.target.value }))} />
            <input type="email" placeholder="Email (opcional)" value={nf.email} onChange={(e) => setNf((s) => ({ ...s, email: e.target.value }))} />
            <Select value={nf.role} onValueChange={(v) => setNf((s) => ({ ...s, role: v }))}>
              <SelectTrigger className="h-9 w-auto min-w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="agent">Agente</SelectItem><SelectItem value="manager">Gerente</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
            </Select>
            <Select value={nf.branch || NONE} onValueChange={(v) => setNf((s) => ({ ...s, branch: v === NONE ? '' : v }))}>
              <SelectTrigger className="h-9 w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin sucursal</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={invite}>Invitar</Button>
          </div>
          {newLink && <div className="newlink"><b>Link del agente 🎉</b><div className="muted small">Pasáselo por WhatsApp/mail. Con ese link entra directo.</div><div className="copyrow"><code>{newLink}</code><Button size="sm" onClick={() => copy(newLink)}>Copiar</Button></div></div>}
          {invited && <div className="newlink"><b>Invitado ✅</b><div className="muted small">Avisale a <b>{invited}</b> que entre por "Ingresar" con esa cuenta: va a ver este panel directamente.</div></div>}
        </div>
      )}
      <div className="panel-head"><h3>Equipo · {members.length}</h3></div>
      <div className="client-list">
        {members.map((m) => (
          <div className="client-card" key={m.member_id}>
            <div className="client-main">
              <div className="client-name">{m.name || m.email} {m.user_id === ownerId ? <span className="chip">dueño</span> : <span className="chip ok">{m.role}</span>}</div>
              {isAdmin && m.user_id !== ownerId ? (
                <div className="row" style={{ gap: 8, marginTop: 6 }}>
                  <Select value={m.role} onValueChange={(v) => patch(m.user_id, { role: v })}>
                    <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="agent">Agente</SelectItem><SelectItem value="manager">Gerente</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                  </Select>
                  <Select value={m.branch_id != null ? String(m.branch_id) : NONE} onValueChange={(v) => patch(m.user_id, { branch_id: v === NONE ? null : Number(v) })}>
                    <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin sucursal</SelectItem>
                      {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="muted small">{m.branch_name ? `🏢 ${m.branch_name}` : 'Sin sucursal'}</div>
              )}
              {isAdmin && m.access_token && <div className="copyrow"><code>{accessUrl(m.access_token)}</code><Button variant="ghost" size="sm" onClick={() => copy(accessUrl(m.access_token))}>Copiar link</Button></div>}
            </div>
            {isAdmin && m.user_id !== ownerId && <div className="client-actions"><Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(m.user_id, m.name || m.email)}>Quitar</Button></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsultasPanel({ onGoSettings }: { onGoSettings: () => void }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  useEffect(() => {
    api<{ inquiries: Inquiry[] }>('/api/agencies/inquiries').then((r) => setInquiries(r.inquiries)).catch(() => {});
  }, []);
  return (
    <div>
      <div className="panel-lite" style={{ marginBottom: 16 }}>
        <h4>WhatsApp para consultas</h4>
        <p className="muted small">Los clientes ven un botón <b>“Consultar por WhatsApp”</b> en cada propiedad publicada. Configurá el número con código de país (ej: 5493415551234) desde Configuración.</p>
        <button className="btn ghost sm" onClick={onGoSettings}>Ir a Configuración</button>
      </div>
      <div className="panel-head"><h3>Consultas recibidas · {inquiries.length}</h3></div>
      {inquiries.length === 0 ? (
        <p className="muted">Todavía no hay consultas. Cuando un cliente toque “Consultar por WhatsApp” en una propiedad, va a quedar registrada acá.</p>
      ) : (
        <div className="client-list">
          {inquiries.map((q) => (
            <div className="client-card" key={q.id}>
              <div className="client-main">
                <div className="client-name">{q.property_title} {q.source === 'whatsapp' && <span className="chip ok">WhatsApp</span>}</div>
                <div className="muted small">{q.message || 'Consulta'} · {new Date(q.created_at.replace(' ', 'T') + 'Z').toLocaleString('es-AR')}</div>
              </div>
              {q.phone && (
                <div className="client-actions">
                  <a className="wa-icon-btn" href={`https://wa.me/${q.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="Responder por WhatsApp">
                    <SiWhatsapp size={18} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Resumen({ summary, branches, onFilter, onNav }: {
  summary: Summary | null; branches: Branch[]; onFilter: (p: PropPreset) => void; onNav: (t: Tab) => void;
}) {
  if (!summary) return <p className="muted">Cargando resumen…</p>;
  const stat = (k: string) => summary.byStatus?.find((s) => s.status === k)?.n ?? 0;
  const clientsTotal = (summary.clientsByKind || []).reduce((a, c) => a + c.n, 0);
  const kpis: [typeof Home, string, number, () => void][] = [
    [Home, 'Propiedades', summary.totals?.total ?? 0, () => onFilter({})],
    [CheckCircle2, 'Disponibles', stat('disponible'), () => onFilter({ status: 'disponible' })],
    [Clock, 'Reservadas', stat('reservada'), () => onFilter({ status: 'reservada' })],
    [Key, 'Alquiladas', stat('alquilada'), () => onFilter({ status: 'alquilada' })],
    [Banknote, 'Vendidas', stat('vendida'), () => onFilter({ status: 'vendida' })],
    [Megaphone, 'Publicadas', summary.totals?.publicadas ?? 0, () => onFilter({ published: 'yes' })],
    [Users, 'Clientes', clientsTotal, () => onNav('clientes')],
    [MapPinned, 'Sucursales', branches.length, () => onNav('sucursales')],
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {kpis.map(([Icon, l, v, fn]) => (
          <button key={l} onClick={fn} className="text-left">
            <Card className="p-3 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{l}</span>
              </div>
              <div className="mt-1 text-2xl font-semibold">{v}</div>
            </Card>
          </button>
        ))}
      </div>
      <div className="two-col">
        <div className="panel-lite">
          <h4>Por sucursal</h4>
          {(summary.byBranch || []).length === 0 ? <p className="muted small">Sin sucursales.</p> :
            (summary.byBranch || []).map((b) => (
              <button className="line line-btn" key={b.id} onClick={() => onFilter({ branch: b.id })}><span>🏢 {b.name}</span><span className="muted">{b.disponibles}/{b.n} disponibles ›</span></button>
            ))}
        </div>
        <div className="panel-lite">
          <h4>Por operación</h4>
          {(summary.byOperation || []).length === 0 ? <p className="muted small">Sin propiedades.</p> :
            (summary.byOperation || []).map((o) => (
              <button className="line line-btn" key={o.operation} onClick={() => onFilter({ op: o.operation })}><span className="tag">{o.operation}</span><span className="muted">{o.n} ›</span></button>
            ))}
        </div>
      </div>
    </div>
  );
}

function BranchesPanel({ branches, summary, onChanged }: { branches: Branch[]; summary: Summary | null; onChanged: () => void }) {
  return (
    <div>
      <div className="panel-head"><h3>Sucursales · {branches.length}</h3></div>
      <div className="branch-list">
        {branches.map((b) => {
          const s = summary?.byBranch?.find((x) => x.id === b.id);
          return (
            <div className="branch-card" key={b.id}>
              <b>🏢 {b.name}</b>
              <div className="muted small">{b.address || 'Sin dirección'}{b.phone ? ` · ${b.phone}` : ''}</div>
              {s && <div className="chip ok">{s.disponibles} disponibles / {s.n} propiedades</div>}
            </div>
          );
        })}
      </div>
      <AddBranch onAdded={onChanged} />
    </div>
  );
}

function AddBranch({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  async function add() {
    if (!name.trim()) return;
    try {
      await api('/api/agencies/branches', { method: 'POST', body: JSON.stringify({ name, address }) });
      setName(''); setAddress(''); onAdded();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  return (
    <div className="addrow">
      <input placeholder="Nombre de sucursal" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Dirección (opcional)" value={address} onChange={(e) => setAddress(e.target.value)} />
      <button className="btn ghost" onClick={add}>Agregar sucursal</button>
    </div>
  );
}

function SubBadge({ sub }: { sub: Sub }) {
  if (!sub) return null;
  if (sub.blocked) return <span className="chip blocked">Trial vencido — contactá a Coopen</span>;
  const left = sub.days_left != null ? `${sub.days_left} días` : '';
  return <span className={sub.status === 'active' ? 'chip ok' : 'chip'}>{sub.status === 'active' ? `Activa · ${left}` : `Trial · ${left}`}</span>;
}
