import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl, money, type Favorite, type SavedSearch } from '../lib/types';
import { toast } from '../lib/toast';

function parseQuery(json: string): Record<string, string> {
  try { const q = JSON.parse(json) || {}; const out: Record<string, string> = {}; for (const k of ['op', 'ciudad', 'min', 'max', 'amb']) if (q[k] != null && q[k] !== '') out[k] = String(q[k]); return out; }
  catch { return {}; }
}
function describe(q: Record<string, string>): string {
  const parts: string[] = [];
  if (q.op) parts.push(q.op);
  if (q.ciudad) parts.push(`en ${q.ciudad}`);
  if (q.amb) parts.push(`${q.amb}+ amb`);
  if (q.min) parts.push(`desde ${Number(q.min).toLocaleString('es-AR')}`);
  if (q.max) parts.push(`hasta ${Number(q.max).toLocaleString('es-AR')}`);
  return parts.length ? parts.join(' · ') : 'Todas las propiedades';
}

// Lado inquilino: propiedades guardadas + búsquedas con alerta por email.
export function TenantPanel() {
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  const loadFavs = () => api<{ favorites: Favorite[] }>('/api/favorites').then((r) => setFavs(r.favorites)).catch(() => {});
  const loadSearches = () => api<{ searches: SavedSearch[] }>('/api/saved-searches').then((r) => setSearches(r.searches)).catch(() => {});
  useEffect(() => { loadFavs(); loadSearches(); }, []);

  async function unfav(f: Favorite) {
    try { await api(`/api/favorites/${f.id}`, { method: 'DELETE' }); loadFavs(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function toggleNotify(s: SavedSearch) {
    try { await api(`/api/saved-searches/${s.id}`, { method: 'PATCH', body: JSON.stringify({ notify: !s.notify }) }); loadSearches(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }
  async function delSearch(s: SavedSearch) {
    try { await api(`/api/saved-searches/${s.id}`, { method: 'DELETE' }); loadSearches(); }
    catch (e) { toast(String((e as Error).message), 'err'); }
  }

  return (
    <div className="tenant">
      <section className="panel">
        <div className="row between"><h2>Propiedades guardadas</h2>{favs.length > 0 && <span className="chip">{favs.length}</span>}</div>
        {favs.length === 0 ? (
          <div className="empty-state">
            <img src="/media/site/keys.jpg" alt="" />
            <h3>Todavía no guardaste ninguna</h3>
            <p className="muted">Explorá el marketplace y tocá <b>♡ Guardar</b> en las propiedades que te gusten.</p>
            <a className="btn" href="/buscar">Buscar propiedades</a>
          </div>
        ) : (
          <div className="fav-grid">
            {favs.map((f) => (
              <div className="fav-card" key={f.id}>
                <a className="fav-ph" href={`/propiedad/${f.id}`}>
                  {f.cover_key ? <img src={mediaUrl(f.cover_key)} alt="" /> : <span className="empty-ic">🏡</span>}
                </a>
                <div className="fav-body">
                  <div className="fav-price">{money(f.price, f.currency, f.price_period)}</div>
                  <a className="fav-ttl" href={`/propiedad/${f.id}`}>{f.title}</a>
                  <div className="muted small">{f.operation}{f.city ? ` · ${f.city}` : ''}</div>
                </div>
                <button className="icon-btn danger" title="Quitar de guardados" onClick={() => unfav(f)}>♥</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="row between"><h2>Búsquedas guardadas</h2><a className="btn ghost sm" href="/buscar">Nueva búsqueda</a></div>
        <p className="muted small">Te avisamos por email cuando aparezca una propiedad nueva que matchee.</p>
        {searches.length === 0 ? (
          <p className="muted">No tenés búsquedas guardadas. Hacé una búsqueda en el marketplace y tocá <b>🔔 Guardar búsqueda</b>.</p>
        ) : (
          <div className="search-list">
            {searches.map((s) => {
              const q = parseQuery(s.query_json);
              const qs = new URLSearchParams(q).toString();
              return (
                <div className="search-row" key={s.id}>
                  <div>
                    <div className="search-desc">🔎 {describe(q)}</div>
                    <div className="muted small">{s.notify ? '🔔 Alertas activadas' : '🔕 Alertas pausadas'}</div>
                  </div>
                  <div className="search-acts">
                    <a className="link-btn" href={`/buscar${qs ? '?' + qs : ''}`}>Ver</a>
                    <button className="link-btn" onClick={() => toggleNotify(s)}>{s.notify ? 'Pausar' : 'Activar'}</button>
                    <button className="link-btn danger" onClick={() => delSearch(s)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
