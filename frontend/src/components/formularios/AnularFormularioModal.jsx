import FotoTab from "./FotoTab";

export default function AnularFormularioModal({
  show,
  formulario,
  motivo,
  setMotivo,
  foto,
  setFoto,
  onClose,
  onSubmit,
  saving = false,
}) {
  if (!show) return null;

  return (
    <div
      className={`forms-add-backdrop ${show ? "is-open" : ""}`}
      onClick={saving ? undefined : onClose}
    >
      <div className="forms-add-modal forms-cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="forms-cancel-modal__header">
          <div>
            <div className="forms-cancel-modal__eyebrow">Solicitud de anulación</div>
            <h2 className="forms-cancel-modal__title">Formulario {formulario?.id || formulario?.fornum || ""}</h2>
          </div>
          <button
            type="button"
            className="forms-cancel-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="forms-add-body forms-cancel-modal__body">
          <label className="forms-cancel-modal__label" htmlFor="motivo-anulacion">
            Motivo de anulación
          </label>
          <textarea
            id="motivo-anulacion"
            className="forms-cancel-modal__textarea"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ingrese el motivo que se enviará al proceso..."
            maxLength={250}
            disabled={saving}
          />
          <div className="forms-cancel-modal__counter">{motivo.length}/250</div>

          <FotoTab
            title="Foto / comprobante"
            helpText="La foto es obligatoria. Puede tomarla con la cámara trasera o cargar un archivo."
            value={foto}
            onChange={setFoto}
          />
        </div>

        <div className="forms-add-actions">
          <button
            type="button"
            className="forms-add-action is-danger"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Enviando..." : "Enviar anulación"}
          </button>

          <button
            type="button"
            className="forms-add-action"
            onClick={onClose}
            disabled={saving}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
