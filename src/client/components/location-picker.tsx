import { useEffect, useRef, useState } from 'react';
import { toast } from '../lib/toast';

const round = (n: number) => Math.round(n * 1e6) / 1e6;

// Selector de ubicación en un mapa (Leaflet, window.L). Click o pin arrastrable fijan
// lat/lng exactos; "Ubicar por dirección" geocodifica (Nominatim) y centra el pin.
export function LocationPicker({ lat, lng, address, city, province, onChange }: {
  lat: number | null; lng: number | null;
  address?: string; city?: string; province?: string;
  onChange: (lat: number | null, lng: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat, lng });

  function placeMarker(la: number, ln: number) {
    const L = (window as any).L, map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.setLatLng([la, ln]);
    else {
      const mk = L.marker([la, ln], { draggable: true });
      mk.on('dragend', () => { const p = mk.getLatLng(); const v = { lat: round(p.lat), lng: round(p.lng) }; setCoords(v); onChange(v.lat, v.lng); });
      mk.addTo(map);
      markerRef.current = mk;
    }
  }
  function setPin(la: number, ln: number, center: boolean) {
    placeMarker(la, ln);
    if (center) mapRef.current?.setView([la, ln], Math.max(mapRef.current.getZoom(), 16));
    const v = { lat: round(la), lng: round(ln) };
    setCoords(v); onChange(v.lat, v.lng);
  }
  async function geocode(initial = false) {
    const q = [address, city, province, 'Argentina'].filter(Boolean).join(', ');
    if (q === 'Argentina') { if (!initial) toast('Cargá una dirección o ciudad primero.', 'err'); return; }
    setBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'es' } });
      const j = await r.json();
      if (j && j[0]) setPin(parseFloat(j[0].lat), parseFloat(j[0].lon), true);
      else if (!initial) toast('No encontramos esa dirección. Movés el pin a mano en el mapa.', 'err');
    } catch { if (!initial) toast('No se pudo geocodificar.', 'err'); }
    finally { setBusy(false); }
  }
  function clearPin() {
    const map = mapRef.current;
    if (markerRef.current && map) { map.removeLayer(markerRef.current); markerRef.current = null; }
    setCoords({ lat: null, lng: null }); onChange(null, null);
  }

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !ref.current || mapRef.current) return;
    const hasCoords = lat != null && lng != null;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView(hasCoords ? [lat!, lng!] : [-38, -63], hasCoords ? 16 : 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    map.on('click', (e: any) => setPin(e.latlng.lat, e.latlng.lng, false));
    mapRef.current = map;
    if (hasCoords) placeMarker(lat!, lng!);
    setTimeout(() => map.invalidateSize(), 160);
    // Sin coordenadas pero con dirección → intento geocodificar al abrir (best-effort, sin toast).
    if (!hasCoords && (address || city)) geocode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const L = (window as any).L;
  if (!L) return <p className="muted small">No se pudo cargar el mapa.</p>;

  return (
    <div className="loc-pick">
      <div className="loc-pick-head">
        <span className="muted small">{coords.lat != null && coords.lng != null ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Sin ubicación fija — clic en el mapa o “Ubicar por dirección”'}</span>
        <div className="loc-pick-acts">
          <button type="button" className="btn ghost sm" disabled={busy} onClick={() => geocode(false)}>{busy ? '…' : '📍 Ubicar por dirección'}</button>
          {coords.lat != null && coords.lng != null && <button type="button" className="link-btn" onClick={clearPin}>Quitar pin</button>}
        </div>
      </div>
      <div ref={ref} className="loc-map" />
      <p className="muted small" style={{ margin: '6px 0 0' }}>Hacé clic en el mapa o arrastrá el pin para fijar la ubicación exacta.</p>
    </div>
  );
}
