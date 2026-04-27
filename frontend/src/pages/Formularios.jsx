import { useEffect, useMemo, useState } from "react";

import {
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
import FormularioCargaModal from "../components/formularios/FormularioCargaModal";

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
    [departamentos],
  );
  const localidadOptions = useMemo(
    () => getLocalidadOptions(localidades),
    [localidades],
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
      }),
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
          localidadesIniciales =
            await fetchLocalidadesByDepartamento(primerDepartamento);
          if (ignore) return;
        }

        setLocalidades(localidadesIniciales);

        setDatos(
          buildDefaultDatos({
            paises: data.paises || [],
            departamentos: data.departamentos || [],
            localidades: localidadesIniciales || [],
          }),
        );
      } catch (err) {
        if (!ignore) {
          setCatalogosError(
            err.message || "No se pudieron cargar los catálogos.",
          );
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
            (loc) => (loc.localidad || loc) === prev.localidad,
          );

          return {
            ...prev,
            localidad: actualExiste
              ? prev.localidad
              : items[0]?.localidad || "",
          };
        });
      } catch {
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
        <FormsList
          items={items}
          onItemClick={(item) => {
            const hoy = new Date().toISOString().slice(0, 10); // formato YYYY-MM-DD
            setDatos((prev) => ({
              ...prev,
              formulario: item.id,
              asesor: item.asesor,
              asesorForm: item.asesor,
              fechaForm: hoy,
            }));

            setAddTab("datos");
            setShowAdd(true);
          }}
        />
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

      <FormularioCargaModal
        show={showAdd}
        closeAdd={closeAdd}
        addTab={addTab}
        setAddTab={setAddTab}
        datos={datos}
        setDatos={setDatos}
        paisOptions={paisOptions}
        departamentoOptions={departamentoOptions}
        localidadOptions={localidadOptions}
        loadingCatalogos={catalogosLoading}
        errorCatalogos={catalogosError}
        onSubmit={() => {
          console.log("[Formularios] Guardar:", { datos });
          closeAdd();
          resetAdd();
        }}
      />
    </div>
  );
}
