export default function FieldSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Seleccionar",
}) {
  return (
    <label className="forms-field">
      <div className="forms-field__label">{label}</div>

      <select
        className="forms-field__select"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>

        {options.map((opt) => {
          const optionValue = typeof opt === "string" ? opt : opt.value;
          const optionLabel = typeof opt === "string" ? opt : opt.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>

      <div className="forms-field__underline" />
    </label>
  );
}