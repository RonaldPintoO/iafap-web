export default function ActivityRow({
  index,
  row,
  onCedulaChange,
  onFechaChange,
  cedulaError,
  fechaError,
}) {
  return (
    <div className="activity-grid-row">
      <div className="field">
        <input
          id={`actividad-cedula-${index + 1}`}
          name={`actividad_cedula_${index + 1}`}
          value={row.cedula}
          onChange={(e) => onCedulaChange(index, e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder=""
          aria-label={`Cédula ${index + 1}`}
        />
        <div className={`underline ${cedulaError ? "is-error" : ""}`} />
      </div>

      <div className="field">
        <input
          id={`actividad-fecha-nac-${index + 1}`}
          name={`actividad_fecha_nac_${index + 1}`}
          value={row.fecha}
          onChange={(e) => onFechaChange(index, e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder=""
          aria-label={`Fecha Nac. ${index + 1}`}
        />
        <div className={`underline ${fechaError ? "is-error" : ""}`} />
      </div>
    </div>
  );
}