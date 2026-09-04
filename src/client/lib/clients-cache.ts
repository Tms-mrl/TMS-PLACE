import { api } from './api';
import type { Client } from './types';

// Cache de la cartera de contactos, a nivel módulo (vive lo que vive la SPA).
//
// Why: el picker del calendario lo necesita cada vez que se abre una propiedad, y pedirlo
// de nuevo en cada apertura deja el desplegable vacío unos cientos de ms. La cartera
// cambia poco, así que se trae una vez —idealmente antes, con prefetchClients()— y las
// altas nuevas se empujan acá mismo en vez de re-pedir la lista entera.

let cache: Client[] | null = null;
let inflight: Promise<Client[]> | null = null;

/** Lo que haya cacheado, sin esperar (array vacío si todavía no llegó). */
export function cachedClients(): Client[] {
  return cache || [];
}

/** Trae la cartera (una sola request aunque la pidan N componentes a la vez). */
export function loadClients(force = false): Promise<Client[]> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = api<{ clients: Client[] }>('/api/clients')
    .then((r) => { cache = r.clients || []; return cache; })
    .catch(() => cache || [])
    .finally(() => { inflight = null; });
  return inflight;
}

/** Prefetch sin bloquear ni romper si falla (se llama al entrar al panel). */
export function prefetchClients(): void {
  if (!cache && !inflight) void loadClients();
}

/** Un contacto recién creado se suma al cache: no hace falta re-pedir la lista. */
export function addCachedClient(c: Client): Client[] {
  cache = [c, ...(cache || [])];
  return cache;
}
