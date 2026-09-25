import { useEffect, useRef } from 'react';

// Botón "atrás" del celu (Samsung/Motorola/etc.) y del navegador.
//
// La app es UNA sola URL: las pestañas, el hilo de Correo abierto y los modales son
// estado de React, no rutas — así que "atrás" no tenía a dónde volver y el navegador
// cerraba la app. Acá se lleva una pila de "capas" (cada cosa que se puede cerrar o de
// la que se puede volver: un modal, un hilo abierto, la pestaña anterior). Mientras haya
// al menos una capa, el historial tiene UNA entrada trampa arriba de la base: un "atrás"
// real la consume, cierra la capa de arriba y la vuelve a armar si quedan más. Sin capas
// no hay entrada extra, así que "atrás" en la pantalla inicial sale de la app como siempre.

const MARK = '__backNav';

type Layer = { close: () => void };
const stack: Layer[] = [];
let armed = false;      // hay una entrada trampa arriba de la base
let unwinding = false;  // el history.back() que estamos esperando lo provocamos nosotros
let scheduled = false;
let listening = false;

/** Deja el historial como pide la pila: entrada trampa si hay capas, sin ella si no. */
function reconcile() {
  if (unwinding) return; // se reintenta cuando llega el popstate propio
  if (stack.length > 0 && !armed) {
    history.pushState({ [MARK]: true }, '');
    armed = true;
  } else if (stack.length === 0 && armed) {
    armed = false;
    unwinding = true;
    history.back();
    // Si el popstate no llega (no debería), no dejar trabado el armado de la próxima capa.
    setTimeout(() => { if (unwinding) { unwinding = false; reconcile(); } }, 500);
  }
}

// En una microtask: cerrar una capa y abrir otra en el mismo tick (ej. el modal de Redactar
// se cierra y se abre el hilo recién enviado) no toca el historial en absoluto.
function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; reconcile(); });
}

function onPopState() {
  if (unwinding) { unwinding = false; reconcile(); return; }
  if (history.state && history.state[MARK]) {
    // "Adelante" (desktop) sobre una entrada trampa vieja: no hay capa que restaurar.
    armed = true;
    reconcile();
    return;
  }
  // Un "atrás" real: consumió la entrada trampa. Cierra la capa de arriba.
  armed = false;
  stack.pop()?.close();
  reconcile();
}

function ensureListening() {
  if (listening) return;
  listening = true;
  // Recarga con una entrada trampa vieja como entrada actual: ya no representa nada.
  if (history.state && history.state[MARK]) history.replaceState(null, '');
  window.addEventListener('popstate', onPopState);
}

/** Registra una capa: cuando el usuario toca "atrás" se llama `close`, que tiene que
 *  cerrar/volver lo que corresponda. Devuelve `release`, para cuando la capa se cierra
 *  por la UI (no por "atrás") — saca la capa de la pila y, si era la última, la entrada
 *  trampa del historial. Es seguro llamarlo aunque "atrás" ya la haya sacado. */
export function pushBackLayer(close: () => void): () => void {
  ensureListening();
  const layer: Layer = { close };
  stack.push(layer);
  schedule();
  return () => {
    const i = stack.indexOf(layer);
    if (i !== -1) { stack.splice(i, 1); schedule(); }
  };
}

/** Navegación entre pestañas con "atrás": devuelve el `go(tab)` que reemplaza a un setState
 *  común. Cada cambio de pestaña deja una capa con la pestaña de la que se vino, y "atrás"
 *  vuelve a ella. Si el cambio es justo volver a esa pestaña (ej. "Adjuntar propiedades",
 *  ida y vuelta Correo → Inventario → Correo, o tocar la pestaña de donde venías) no se suma
 *  otra capa: se saca la de la ida, como si fuera un "atrás". Tope de capas para que salir
 *  de la app no lleve 40 toques después de un rato de uso. */
export function createTabNav<T>(initial: T, apply: (tab: T) => void, maxLayers = 10): (tab: T) => void {
  let current = initial;
  let layers: { prev: T; release: () => void }[] = [];
  return (tab) => {
    if (tab === current) return;
    const top = layers[layers.length - 1];
    if (top && top.prev === tab) {
      layers.pop();
      top.release();
    } else {
      const entry = { prev: current, release: () => {} };
      entry.release = pushBackLayer(() => {
        layers = layers.filter((x) => x !== entry);
        current = entry.prev;
        apply(entry.prev);
      });
      layers.push(entry);
      if (layers.length > maxLayers) layers.shift()!.release();
    }
    current = tab;
    apply(tab);
  };
}

/** Mientras `active`, "atrás" llama `onClose` (y la capa se libera sola al desactivarse). */
export function useBackLayer(active: boolean, onClose: () => void): void {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    return pushBackLayer(() => closeRef.current());
  }, [active]);
}
