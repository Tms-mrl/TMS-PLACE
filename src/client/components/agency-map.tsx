import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { money, type Branch, type Property } from '../lib/types';
import { PropertyForm, type InitialLoc } from './property-form';

const esc = (s: string) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

// Mapa de las propiedades de la inmobiliaria + menú propio en click derecho ("publicar acá").
export function AgencyMap({ branches, active }: { branches: Branch[]; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [props, setProps] = useState<Property[]>([]);
  const [menu, setMenu] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [newAt, setNewAt] = useState<InitialLoc | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => api<{ properties: Property[] }>('/api/properties/mine').then((r) => setProps(r.properties)).catch(() => {});
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView([-34.6, -58.4], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    map.on('contextmenu', (e: any) => { e.originalEvent.preventDefault(); const p = e.containerPoint; setMenu({ x: p.x, y: p.y, lat: e.latlng.lat, lng: e.latlng.lng }); });
    map.on('click', () => setMenu(null));
    map.on('movestart', () => setMenu(null));
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
  }, []);

  // El panel queda montado-y-oculto (display:none) al cambiar de tab (ver useVisited en
  // AgencyWorkspace); Leaflet mide el contenedor al crearse, así que al volver a mostrarse
  // hay que forzarle un recálculo o los tiles quedan mal dimensionados/recortados.
  useEffect(() => {
    if (!active || !mapRef.current) return;
    const id = setTimeout(() => mapRef.current?.invalidateSize(), 60);
    return () => clearTimeout(id);
  }, [active]);

  useEffect(() => {
    const L = (window as any).L, map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const grp = L.layerGroup();
    const b: [number, number][] = [];
    props.forEach((p) => {
      if (p.lat != null && p.lng != null) {
        const m = L.circleMarker([p.lat, p.lng], { radius: 9, weight: 3, color: '#fff', fillColor: '#bd5a37', fillOpacity: 1 }).addTo(grp);
        m.bindPopup(`<a href="/propiedad/${p.id}" target="_blank" style="color:#221d17;text-decoration:none"><b>${esc(money(p.price, p.currency, p.price_period))}</b><br>${esc(p.title)}</a>`);
        b.push([p.lat, p.lng]);
      }
    });
    grp.addTo(map); layerRef.current = grp;
    if (b.length) map.fitBounds(b, { padding: [50, 50], maxZoom: 13 });
  }, [props]);

  async function publishHere() {
    if (!menu) return;
    const { lat, lng } = menu; setMenu(null); setLoading(true);
    let city = '', province = '', address = '';
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`, { headers: { 'Accept-Language': 'es' } });
      const j = await r.json(); const a = j.address || {};
      address = [a.road, a.house_number].filter(Boolean).join(' ');
      city = a.city || a.town || a.village || a.county || '';
      province = a.state || '';
    } catch { /* best-effort: si falla, solo la coordenada */ }
    setLoading(false);
    setNewAt({ lat, lng, city, province, address });
  }

  const withGeo = props.filter((p) => p.lat != null && p.lng != null).length;

  return (
    <div>
      <div className="panel-head">
        <h3>Mapa de propiedades</h3>
        <span className="muted small">{withGeo} en el mapa · click derecho → “Publicar propiedad acá”</span>
      </div>
      <div className="agency-map-wrap">
        <div ref={ref} className="agency-map" />
        {menu && <button className="map-ctx" style={{ left: menu.x, top: menu.y }} onClick={publishHere}>📍 Publicar propiedad acá</button>}
        {loading && <div className="map-loading">Ubicando dirección…</div>}
      </div>
      {newAt && <PropertyForm scope="agency" branches={branches} initial={newAt} onClose={() => setNewAt(null)} onSaved={() => { setNewAt(null); load(); }} />}
    </div>
  );
}
