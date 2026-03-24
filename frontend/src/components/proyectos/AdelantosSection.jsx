import FabButton from "./FabButton";
import StatusPill from "./StatusPill";

export default function AdelantosSection({
  advanceList,
  getStatusStyle,
  isoToDDMMYYYY,
  calcAdvanceTokens,
  fichaMenos100,
  fichaMas100,
  onAdd,
}) {
  return (
    <div className="fuel-wrap">
      <div className="fuel-body">
        {advanceList.length === 0 ? (
          <div className="proj-empty">(Sin solicitudes)</div>
        ) : (
          <div className="rent-list">
            {advanceList.map((a) => {
              const fichasMenos100 = calcAdvanceTokens(a.importe, fichaMenos100);
              const fichasMas100 = calcAdvanceTokens(a.importe, fichaMas100);

              return (
                <div key={a.id} className="rent-card">
                  <div className="rent-card__top">
                    <div className="rent-card__dates">
                      <div>Solicitud del {a.fechaISO ? isoToDDMMYYYY(a.fechaISO) : "-"}</div>
                    </div>

                    <StatusPill status={a.estado} getStatusStyle={getStatusStyle} />
                  </div>

                  <div className="rent-card__mid">
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                      ${a.importe.toLocaleString("es-UY")}
                    </div>

                    <div>{a.observacion || "Sin observación"}</div>

                    <div>Equivale a {fichasMenos100} fichas &lt;100km</div>
                    <div>Equivale a {fichasMas100} fichas &gt;100km</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FabButton onClick={onAdd} label="Agregar" icon="add" />
    </div>
  );
}