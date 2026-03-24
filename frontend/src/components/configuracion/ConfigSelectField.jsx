export default function ConfigSelectField({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}) {
  return (
    <div className="cfg-row">
      <div className="cfg-label">{label}</div>

      <div className="cfg-select-wrap">
        <select
          className="cfg-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel || label}
        >
          {options.map((opt) => (
            <option value={opt.value} key={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="material-symbols-outlined cfg-select-icon">
          arrow_drop_down
        </span>
      </div>
    </div>
  );
}