import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginKeypad from '../components/auth/LoginKeypad';
import LoginPinDots from '../components/auth/LoginPinDots';
import { fetchAuthStatus, loginAsesor } from '../components/auth/auth.api';
import { getAuthSession } from '../components/auth/auth.storage';
import '../styles/auth.css';

function getFixedDigits() {
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingSession = getAuthSession();

  const [value, setValue] = useState('');
  const [keys, setKeys] = useState(() => getFixedDigits());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [bootChecking, setBootChecking] = useState(true);

  const expiredMessage = useMemo(() => {
    if (location.state?.expired) {
      return 'La sesión se cerró por 5 minutos de inactividad.';
    }
    return '';
  }, [location.state]);

  useEffect(() => {
    setKeys(getFixedDigits());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      try {
        const state = await fetchAuthStatus();
        if (!mounted) return;

        setBlocked(Boolean(state.blocked));

        if (state.blocked) {
          setError(state.detail || 'Comuniquese con Comercial si desea desbloquear su usuario.');
          setValue('');
        }
      } catch (_err) {
        // silencioso
      } finally {
        if (mounted) {
          setBootChecking(false);
        }
      }
    }

    loadStatus();

    return () => {
      mounted = false;
    };
  }, []);

  async function submitPin(pin) {
    try {
      setLoading(true);
      setError('');
      await loginAsesor(pin);
      navigate(location.state?.from?.pathname || '/afiliaciones', { replace: true });
    } catch (err) {
      setValue('');

      if (err.status === 423 || err.code === 'USER_BLOCKED') {
        setBlocked(true);
        setError(err.message || 'Comuniquese con Comercial si desea desbloquear su usuario.');
        return;
      }

      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(digit) {
    if (loading || blocked) return;

    const nextValue = `${value}${digit}`.slice(0, 4);
    setValue(nextValue);
    setError('');

    if (nextValue.length === 4) {
      submitPin(nextValue);
    }
  }

  function handleBackspace() {
    if (loading || blocked) return;
    setValue((current) => current.slice(0, -1));
    setError('');
  }

  if (existingSession?.token) {
    return <Navigate to="/afiliaciones" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-hero__brand">
            <img src="/Colores-horizontal-01.png" alt="Integración AFAP" className="auth-hero__logo" />
          </div>
          <h1 className="auth-hero__title">Bienvenido</h1>
          <p className="auth-hero__subtitle">Ingrese su número de asesor para continuar</p>
        </section>

        <section className="auth-card">
          <h2 className="auth-card__title">
            {blocked ? 'Acceso bloqueado' : 'Ingrese su número de asesor'}
          </h2>

          {!blocked ? <LoginPinDots value={value} /> : null}

          {expiredMessage ? <div className="auth-message auth-message--info">{expiredMessage}</div> : null}

          {error ? (
            <div className="auth-message auth-message--error">
              <div>{error}</div>
            </div>
          ) : null}

          {!bootChecking && !blocked ? (
            <LoginKeypad
              keys={keys}
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              disabled={loading}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}