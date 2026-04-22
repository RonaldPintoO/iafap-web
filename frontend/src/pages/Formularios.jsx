import { useEffect, useMemo, useState } from "react";

import {
  ADD_TABS,
  buildDefaultDatos,
  getDepartamentoOptions,
  getLocalidadOptions,
  getNombrePaisOptions,
  getPeriodoDias,
  mapFormularioItem,
} from "../components/formularios/forms.utils";

import { fetchFormularios } from "../components/formularios/formularios.api";
import {
  fetchFormulariosCatalogos,
  fetchLocalidadesByDepartamento,
} from "../components/formularios/formularios.catalogos.api";

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

  const [itemsRaw, setItemsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [catalogosLoading, setCatalogosLoading] = useState(true);
  const [catalogosError, setCatalogosError] = useState("");
  const [paises, setPaises] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  const [datos, setDatos] = useState(() => buildDefaultDatos());

  const paisOptions = useMemo(() => getNombrePaisOptions(paises), [paises]);
  const departamentoOptions = useMemo(
    () => getDepartamentoOptions(departamentos),
    [departamentos]
  );
  const localidadOptions = useMemo(
    () => getLocalidadOptions(localidades),
    [localidades]
  );

  const items = useMemo(() => itemsRaw.map(mapFormularioItem), [itemsRaw]);

  const closeAdd = () => {
    setShowAdd(false);
    setOpenDropdownId(null);
  };

  const resetAdd = () => {
    setDatos(
      buildDefaultDatos({
        paises,
        departamentos,
        localidades,
      })
    );
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

  useEffect(() => {
    let ignore = false;

    async function loadCatalogos() {
      try {
        setCatalogosLoading(true);
        setCatalogosError("");

        const data = await fetchFormulariosCatalogos();
        if (ignore) return;

        setPaises(data.paises || []);
        setDepartamentos(data.departamentos || []);

        const primerDepartamento = data.departamentos?.[0] || "";
        let localidadesIniciales = [];

        if (primerDepartamento) {
          localidadesIniciales = await fetchLocalidadesByDepartamento(primerDepartamento);
          if (ignore) return;
        }

        setLocalidades(localidadesIniciales);

        setDatos(
          buildDefaultDatos({
            paises: data.paises || [],
            departamentos: data.departamentos || [],
            localidades: localidadesIniciales || [],
          })
        );
      } catch (err) {
        if (!ignore) {
          setCatalogosError(err.message || "No se pudieron cargar los catálogos.");
        }
      } finally {
        if (!ignore) setCatalogosLoading(false);
      }
    }

    loadCatalogos();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadFormularios() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchFormularios({
          periodoDias: getPeriodoDias(periodo),
          estatus,
        });

        if (!ignore) {
          setItemsRaw(data.items || []);
        }
      } catch (err) {
        if (!ignore) {
          setItemsRaw([]);
          setError(err.message || "No se pudieron cargar los formularios.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFormularios();

    return () => {
      ignore = true;
    };
  }, [periodo, estatus]);

  useEffect(() => {
    let ignore = false;

    async function loadLocalidades() {
      const departamento = datos.departamento;
      if (!departamento) {
        setLocalidades([]);
        return;
      }

      try {
        const items = await fetchLocalidadesByDepartamento(departamento);
        if (ignore) return;

        setLocalidades(items);

        setDatos((prev) => {
          const actualExiste = items.some(
            (loc) => (loc.localidad || loc) === prev.localidad
          );

          return {
            ...prev,
            localidad: actualExiste ? prev.localidad : (items[0]?.localidad || ""),
          };
        });
      } catch (_err) {
        if (!ignore) {
          setLocalidades([]);
        }
      }
    }

    if (showAdd) {
      loadLocalidades();
    }

    return () => {
      ignore = true;
    };
  }, [datos.departamento, showAdd]);

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

      {loading ? (
        <div className="forms-empty">Cargando formularios...</div>
      ) : error ? (
        <div className="forms-empty">{error}</div>
      ) : (
        <FormsList items={items} />
      )}

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
            {addTab === "datos" && (
              <DatosTab
                datos={datos}
                setDatos={setDatos}
                paisOptions={paisOptions}
                departamentoOptions={departamentoOptions}
                localidadOptions={localidadOptions}
                loadingCatalogos={catalogosLoading}
                errorCatalogos={catalogosError}
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
              onClick={() => {
                console.log("[Formularios] Guardar:", { datos });
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