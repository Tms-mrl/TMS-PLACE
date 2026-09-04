import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { User } from '../lib/types';
import { toast } from '../lib/toast';
import { AskModal } from './property-form';
import { useConfirm } from './ui/use-confirm';
import { AccountMenu } from './account-menu';

type AdminAgency = {
  id: number; name: string; owner_email: string; status: string | null;
  trial_ends_at: string | null; active_until: string | null; blocked: number;
  days_left: number | null; properties: number; access_token: string | null;
};

type AdminUser = {
  id: number; email: string; name: string | null; auth_sub: string;
  role: string | null; branch_name: string | null; other_agencies: string | null;
};

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', manager: 'Manager', agent: 'Agente' };

// De dónde salió la cuenta. Importa para no confundir a una persona real con los usuarios
// sintéticos que crea el link de acceso (esos no tienen mail de verdad).
function accountOrigin(sub: string): string {
  if (sub.startsWith('coopen:')) return 'cuenta del ecosistema';
  if (sub.startsWith('google:')) return 'Google';
  if (sub.startsWith('invite:')) return 'invitada · todavía no entró';
  if (sub.startsWith('local:')) return 'link de acceso';
  return 'cuenta';
}

const origin = typeof window !== 'undefined' ? window.location.origin : '';
const accessUrl = (t: string | null) => (t ? `${origin}/i/${t}` : '');
function copy(text: string) {
  navigator.clipboard?.writeText(text).then(() => {}, () => {});
}

