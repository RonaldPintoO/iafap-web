export default function FormsList({ items }) {
  return (
    <div className="forms-list">
      {items.length === 0 ? (
        <div className="forms-empty">(Sin resultados)</div>
      ) : (
        items.map((it) => (
          <div className="forms-item" key={it.id}>
            <div className="forms-item__bar" style={{ background: it.color }} />

            <div className="forms-item__body">
              <div className="forms-item__top">
                <div className="forms-item__id">{it.id}</div>

                <div className="forms-item__main">
                  <div className="forms-item__line">
                    <span className="forms-item__ci">CI:{it.ci}</span> {it.fo}
                  </div>

                  <div className="forms-item__line">
                    Proy.{it.proy} {it.km}
                  </div>
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