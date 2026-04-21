export default function LoginKeypad({ keys = [], onDigit, onBackspace, disabled = false }) {
  const safeKeys = Array.isArray(keys) ? keys.slice(0, 10) : [];

  return (
    <div className="auth-keypad" aria-label="Teclado numérico aleatorio">
      {safeKeys.map((digit) => (
        <button
          key={`digit-${digit}`}
          type="button"
          className="auth-keypad__btn"
          onClick={() => onDigit?.(digit)}
          disabled={disabled}
        >
          {digit}
        </button>
      ))}

      <div className="auth-keypad__spacer" aria-hidden="true" />

      <button
        type="button"
        className="auth-keypad__btn auth-keypad__btn--ghost"
        onClick={() => onBackspace?.()}
        disabled={disabled}
        aria-label="Borrar último dígito"
      >
        <span className="material-symbols-outlined">backspace</span>
      </button>
    </div>
  );
}
