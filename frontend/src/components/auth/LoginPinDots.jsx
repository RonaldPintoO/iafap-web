export default function LoginPinDots({ value, length = 4 }) {
  const digits = String(value || '').slice(0, length).split('');

  return (
    <div className="auth-pin" aria-label="Número de asesor ingresado">
      {Array.from({ length }).map((_, index) => {
        const char = digits[index] || '';
        return (
          <div key={index} className={`auth-pin__box ${char ? 'is-filled' : ''}`}>
            {char}
          </div>
        );
      })}
    </div>
  );
}
