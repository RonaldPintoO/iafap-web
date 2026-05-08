export default function AddPersonaModal({
  show,
  closeAddPersona,
  personaForm,
  setPersonaField,
  digitsOnly,
  ciOk,
  telOk,
  canSubmit,
  onSubmitPersona,
}) {
  return (
    <div
      className={`afi-add-backdrop ${show ? "is-open" : ""}`}
      onClick={closeAddPersona}
    >
      <div className="afi-add" onClick={(e) => e.stopPropagation()}>
        <div className="afi-add-body">
          <div className="afi-add-row">
            <input
              id="persona-ci"
              name="persona_ci"
              className={`afi-add-input ${!ciOk && personaForm.ci !== "" ? "is-error" : ""}`}
              placeholder="Cédula de Identidad"
              value={personaForm.ci}
              inputMode="numeric"
              autoComplete="off"
              onChange={(e) => setPersonaField("ci", digitsOnly(e.target.value))}
            />
            <div
              className={`afi-add-underline ${!ciOk && personaForm.ci !== "" ? "is-error" : ""}`}
            />
          </div>

          <div className="afi-add-row">
            <input
              id="persona-nombre"
              name="persona_nombre"
              className="afi-add-input"
              placeholder="Nombre"
              value={personaForm.nombre}
              autoComplete="off"
              onChange={(e) => setPersonaField("nombre", e.target.value)}
            />
            <div className="afi-add-underline" />
          </div>

          <div className="afi-add-row">
            <input
              id="persona-apellido"
              name="persona_apellido"
              className="afi-add-input"
              placeholder="Apellido"
              value={personaForm.apellido}
              autoComplete="off"
              onChange={(e) => setPersonaField("apellido", e.target.value)}
            />
            <div className="afi-add-underline" />
          </div>

          <div className="afi-add-row">
            <input
              id="persona-telefono"
              name="persona_telefono"
              className={`afi-add-input ${!telOk ? "is-error" : ""}`}
              placeholder="Teléfono"
              value={personaForm.telefono}
              inputMode="numeric"
              autoComplete="off"
              onChange={(e) => setPersonaField("telefono", digitsOnly(e.target.value))}
            />
            <div className={`afi-add-underline ${!telOk ? "is-error" : ""}`} />
          </div>
        </div>

        <div className="afi-add-actions">
          <button
            className="afi-add-btn"
            type="button"
            onClick={onSubmitPersona}
            disabled={!canSubmit}
          >
            Agregar
          </button>

          <button
            className="afi-add-btn"
            type="button"
            onClick={closeAddPersona}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}