// Consola de Coopen (super-admin): crear inmobiliarias + link de acceso, gestionar trials.
export function AdminConsole({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [ags, setAgs] = useState<AdminAgency[]>([]);
  const [name, setName] = useState('');
  const [newLink, setNewLink] = useState('');

  const load = () => api<{ agencies: AdminAgency[] }>('/api/admin/agencies').then((r) => setAgs(r.agencies)).catch(() => {});
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    try {
      const r = await api<{ accessUrl: string }>('/api/admin/agencies', { method: 'POST', body: JSON.stringify({ name }) });
      setNewLink(r.accessUrl); setName(''); load();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/app">Coopen<span>Places</span> · Admin</a>
        <div className="who"><AccountMenu user={user} onLogout={onLogout} /></div>
      </header>
      <main className="content">
        <div className="ws-head"><h2>Consola de Coopen</h2><a className="link" href="/app">← Mi panel</a></div>

        <section className="panel">
          <h2>Crear inmobiliaria</h2>
          <p className="muted">Se genera un espacio nuevo con un <b>link de acceso único</b> para el cliente: entra directo a su CRM/ERP, sin contraseña. Podés revocarlo cuando quieras.</p>
          <div className="addrow">
            <input placeholder="Nombre (ej: ElMuelle)" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn" onClick={create}>Crear + generar link</button>
          </div>
          {newLink && (
            <div className="newlink">
              <b>Link de acceso creado 🎉</b>
              <div className="muted small">Pasáselo al cliente por WhatsApp/mail. Con ese link entra directo a su panel.</div>
              <div className="copyrow"><code>{newLink}</code><button className="btn sm" onClick={() => copy(newLink)}>Copiar</button></div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Inmobiliarias · {ags.length}</h3></div>
          {ags.length === 0 ? <p className="muted">Todavía no hay inmobiliarias.</p> : (
            <div className="client-list">
              {ags.map((a) => <AgencyRow key={a.id} a={a} onReload={load} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AgencyRow({ a, onReload }: { a: AdminAgency; onReload: () => void }) {
  const confirm = useConfirm();
  const [link, setLink] = useState(accessUrl(a.access_token));
  const [ask, setAsk] = useState<'extend' | 'paid' | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  async function regen() {
    if (!(await confirm(`¿Regenerar el link de ${a.name}? El anterior deja de funcionar.`))) return;
    try { const r = await api<{ accessUrl: string }>(`/api/admin/agencies/${a.id}/regenerate-access`, { method: 'POST' }); setLink(r.accessUrl); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function submitAsk(v: string) {
    const n = Number(v); setAsk(null);
    if (!Number.isFinite(n) || n <= 0) return;
    try {
      if (ask === 'extend') await api(`/api/admin/agencies/${a.id}/extend-trial`, { method: 'POST', body: JSON.stringify({ days: n }) });
      else await api(`/api/admin/agencies/${a.id}/mark-paid`, { method: 'POST', body: JSON.stringify({ months: n }) });
      onReload();
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }
  const badge = a.blocked
    ? <span className="chip blocked">bloqueada</span>
    : <span className="chip ok">{a.status === 'active' ? 'activa' : 'trial'}{a.days_left != null ? ` · ${a.days_left}d` : ''}</span>;
  return (
    <div className="client-card">
      <div className="client-main">
        <div className="client-name">{a.name} {badge}</div>
        <div className="muted small">{a.properties} propiedades · {a.owner_email}</div>
        {link && <div className="copyrow"><code>{link}</code><button className="link-btn" onClick={() => copy(link)}>Copiar</button></div>}
      </div>
      <div className="client-actions">
        <button className="link-btn" onClick={() => setShowUsers((s) => !s)}>{showUsers ? 'Ocultar cuentas' : 'Cuentas'}</button>
        <button className="link-btn" onClick={regen}>Regenerar link</button>
        <button className="link-btn" onClick={() => setAsk('extend')}>+ Trial</button>
        <button className="link-btn" onClick={() => setAsk('paid')}>Marcar pago</button>
      </div>
      {showUsers && <AgencyUsers agencyId={a.id} agencyName={a.name} />}
      {ask && <AskModal title={ask === 'extend' ? 'Extender trial' : 'Marcar como paga'} label={ask === 'extend' ? '¿Cuántos días de trial?' : '¿Cuántos meses pagados?'} placeholder={ask === 'extend' ? '30' : '1'} defaultValue={ask === 'extend' ? '30' : '1'} cta="Aplicar" onSubmit={submitAsk} onClose={() => setAsk(null)} />}
    </div>
  );
}

/**
 * Cuentas de usuario de una inmobiliaria.
 *
 * Lista TODAS las cuentas del deploy, no solo el equipo: el caso que hay que resolver es
 * el de alguien que entró con su Google y quedó sin panel (existe en `users` pero sin
 * membresía). El acceso se cambia con un solo select por fila — "Sin acceso" lo saca.
 *
 * Admin acá = admin de ESA inmobiliaria. El super-admin de Coopen es una allowlist en una
 * var del Worker y no se toca desde esta pantalla.
 */
function AgencyUsers({ agencyId, agencyName }: { agencyId: number; agencyName: string }) {
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ users: AdminUser[]; ownerUserId: number }>(`/api/admin/agencies/${agencyId}/users`)
      .then((r) => { if (alive) { setUsers(r.users); setOwnerId(r.ownerUserId); } })
      .catch((e) => toast(String((e as Error).message), 'err'));
    return () => { alive = false; };
  }, [agencyId]);

  const reload = () => api<{ users: AdminUser[]; ownerUserId: number }>(`/api/admin/agencies/${agencyId}/users`)
    .then((r) => { setUsers(r.users); setOwnerId(r.ownerUserId); })
    .catch(() => {});

  async function setRole(u: AdminUser, role: string) {
    const who = u.name || u.email;
    if (!role && !(await confirm(`¿Quitarle el acceso a ${who}? Deja de ver el panel de ${agencyName}.`, { destructive: true, confirmLabel: 'Quitar acceso' }))) return;
    setBusy(u.id);
    try {
      if (role) await api(`/api/admin/agencies/${agencyId}/members`, { method: 'POST', body: JSON.stringify({ user_id: u.id, role }) });
      else await api(`/api/admin/agencies/${agencyId}/members/${u.id}`, { method: 'DELETE' });
      await reload();
      toast(role ? `${who} ahora es ${ROLE_LABEL[role]} de ${agencyName}` : `${who} ya no tiene acceso`);
    } catch (e) { toast(String((e as Error).message), 'err'); }
    finally { setBusy(null); }
  }

  if (!users) return <div className="acct-block muted small">Cargando cuentas…</div>;
  const team = users.filter((u) => u.role).length;
  return (
    <div className="acct-block">
      <div className="acct-head">
        <b>Cuentas · {users.length}</b>
        <span className="muted small">{team} con acceso a {agencyName}</span>
      </div>
      {users.length === 0 ? <p className="muted small">Todavía no entró nadie.</p> : (
        <div className="acct-list">
          {users.map((u) => {
            const isOwner = u.id === ownerId;
            return (
              <div key={u.id} className={u.role ? 'acct-row in' : 'acct-row'}>
                <div className="acct-who">
                  <div className="acct-name">
                    {u.name || u.email}
                    {isOwner && <span className="chip ok">dueño</span>}
                    {u.role === 'admin' && !isOwner && <span className="chip ok">admin</span>}
                  </div>
                  <div className="muted small">
                    {u.name ? `${u.email} · ` : ''}{accountOrigin(u.auth_sub)}
                    {u.branch_name ? ` · ${u.branch_name}` : ''}
                    {u.other_agencies ? ` · también en ${u.other_agencies}` : ''}
                  </div>
                </div>
                <select
                  className="acct-role"
                  value={u.role || ''}
                  disabled={busy === u.id || isOwner}
                  title={isOwner ? 'El dueño de la inmobiliaria no se puede degradar' : 'Acceso a esta inmobiliaria'}
                  onChange={(e) => setRole(u, e.target.value)}
                >
                  <option value="">Sin acceso</option>
                  <option value="agent">Agente</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
