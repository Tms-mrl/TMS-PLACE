import { useEffect, useState } from 'react';
import { api } from './lib/api';
import type { Me } from './lib/types';
import { Dashboard } from './components/dashboard';
import { AdminConsole } from './components/admin-console';

const DEFAULT_BRAND = 'Coopen Places';
/** Flag de "ya te mandé al proveedor": corta el loop si el usuario cancela y vuelve. */
const LOGIN_SENT = 'places_login_sent';

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [brandName, setBrandName] = useState(DEFAULT_BRAND);
  // Logo de la inmobiliaria (white-label). null = se muestra el nombre en texto.
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // Qué camino de login ofrece ESTE deploy: el SSO del ecosistema o el Google propio.
  // No están los dos en todos lados: un white-label sin GOOGLE_CLIENT_ID solo tiene SSO,
  // y un deploy standalone sin AUTH_URL solo tiene Google. Mandar al que no está
  // configurado devuelve 500 ("Login no configurado") — pasó en El Muelle.
  const [sso, setSso] = useState(false);
  // El redirect automático al login necesita saber ANTES cuál de los dos caminos usar:
  // sin esto mandaría siempre al de Google y en un white-label eso es un 500.
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    api<Me>('/api/auth/me')
      .then(setMe)
      .catch((e) => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
    api<{ brandName: string; logoUrl: string | null }>('/api/site')
      .then((r) => { setBrandName(r.brandName || DEFAULT_BRAND); setLogoUrl(r.logoUrl || null); })
      .catch(() => {});
    api<{ enabled: boolean }>('/api/auth/coopen-config')
      .then((r) => setSso(!!r.enabled))
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => { document.title = `${brandName} — Panel`; }, [brandName]);

  function login() {
    const path = sso ? '/api/auth/coopen' : '/api/auth/google';
    // Marca que ya mandamos al proveedor. Si el usuario cancela allá y vuelve, NO lo
    // reenviamos solo: le mostramos la pantalla con el botón (si no, es un loop del que
    // no puede salir). Se limpia al entrar bien y al desloguearse.
    try { sessionStorage.setItem(LOGIN_SENT, '1'); } catch { /* modo privado */ }
    window.location.href = `${path}?return_to=${encodeURIComponent('/app')}`;
  }
  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    try { sessionStorage.removeItem(LOGIN_SENT); } catch { /* modo privado */ }
    window.location.reload();
  }

  if (loading || (!me?.authed && !authReady)) return <div className="center muted">Cargando…</div>;
  if (err) return <div className="center err">Error: {err}</div>;
  if (!me?.authed || !me.user) {
    // Entrar a /app sin sesión manda DIRECTO al proveedor: la pantalla intermedia con un
    // solo botón era un click de más. Solo se muestra si ya volvimos de un intento.
    let alreadyTried = true;
    try { alreadyTried = sessionStorage.getItem(LOGIN_SENT) === '1'; } catch { /* modo privado: mostrar la pantalla */ }
    if (!alreadyTried) { login(); return <div className="center muted">Llevándote al login…</div>; }
    return <Login brandName={brandName} onLogin={login} />;
  }
  try { sessionStorage.removeItem(LOGIN_SENT); } catch { /* noop */ }
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/app/admin') && me.user.isSuperAdmin) return <AdminConsole user={me.user} onLogout={logout} />;
  return <Dashboard user={me.user} brandName={brandName} logoUrl={logoUrl} onLogout={logout} />;
}

/**
 * Pantalla de login. Ya NO es el primer paso: entrar a /app manda directo al proveedor.
 * Esto se ve solo cuando el usuario volvió sin sesión (canceló allá), así que el copy
 * asume el reintento en vez de presentar el producto.
 */
function Login({ brandName, onLogin }: { brandName: string; onLogin: () => void }) {
  return (
    <div className="center">
      <div className="card-lg">
        <h1>{brandName}</h1>
        <p className="muted">Panel de gestión inmobiliaria.</p>
        <button className="btn" onClick={onLogin}>Iniciar sesión</button>
        <p className="muted small">
          No pudimos iniciar tu sesión. Probá de nuevo con tu cuenta de Google.
        </p>
        <a className="link" href="/">← Volver al marketplace</a>
      </div>
    </div>
  );
}
