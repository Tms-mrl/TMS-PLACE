import { useEffect, useRef } from 'react';

/** Vuelve a llamar `fn` cada `ms` mientras la pestaña está visible (una pestaña
 *  olvidada en segundo plano no gasta requests) y, al volver a foco, si ya pasó el
 *  intervalo, refresca al toque en vez de esperar el próximo tick. `fn` va en un ref
 *  para no tener que reiniciar el timer en cada render cuando el caller pasa una
 *  función nueva (closures sobre state/props que cambian seguido). */
export function usePoll(fn: () => void, ms: number): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let last = Date.now();
    const tick = () => { last = Date.now(); fnRef.current(); };
    const t = setInterval(() => { if (document.visibilityState === 'visible') tick(); }, ms);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last >= ms) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [ms]);
}
