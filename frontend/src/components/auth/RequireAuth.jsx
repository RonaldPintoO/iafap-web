import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchMe } from './auth.api';
import { getAuthSession } from './auth.storage';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;

    async function validate() {
      const session = getAuthSession();
      if (!session?.token) {
        if (mounted) setStatus('unauthenticated');
        return;
      }

      try {
        await fetchMe();
        if (mounted) setStatus('authenticated');
      } catch {
        if (mounted) setStatus('unauthenticated');
      }
    }

    validate();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (status === 'checking') {
    return <div className="auth-loading">Validando acceso...</div>;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
