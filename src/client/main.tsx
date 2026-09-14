import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { ConfirmProvider } from './components/ui/use-confirm';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </StrictMode>,
);

// El SW no cachea nada (fetch handler vacío), así que registrarlo en dev
// no interfiere con el HMR de Vite.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
