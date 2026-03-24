export default function FieldInput({
  label,
  value,
  onChange,
  placeholder = "",
  inputMode,
  error = false,
  disabled = false,
  formatter,
}) {
  const handleChange = (e) => {
    let val = e.target.value;

    if (formatter) {
      val = formatter(val);
    }

    onChange(val);
  };

  return (
    <label className="forms-field">
      <div className="forms-field__label">{label}</div>

      <input
        className="forms-field__input"
        value={value ?? ""}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        onChange={handleChange}
      />

      <div
        className="forms-field__underline"
        style={error ? { background: "#d32f2f" } : undefined}
      />
    </label>
  );
}