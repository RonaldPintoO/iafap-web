import { ADD_TABS } from "./forms.utils";
import DatosTab from "./DatosTab";
import FotoTab from "./FotoTab";

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
  proyectoOptions = [],
  formularioOptions = [],
  onFormularioChange,
  loadingCatalogos,
  errorCatalogos,
  onSubmit,
  saving = false,
}) {
  const setFoto = (key, value) => {
    setDatos((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className={`forms-add-backdrop ${show ? "is-open" : ""}`}
      onClick={saving ? undefined : closeAdd}
    >
      <div className="forms-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="forms-add-tabs" role="tablist" aria-label="Agregar formulario tabs">
          {ADD_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={addTab === t.id}
              className={`forms-add-tab ${addTab === t.id ? "is-active" : ""}`}
              onClick={() => setAddTab(t.id)}
              disabled={saving}
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
              proyectoOptions={proyectoOptions}
              formularioOptions={formularioOptions}
              onFormularioChange={onFormularioChange}
              loadingCatalogos={loadingCatalogos}
              errorCatalogos={errorCatalogos}
            />
          )}

          {addTab === "formulario" && (
            <FotoTab
              title="Foto del formulario"
              helpText="Esta foto es obligatoria para enviar el formulario."
              value={datos.fotoFormulario}
              onChange={(v) => setFoto("fotoFormulario", v)}
            />
          )}

          {addTab === "ci_frente" && (
            <FotoTab
              title="Documento frente"
              helpText="Adjunte frente de CI, pasaporte u otro documento, según corresponda."
              value={datos.fotoCiFrente}
              onChange={(v) => setFoto("fotoCiFrente", v)}
            />
          )}

          {addTab === "ci_dorso" && (
            <FotoTab
              title="Documento dorso"
              helpText="Adjunte dorso cuando el documento lo requiera."
              value={datos.fotoCiDorso}
              onChange={(v) => setFoto("fotoCiDorso", v)}
            />
          )}

          {addTab === "f35_frente" && (
            <FotoTab
              title="Formulario 35 frente"
              helpText="Requerido para mayores de 35 años, con confirmación si falta."
              value={datos.foto35Frente}
              onChange={(v) => setFoto("foto35Frente", v)}
            />
          )}

          {addTab === "f35_dorso" && (
            <FotoTab
              title="Formulario 35 dorso"
              helpText="Requerido para mayores de 35 años, con confirmación si falta."
              value={datos.foto35Dorso}
              onChange={(v) => setFoto("foto35Dorso", v)}
            />
          )}
        </div>

        <div className="forms-add-actions">
          <button
            type="button"
            className="forms-add-action is-primary"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Enviando..." : "Enviar"}
          </button>

          <button
            type="button"
            className="forms-add-action"
            onClick={closeAdd}
            disabled={saving}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
