import { LEYENDA } from "./forms.utils";

export default function FormsInfoModal({ showInfo, setShowInfo }) {
  return (
    <div
      className={`forms-info-backdrop ${showInfo ? "is-open" : ""}`}
      onClick={() => setShowInfo(false)}
    >
      <div className="forms-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="forms-info-body">
          {LEYENDA.map((x) => (
            <div className="forms-info-row" key={x.label}>
              <div
                className="forms-info-color"
                style={{
                  background: x.color,
                  border: x.border
                    ? `2px solid ${x.border}`
                    : "1px solid #e7e7e7",
                }}
              />
              <div className="forms-info-text">{x.label}</div>
            </div>
          ))}
        </div>

        <div className="forms-info-actions">
          <button
            type="button"
            className="forms-info-action"
            onClick={() => setShowInfo(false)}
          >
            ACEPTAR
          </button>
        </div>
      </div>
    </div>
  );
}