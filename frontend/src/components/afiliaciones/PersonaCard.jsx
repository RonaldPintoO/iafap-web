export default function PersonaCard({ item, onClick }) {
  const nombre = item?.nombreCompleto || "-";
  const departamento = item?.departamento || "-";
  const ciudad = item?.ciudad || "-";

  const edadTexto =
    item?.edad !== null && item?.edad !== undefined && item?.edad !== ""
      ? `Edad: ${item.edad} años`
      : "Edad: s/d";

  const cedulaTexto = item?.cedula ? `CI: ${item.cedula}` : "CI: s/d";

  const chipTexto =
    item?.actividadChipLabel ||
    item?.smsResultadoLabel ||
    item?.resnom ||
    "Consultar";

  const variant =
    item?.actividadChipColor ||
    item?.smsResultadoColor ||
    item?.cardVariant ||
    "consultar";

  const leyendaAfiliacion =
    item?.leyendaAfiliacion || "Posible Afiliación Voluntaria";

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(item);
    }
  };

  return (
    <div
      className={`afi-person-card is-${variant}`}
      onClick={() => onClick?.(item)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalle de ${nombre}`}
    >
      <div className="afi-person-card__accent" />

      <div className="afi-person-card__content">
        <div className="afi-person-card__top">
          <div className="afi-person-card__name">{nombre}</div>

          <div className={`afi-person-card__action-chip is-${variant}`}>
            {chipTexto}
          </div>
        </div>

        <div className="afi-person-card__location">
          {departamento} - {ciudad}
        </div>

        <div className="afi-person-card__extra">
          <span className="afi-person-card__age">{edadTexto}</span>
          <span className="afi-person-card__doc">{cedulaTexto}</span>
        </div>

        <div className="afi-person-card__footer">
          <div className="afi-person-card__meta">
            {item?.fechaUltimaAccionTexto || "Sin Acción"}
          </div>
          <div className={`afi-person-card__affiliation is-${variant}`}>
            {leyendaAfiliacion}
          </div>
        </div>
      </div>
    </div>
  );
}
