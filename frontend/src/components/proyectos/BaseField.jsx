import React from "react";

export function BaseField({
  label,
  value,
  onChange,
  placeholder = "",
  inputMode,
  type = "text",
  step,
}) {
  return (
    <label className="fuel-field">
      <div className="fuel-field__label">{label}</div>
      <input
        className="fuel-field__input"
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="fuel-field__underline" />
    </label>
  );
}

export function DateField({ label, value, onChange }) {
  return (
    <BaseField
      label={label}
      value={value}
      onChange={onChange}
      type="date"
    />
  );
}

export function TimeField({ label, value, onChange }) {
  return (
    <BaseField
      label={label}
      value={value}
      onChange={onChange}
      type="time"
      step="60"
    />
  );
}