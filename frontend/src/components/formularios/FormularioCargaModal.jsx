import { ADD_TABS } from "./forms.utils";
import DatosTab from "./DatosTab";

export default function FormularioCargaModal({
  show,
  closeAdd,
  addTab,
  setAddTab,
  datos,
  setDatos,
  paisOptions,
  departamentoOptions,
  localidadOptions,
  loadingCatalogos,
  errorCatalogos,
  onSubmit,
}) {
  return (
    <div
      className={`forms-add-backdrop ${show ? "is-open" : ""}`}
      onClick={closeAdd}
    >
      <div className="forms-add-modal" onClick={(e) => e.stopPropagation()}>
        <div
          className="forms-add-tabs"
          role="tablist"
          aria-label="Agregar formulario tabs"
        >
          {ADD_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={addTab === t.id}
              className={`forms-add-tab ${addTab === t.id ? "is-active" : ""}`}
              onClick={() => setAddTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="forms-add-body">
          {addTab === "datos" && (
            <DatosTab
              datos={datos}
              setDatos={setDatos}
              paisOptions={paisOptions}
              departamentoOptions={departamentoOptions}
              localidadOptions={localidadOptions}
              loadingCatalogos={loadingCatalogos}
              errorCatalogos={errorCatalogos}
            />
          )}

          {addTab === "formulario" && (
            <div className="forms-add-placeholder">
              (Pendiente) Acá va la pestaña Formulario.
            </div>
          )}

          {addTab === "ci_frente" && (
            <div className="forms-add-placeholder">
              (Pendiente) Acá va Cédula Frente.
            </div>
          )}

          {addTab === "ci_dorso" && (
            <div className="forms-add-placeholder">
              (Pendiente) Acá va Cédula Dorso.
            </div>
          )}

          {addTab === "f35_frente" && (
            <div className="forms-add-placeholder">
              (Pendiente) Acá va Form. &gt;35 Frente.
            </div>
          )}

          {addTab === "f35_dorso" && (
            <div className="forms-add-placeholder">
              (Pendiente) Acá va Form. &gt;35 Dorso.
            </div>
          )}
        </div>

        <div className="forms-add-actions">
          <button
            type="button"
            className="forms-add-action is-primary"
            onClick={onSubmit}
          >
            Enviar
          </button>

          <button type="button" className="forms-add-action" onClick={closeAdd}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
