export default function FormsList({ items, onItemClick }) {
  const estadoOrden = [
    "Pendiente",
    "ENV",
    "OA",
    "REP",
    "OK",
    "BPS",
    "BSA",
    "NOK",
    "REC",
  ];

  const sortedItems = [...items].sort((a, b) => {
    const estadoA = estadoOrden.indexOf(a.estadoTxt);
    const estadoB = estadoOrden.indexOf(b.estadoTxt);

    const ordenA = estadoA === -1 ? 999 : estadoA;
    const ordenB = estadoB === -1 ? 999 : estadoB;

    if (ordenA !== ordenB) return ordenA - ordenB;

    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  });

  return (
    <div className="forms-list">
      {sortedItems.length === 0 ? (
        <div className="forms-empty">(Sin resultados)</div>
      ) : (
        sortedItems.map((it) => {
          const isPendiente = it.estadoTxt === "Pendiente";

          return (
            <div
              className={`forms-item ${isPendiente ? "is-clickable" : ""}`}
              key={it.id}
              onClick={() => {
                if (isPendiente) onItemClick?.(it);
              }}
              role="button"
              tabIndex={isPendiente ? 0 : -1}
              onKeyDown={(e) => {
                if (isPendiente && (e.key === "Enter" || e.key === " ")) {
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
                    {it.detalle ? (
                      <div className="forms-item__line">{it.detalle}</div>
                    ) : null}

                    {(it.proy && it.proy !== "—") || it.km ? (
                      <div className="forms-item__line">
                        {it.proy && it.proy !== "—" ? `Proy.${it.proy}` : ""} {it.km}
                      </div>
                    ) : null}

                    {it.asesor ? (
                      <div className="forms-item__line">Asesor: {it.asesor}</div>
                    ) : null}
                  </div>
                </div>

                <div className="forms-item__bottom">
                  <div className="forms-item__dt">
                    <div>{it.fecha}</div>
                    <div>{it.hora}</div>
                  </div>

                  <div className="forms-item__estado">
                    <div>{it.estadoTxt}</div>
                    {it.estadoDetalle ? (
                      <div className="forms-item__estado-detalle">
                        {it.estadoDetalle.split("\n").map((linea, idx) => (
                          <div key={`${it.id}-detalle-${idx}`}>{linea}</div>
                        ))}
                      </div>
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
