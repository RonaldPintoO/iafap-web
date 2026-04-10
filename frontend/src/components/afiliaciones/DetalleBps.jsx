function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function onlyDigits(value) {
  return cleanValue(value).replace(/\D+/g, "");
}

function DetalleBps({
  telefonosBps = [],
  telefonoBpsLoading,
  telefonoBpsError,
  direccionBps,
}) {
  const handleLlamar = (telefono) => {
    const tel = onlyDigits(telefono);
    if (!tel) return;
    window.location.href = `tel:${tel}`;
  };

  return (
    <div className="afi-detail-body">
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
          <h3 className="afi-detail-section__title">Datos BPS</h3>
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Dirección</h3>

        {direccionBps ? (
          <div className="afi-detail-section__value afi-detail-section__value--multiline">
            {[
              direccionBps.calle,
              direccionBps.numero,
              direccionBps.apto ? `Apto ${direccionBps.apto}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
            {"\n"}
            {[direccionBps.localidad, direccionBps.departamento]
              .filter(Boolean)
              .join(" - ")}
          </div>
        ) : (
          <div className="afi-detail-section__value">Sin dirección BPS</div>
        )}
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Teléfonos</h3>

        <div className="afi-detail-phone-list">
          {!telefonoBpsLoading &&
            telefonosBps.length > 0 &&
            telefonosBps.map((telefono, index) => (
              <div
                className="afi-detail-phone-row"
                key={`${telefono}-${index}`}
              >
                <div className="afi-detail-phone-number">{telefono}</div>

                <button
                  type="button"
                  className="afi-detail-link"
                  onClick={() => handleLlamar(telefono)}
                >
                  LLAMAR
                </button>
              </div>
            ))}

          {telefonoBpsLoading && (
            <div className="afi-detail-phone-row is-empty">
              <div className="afi-detail-phone-number is-empty">
                Consultando datos BPS...
              </div>
            </div>
          )}

          {!telefonoBpsLoading && telefonoBpsError && (
            <div className="afi-detail-phone-row is-empty">
              <div className="afi-detail-phone-number is-empty">
                {telefonoBpsError}
              </div>
            </div>
          )}

          {!telefonoBpsLoading &&
            !telefonoBpsError &&
            telefonosBps.length === 0 && (
              <div className="afi-detail-phone-row is-empty">
                <div className="afi-detail-phone-number is-empty">
                  Sin teléfonos BPS
                </div>
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

export default DetalleBps;
