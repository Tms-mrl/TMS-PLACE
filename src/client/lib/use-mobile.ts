import { useEffect, useState } from 'react';

// True cuando el viewport es "mobile" (≤ bp px). Reactivo a resize/rotación.
export function useIsMobile(bp = 760): boolean {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(`(max-width:${bp}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    setM(mq.matches);
    return () => mq.removeEventListener('change', on);
  }, [bp]);
  return m;
}
