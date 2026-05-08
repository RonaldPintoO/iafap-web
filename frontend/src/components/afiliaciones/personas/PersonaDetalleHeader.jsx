function formatFechaDDMMYYYY(value) {
  if (!value) return "N/D";

  const d = new Date(value);
  if (isNaN(d)) return "N/D";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

export default function PersonaDetalleHeader({ item, onClose }) {
  const nombre = item?.nombreCompleto || "-";
  const cedula = item?.cedula || "s/d";
  const sexo = item?.sexoLabel || "N/D";
  const edad =
    item?.edad !== null && item?.edad !== undefined && item?.edad !== ""
      ? `${item.edad} años`
      : "Edad s/d";

  const fechaNac = formatFechaDDMMYYYY(item?.fechaNac);

  const chipTexto =
    item?.actividadChipTexto || item?.actividadChipLabel || "Consultar";
  const chipColor = item?.actividadChipColor || "Consultar";

  return (
    <div className="afi-detail-hero">
      <div className="afi-detail-hero__top">
        <button
          className="afi-detail-back"
          type="button"
          onClick={onClose}
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className={`afi-detail-hero__chip is-${chipColor}`}>{chipTexto}</div>

      <div className="afi-detail-hero__name">{nombre}</div>

      <div className="afi-detail-hero__sub">
        {sexo} {edad} - {fechaNac}
      </div>

      <div className="afi-detail-hero__doc">Cédula {cedula}</div>
    </div>
  );
}
