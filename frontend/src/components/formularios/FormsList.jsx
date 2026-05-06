export default function FormsList({ items, onItemClick }) {
  const estadoOrden = [
    "Pendiente",
    "ENV",
    "REC",
    "OK",
    "BPS",
    "BSA",
    "OA",
    "NOK",
    "REP",
  ];

  const sortedItems = [...items].sort((a, b) => {
    const estadoA = estadoOrden.indexOf(a.estadoTxt);
    const estadoB = estadoOrden.indexOf(b.estadoTxt);

    const ordenA = estadoA === -1 ? 999 : estadoA;
    const ordenB = estadoB === -1 ? 999 : estadoB;

    if (ordenA !== ordenB) return ordenA - ordenB;
    return Number(a.id) - Number(b.id);
  });

  return (
    <div className="forms-list">
      {sortedItems.length === 0 ? (
        <div className="forms-empty">(Sin resultados)</div>
      ) : (
        sortedItems.map((it) => {
          const puedeAbrir = it.estadoTxt === "Pendiente" || it.permiteEditar;

          return (
            <div
              className={`forms-item ${puedeAbrir ? "is-clickable" : ""}`}
              key={it.id}
              onClick={() => {
                if (puedeAbrir) onItemClick?.(it);
              }}
              role={puedeAbrir ? "button" : undefined}
              tabIndex={puedeAbrir ? 0 : -1}
              onKeyDown={(e) => {
                if (puedeAbrir && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onItemClick?.(it);
                }
              }}
            >
              <div
                className="forms-item__bar"
                style={{
                  background: it.color,
                  border: it.borderColor ? `1px solid ${it.borderColor}` : "none",
                }}
              />

              <div className="forms-item__body">
                <div className="forms-item__top">
                  <div className="forms-item__id">{it.id}</div>

                  <div className="forms-item__main">
                    {it.detalleFormulario ? (
                      <div className="forms-item__line">{it.detalleFormulario}</div>
                    ) : null}

                    {it.proyectoTexto ? (
                      <div className="forms-item__line">{it.proyectoTexto}</div>
                    ) : null}

                    {it.asesorTexto ? (
                      <div className="forms-item__line">{it.asesorTexto}</div>
                    ) : null}
                  </div>
                </div>

                <div className="forms-item__bottom">
                  <div className="forms-item__dt">
                    <div>{it.fecha}</div>
                    <div>{it.hora}</div>
                  </div>

                  <div className="forms-item__estado-wrap">
                    <div className="forms-item__estado">{it.estadoTxt}</div>
                    {it.estadoDetalle ? (
                      <div className="forms-item__estado-detalle">
                        {String(it.estadoDetalle)
                          .split("\n")
                          .filter(Boolean)
                          .map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                      </div>
                    ) : null}
                    {it.permiteEditar ? (
                      <button
                        type="button"
                        className="forms-item__edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick?.(it);
                        }}
                      >
                        Editar y reenviar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
