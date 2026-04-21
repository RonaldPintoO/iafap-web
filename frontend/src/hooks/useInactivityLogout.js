import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAsesor } from '../components/auth/auth.api';
import { getAuthSession } from '../components/auth/auth.storage';

const IDLE_MS = 5 * 60 * 1000;

export default function useInactivityLogout(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || !getAuthSession()?.token) return undefined;

    let timeoutId;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        await logoutAsesor();
        navigate('/login', {
          replace: true,
          state: { expired: true },
        });
      }, IDLE_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [enabled, navigate]);
}
