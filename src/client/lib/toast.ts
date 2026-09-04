// Toasts propios (reemplazan los alert() del navegador). Sin provider: función global
// que inserta un elemento en el DOM. Import y usar: toast('Listo') / toast('Error', 'err').
export function toast(message: string, type: 'ok' | 'err' = 'ok') {
  if (typeof document === 'undefined') return;
  let c = document.getElementById('toasts');
  if (!c) { c = document.createElement('div'); c.id = 'toasts'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3400);
}
