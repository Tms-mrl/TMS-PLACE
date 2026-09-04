/** Wrapper de fetch a la API propia (same-origin, cookie SSO incluida). */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
    throw new Error(body?.error || body?.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Sube un archivo (multipart) sin fijar Content-Type (el browser pone el boundary). */
export async function upload<T>(path: string, file: Blob): Promise<T> {
  const fd = new FormData();
  fd.append('file', file, 'photo.jpg');
  const res = await fetch(path, { method: 'POST', credentials: 'include', body: fd });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
    throw new Error(body?.error || body?.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
