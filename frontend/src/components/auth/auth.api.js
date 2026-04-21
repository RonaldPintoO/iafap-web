import { API_BASE_URL } from '../../config/api';
import { clearAuthSession, getAuthSession, saveAuthSession } from './auth.storage';

function buildHeaders(extra = {}) {
  const session = getAuthSession();
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  return headers;
}

export async function authFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (response.status === 401) {
    clearAuthSession();
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }

  return response;
}

export async function loginAsesor(asenum) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asenum }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'No se pudo iniciar sesión.');
    error.status = response.status;
    error.code = data.code;
    error.remainingSeconds = data.remainingSeconds || 0;
    throw error;
  }

  const session = {
    token: data.token,
    user: data.user,
  };

  saveAuthSession(session);
  return session;
}

export async function fetchMe() {
  const response = await authFetch('/auth/me');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Sesión inválida.');
    error.status = response.status;
    throw error;
  }
  return data.user;
}

export async function logoutAsesor() {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } finally {
    clearAuthSession();
  }
}
