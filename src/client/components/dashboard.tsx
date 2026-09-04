import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useVisited } from '../lib/use-visited';
import type { Agency, User } from '../lib/types';
import { AgencyWorkspace, type Tab as AgencyTab } from './agency-workspace';
import { TenantPanel } from './tenant-panel';
import { AccountMenu, SettingsPanel } from './account-menu';

type NonAgencyView = 'guardados' | 'configuracion';

export function Dashboard({ user, brandName, logoUrl, onLogout }: { user: User; brandName: string; logoUrl?: string | null; onLogout: () => void }) {
  const [agency, setAgency] = useState<Agency | null>(user.roles.agency);
  const [loaded, setLoaded] = useState(false);
  const [nonAgencyView, setNonAgencyView] = useState<NonAgencyView>('guardados');
  const [agencyTab, setAgencyTab] = useState<AgencyTab>('resumen');

  useEffect(() => {
    api<{ agency: Agency | null; role: string | null }>('/api/agencies/mine')
      .then((r) => setAgency(r.agency ? { ...r.agency, role: r.role || r.agency.role } : null))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        {/* El logo manda; si la inmobiliaria no cargó ninguno, queda el nombre en texto. */}
        <a className="brand" href="/">
          {logoUrl ? <img className="brand-logo" src={logoUrl} alt={brandName} /> : brandName}
        </a>
        <div className="who">
          {user.isSuperAdmin && <a className="chip admin" href="/app/admin">Admin de Coopen</a>}
          <AccountMenu
            user={user}
            onLogout={onLogout}
            onFavorites={agency ? undefined : () => setNonAgencyView('guardados')}
            onSettings={() => (agency ? setAgencyTab('configuracion') : setNonAgencyView('configuracion'))}
          />
        </div>
      </header>
      <main className="content content-wide">
        {!loaded ? <p className="muted">Cargando…</p>
          : agency ? <AgencyWorkspace agency={agency} user={user} onLogout={onLogout} tab={agencyTab} setTab={setAgencyTab} />
          : <NonAgencyHome user={user} view={nonAgencyView} setView={setNonAgencyView} onLogout={onLogout} />}
      </main>
    </div>
  );
}

// Home del user sin inmobiliaria: consumidor público (busca/alquila/compra), sin
// autoservicio de publicación — solo favoritos/alertas guardadas + su cuenta. Las
// inmobiliarias las da de alta el super-admin (ver AdminConsole); no hay forma de
// que un login de Google normal termine gestionando propiedades. El view vive en
// Dashboard para que el menú de cuenta pueda saltar directo a cualquier tab.
function NonAgencyHome({ user, view, setView, onLogout }: {
  user: User; view: NonAgencyView; setView: (v: NonAgencyView) => void; onLogout: () => void;
}) {
  const visited = useVisited(view);
  return (
    <>
      <nav className="subnav">
        <button className={view === 'guardados' ? 'on' : ''} onClick={() => setView('guardados')}>Favoritos y alertas</button>
        <button className={view === 'configuracion' ? 'on' : ''} onClick={() => setView('configuracion')}>Configuración</button>
      </nav>
      {visited.has('guardados') && <div hidden={view !== 'guardados'}><TenantPanel /></div>}
      {visited.has('configuracion') && <div hidden={view !== 'configuracion'}><SettingsPanel user={user} onLogout={onLogout} /></div>}
    </>
  );
}
