export default function FormsList({ items, onItemClick }) {
  const estadoOrden = [
    "Pendiente",
    "Recibido sin errores",
    "En proceso",
    "BPS",
    "Rechazado",
    "Sin Actividad",
    "Anulado",
  ];

  const sortedItems = [...items].sort((a, b) => {
    const estadoA = estadoOrden.indexOf(a.estadoTxt);
    const estadoB = estadoOrden.indexOf(b.estadoTxt);

    const ordenA = estadoA === -1 ? 999 : estadoA;
    const ordenB = estadoB === -1 ? 999 : estadoB;

    // Orden por estado
    if (ordenA !== ordenB) {
      return ordenA - ordenB;
    }

    // Mismo estado → ordenar por id
    return a.id - b.id;
  });

  return (
    <div className="forms-list">
      {sortedItems.length === 0 ? (
        <div className="forms-empty">(Sin resultados)</div>
      ) : (
        sortedItems.map((it) => (
          <div
            className={`forms-item ${
              it.estadoTxt === "Pendiente" ? "is-clickable" : ""
            }`}
            key={it.id}
            onClick={() => {
              if (it.estadoTxt === "Pendiente") {
                onItemClick?.(it);
              }
            }}
            role="button"
            tabIndex={it.estadoTxt === "Pendiente" ? 0 : -1}
            onKeyDown={(e) => {
              if (
                it.estadoTxt === "Pendiente" &&
                (e.key === "Enter" || e.key === " ")
              ) {
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
                  {(it.ci && it.ci !== "—") || it.fo ? (
                    <div className="forms-item__line">
                      {it.ci && it.ci !== "—" ? (
                        <span className="forms-item__ci">CI:{it.ci}</span>
                      ) : null}{" "}
                      {it.fo}
                    </div>
                  ) : null}

                  {(it.proy && it.proy !== "—") || it.km ? (
                    <div className="forms-item__line">
                      {it.proy && it.proy !== "—" ? `Proy.${it.proy}` : ""}{" "}
                      {it.km}
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

                <div className="forms-item__estado">{it.estadoTxt}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
