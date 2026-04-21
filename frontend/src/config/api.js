import { emitAuthLogout } from '../components/auth/auth.events';
import { getAuthSession } from '../components/auth/auth.storage';

export const API_BASE_URL = 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const session = getAuthSession();
  const headers = new Headers(options.headers || {});

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !url.endsWith('/auth/logout')) {
    emitAuthLogout({ reason: 'expired' });
  }

  return response;
}