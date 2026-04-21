import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginKeypad from '../components/auth/LoginKeypad';
import LoginPinDots from '../components/auth/LoginPinDots';
import { loginAsesor } from '../components/auth/auth.api';
import { getAuthSession } from '../components/auth/auth.storage';
import '../styles/auth.css';

function shuffleDigits() {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingSession = getAuthSession();

  const [value, setValue] = useState('');
  const [keys, setKeys] = useState(() => shuffleDigits());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const expiredMessage = useMemo(() => {
    if (location.state?.expired) {
      return 'La sesión se cerró por 5 minutos de inactividad.';
    }
    return '';
  }, [location.state]);

  useEffect(() => {
    setKeys(shuffleDigits());
  }, []);

  async function submitPin(pin) {
    try {
      setLoading(true);
      setError('');
      await loginAsesor(pin);
      navigate(location.state?.from?.pathname || '/afiliaciones', { replace: true });
    } catch (err) {
      setValue('');
      setKeys(shuffleDigits());
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(digit) {
    if (loading) return;

    const nextValue = `${value}${digit}`.slice(0, 4);
    setValue(nextValue);
    setKeys(shuffleDigits());
    setError('');

    if (nextValue.length === 4) {
      submitPin(nextValue);
    }
  }

  function handleBackspace() {
    if (loading) return;
    setValue((current) => current.slice(0, -1));
    setKeys(shuffleDigits());
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
          <h2 className="auth-card__title">Ingrese su número de asesor</h2>
          <LoginPinDots value={value} />

          {expiredMessage ? <div className="auth-message auth-message--info">{expiredMessage}</div> : null}
          {error ? <div className="auth-message auth-message--error">{error}</div> : null}

          <LoginKeypad
            keys={keys}
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            disabled={loading}
          />
        </section>
      </div>
    </div>
  );
}
