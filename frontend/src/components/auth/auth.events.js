export const AUTH_LOGOUT_EVENT = 'webapp-auth-logout';

export function emitAuthLogout(detail = {}) {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT, { detail }));
}
