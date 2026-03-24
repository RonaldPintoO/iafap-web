import { useEffect, useMemo, useState } from "react";

import {
  DEMO_ITEMS,
  ADD_TABS,
  buildDefaultDatos,
  filterFormsItems,
} from "../components/formularios/forms.utils";

import FormsToolbar from "../components/formularios/FormsToolbar";
import FormsList from "../components/formularios/FormsList";
import FormsInfoModal from "../components/formularios/FormsInfoModal";
import DatosTab from "../components/formularios/DatosTab";

export default function Formularios() {
  const [periodo, setPeriodo] = useState("30 días");
  const [estatus, setEstatus] = useState("En Proceso");
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [showInfo, setShowInfo] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addTab, setAddTab] = useState("datos");
  const [datos, setDatos] = useState(() => buildDefaultDatos());

  const closeAdd = () => {
    setShowAdd(false);
    setOpenDropdownId(null);
  };

  const resetAdd = () => {
    setDatos(buildDefaultDatos());
    setAddTab("datos");
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenDropdownId(null);
        setShowInfo(false);
        setShowAdd(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const items = useMemo(() => {
    return filterFormsItems(DEMO_ITEMS, periodo, estatus);
  }, [periodo, estatus]);

  return (
    <div className="forms-page">
      <FormsToolbar
        periodo={periodo}
        setPeriodo={setPeriodo}
        estatus={estatus}
        setEstatus={setEstatus}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
      />

      <FormsList items={items} />

      <button
        type="button"
        className="forms-info-btn"
        aria-label="Información"
        onClick={() => setShowInfo(true)}
      >
        <span className="material-symbols-outlined">info</span>
      </button>

      <button
        type="button"
        className="forms-fab"
        aria-label="Agregar"
        onClick={() => {
          setShowAdd(true);
          setAddTab("datos");
        }}
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      <FormsInfoModal showInfo={showInfo} setShowInfo={setShowInfo} />

      <div
        className={`forms-add-backdrop ${showAdd ? "is-open" : ""}`}
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
            {addTab === "datos" && <DatosTab datos={datos} setDatos={setDatos} />}

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
              onClick={() => {
                console.log("[Formularios] Guardar (demo):", { datos });
                closeAdd();
                resetAdd();
              }}
            >
              Enviar
            </button>

            <button
              type="button"
              className="forms-add-action"
              onClick={closeAdd}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}