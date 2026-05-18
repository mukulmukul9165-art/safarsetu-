const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';


export function getStoredAuth() {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const auth = getStoredAuth();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `${res.status} ${res.statusText}`);
  return body;
}

export function postMapRoute(pickup, drop) {
  return api('/api/maps/route', {
    method: 'POST',
    body: JSON.stringify({ pickup, drop }),
  });
}
