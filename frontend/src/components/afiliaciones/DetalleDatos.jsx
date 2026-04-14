function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hasValue(value) {
  return cleanValue(value) !== "";
}

function onlyDigits(value) {
  return cleanValue(value).replace(/\D+/g, "");
}

export default function DetalleDatos({ item }) {
  const direccionLineas = [
    `Calle: ${cleanValue(item?.calle) || "N/D"}`,
    `Nº: ${cleanValue(item?.nroPuerta) || "N/D"}`,
    hasValue(item?.entre1) || hasValue(item?.entre2)
      ? `Esquinas: ${[cleanValue(item?.entre1), cleanValue(item?.entre2)]
          .filter(Boolean)
          .join(" y ")}`
      : "",
    hasValue(item?.manzana) ? `Manzana: ${cleanValue(item?.manzana)}` : "",
    hasValue(item?.solar) ? `Solar: ${cleanValue(item?.solar)}` : "",
    hasValue(item?.ruta) ? `Ruta: ${cleanValue(item?.ruta)}` : "",
    hasValue(item?.km) ? `Km: ${cleanValue(item?.km)}` : "",
  ].filter(Boolean);

  const direccion =
    direccionLineas.length > 0 ? direccionLineas.join("\n") : "Sin datos";

  const cedulaSoloDigitos = onlyDigits(item?.cedula);

  const handleLlamar = (telefono) => {
    const tel = onlyDigits(telefono);
    if (!tel) return;
    window.location.href = `tel:${tel}`;
  };

  const handleSoloCi = () => {
    if (!cedulaSoloDigitos) return;
    window.location.href = `/cedula?ci=${encodeURIComponent(cedulaSoloDigitos)}`;
  };

  const handleActividad = () => {
    if (!cedulaSoloDigitos) return;
    window.location.href = `/actividad?ci=${encodeURIComponent(cedulaSoloDigitos)}`;
  };

  return (
    <div className="afi-detail-body">
      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Dirección</h3>

        <div className="afi-detail-section__value afi-detail-section__value--multiline">
          {direccion}
        </div>

        <div className="afi-detail-section__actions">
          <button type="button" className="afi-detail-link">
            DIRECCION
          </button>
          <button type="button" className="afi-detail-link">
            UBICACION
          </button>
          <button type="button" className="afi-detail-link">
            EDITAR
          </button>
        </div>
      </section>

      <section className="afi-detail-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h3 className="afi-detail-section__title">Teléfonos</h3>
        </div>

        <div className="afi-detail-phone-list">
          {hasValue(item?.telefono) && (
            <div className="afi-detail-phone-row">
              <div className="afi-detail-phone-number">{item.telefono}</div>
              <button
                type="button"
                className="afi-detail-link"
                onClick={() => handleLlamar(item.telefono)}
              >
                LLAMAR
              </button>
            </div>
          )}

          {hasValue(item?.celular) && (
            <div className="afi-detail-phone-row">
              <div className="afi-detail-phone-number">{item.celular}</div>
              <button
                type="button"
                className="afi-detail-link"
                onClick={() => handleLlamar(item.celular)}
              >
                LLAMAR
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Información</h3>

        <div className="afi-detail-info-grid">
          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Departamento</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.departamento) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Ciudad</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.ciudad) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Tipo</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.asidetalle) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Ley</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.leyLabel) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Estado</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.estadoFiltro) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Tipo afiliación</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.leyendaAfiliacion) || "Sin datos"}
            </div>
          </div>
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Acciones rápidas</h3>

        <div className="afi-detail-quick-actions">
          <button
            type="button"
            className="afi-detail-link"
            onClick={handleSoloCi}
            disabled={!cedulaSoloDigitos}
          >
            SOLO CI
          </button>

          <button
            type="button"
            className="afi-detail-link"
            onClick={handleActividad}
            disabled={!cedulaSoloDigitos}
          >
            ACTIVIDAD
          </button>

          <button type="button" className="afi-detail-link">
            NO ESTABA
          </button>

          <button type="button" className="afi-detail-link">
            NO ATIENDE
          </button>
        </div>
      </section>
    </div>
  );
}
