export default function FieldDate({ label, value, onChange }) {
  return (
    <label className="forms-field">
      <div className="forms-field__label">{label}</div>

      <input
        type="date"
        className="forms-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="forms-field__underline" />
    </label>
  );
}
