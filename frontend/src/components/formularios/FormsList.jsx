export default function FormsList({ items }) {
  return (
    <div className="forms-list">
      {items.length === 0 ? (
        <div className="forms-empty">(Sin resultados)</div>
      ) : (
        items.map((it) => (
          <div className="forms-item" key={it.id}>
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

                <div className="forms-item__estado">{it.estadoTxt}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}