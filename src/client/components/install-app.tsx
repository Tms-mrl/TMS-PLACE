import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';
import { Button } from './ui/button';

// Chrome/Edge/Android disparan este evento cuando la app cumple los
// requisitos de instalabilidad (manifest + ícono + service worker). Se
// captura a nivel de módulo porque puede llegar antes de que el usuario
// abra la tab de Configuración.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Tarjeta de "Instalar app" para el panel de Configuración. Android/Chrome/Edge
// tienen un botón que dispara el prompt nativo del navegador; iOS Safari no
// permite disparar "Agregar a inicio" por código, así que ahí mostramos el
// instructivo (compartir → Agregar a inicio).
export function InstallAppCard() {
  const [, setTick] = useState(0);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onChange = () => { setTick((t) => t + 1); setInstalled(isStandalone()); };
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);

  if (installed) {
    return (
      <div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>Instalar app</p>
        <p className="muted small" style={{ margin: '2px 0 0' }}>✓ Ya la tenés instalada en este dispositivo.</p>
      </div>
    );
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setTick((t) => t + 1);
  }

  return (
    <div>
      <p className="muted small" style={{ margin: '10px 0 0' }}>Instalar app</p>
      <p className="muted small" style={{ margin: '2px 0 8px' }}>
        Agregá un ícono en tu celular o compu para abrir el panel como una app, sin pasar por el navegador.
      </p>
      {deferredPrompt ? (
        <Button size="sm" onClick={install}><Download className="h-4 w-4" /> Instalar app</Button>
      ) : isIOS() ? (
        <p className="muted small" style={{ margin: 0 }}>
          En Safari, tocá <Share className="h-3.5 w-3.5" style={{ display: 'inline', verticalAlign: 'middle' }} /> Compartir
          y elegí <b>“Agregar a inicio”</b>.
        </p>
      ) : (
        <p className="muted small" style={{ margin: 0 }}>
          Buscá “Instalar app” o “Agregar a pantalla de inicio” en el menú de tu navegador.
        </p>
      )}
    </div>
  );
}
