function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hasValue(value) {
  return cleanValue(value) !== "";
}

function FieldLine({ label, value }) {
  if (!hasValue(value)) return null;

  return (
    <div className="afi-vinculo-info__field">
      <span className="afi-vinculo-info__field-label">{label}:</span>
      <span className="afi-vinculo-info__field-value">{cleanValue(value)}</span>
    </div>
  );
}

function VinculoRelacionado({ item }) {
  return (
    <section className="afi-vinculo-info__related">
      <div className="afi-vinculo-info__related-title">VÍNCULO</div>

      <div className="afi-vinculo-info__related-type">
        {cleanValue(item?.tipoVinculo) || "Sin tipo de vínculo"}
      </div>

      <div className="afi-vinculo-info__related-name">
        {cleanValue(item?.primerNombre)} {cleanValue(item?.segundoNombre)}{" "}
        {cleanValue(item?.primerApellido)} {cleanValue(item?.segundoApellido)}
      </div>

      {hasValue(item?.nacimiento) && (
        <div className="afi-vinculo-info__related-line">
          FECHA:{new Date(item.nacimiento).toLocaleDateString("es-UY")}
        </div>
      )}

      {hasValue(item?.cedula) && (
        <div className="afi-vinculo-info__related-line">
          CEDULA:{cleanValue(item.cedula)}
        </div>
      )}
    </section>
  );
}

export default function VinculoInfoModal({ vinculo, onClose }) {
  if (!vinculo) return null;
  const datos = vinculo?.datosDetalle || {};
  const vinculosRelacionados = vinculo?.vinculosDelVinculo || [];

  return (
    <div className="afi-vinculo-info-backdrop" role="presentation">
      <div
        className="afi-vinculo-info"
        role="dialog"
        aria-modal="true"
        aria-label="Vínculos del vínculo"
      >
        <div className="afi-vinculo-info__body">
          <section className="afi-vinculo-info__section">
            <h3>Datos</h3>

            <div className="afi-vinculo-info__related-name">
              {cleanValue(datos.primerNombre)} {cleanValue(datos.segundoNombre)}{" "}
              {cleanValue(datos.primerApellido)}{" "}
              {cleanValue(datos.segundoApellido)} FECHA:
              {new Date(datos.nacimiento).toLocaleDateString("es-UY")}
            </div>
          </section>
          <div className="afi-vinculo-info__related-list">
            {vinculosRelacionados.length ? (
              vinculosRelacionados.map((item, index) => (
                <VinculoRelacionado
                  key={`${item?.cedula || "vinculo-rel"}-${index}`}
                  item={item}
                />
              ))
            ) : (
              <div className="afi-vinculo-info__empty">
                Sin vínculos relacionados para mostrar.
              </div>
            )}
          </div>
        </div>

        <div className="afi-vinculo-info__actions">
          <button type="button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
