import { useEffect, useRef, useState } from "react";
import AfiliacionesTabs from "../components/afiliaciones/AfiliacionesTabs";
import PersonasPanel from "../components/afiliaciones/PersonasPanel";
import MapaPanel from "../components/afiliaciones/MapaPanel";
import AgendadosPanel from "../components/afiliaciones/AgendadosPanel";
import FiltrosModal from "../components/afiliaciones/FiltrosModal";
import AddPersonaModal from "../components/afiliaciones/AddPersonaModal";
import {
  PERSONAS_PAGE_SIZE,
  digitsOnly,
  buildDefaultPersonas,
  buildDefaultAgendados,
} from "../components/afiliaciones/afiliaciones.utils";
import { getConfiguracionGuardada } from "../components/configuracion/configuracion.utils";
import { API_BASE_URL } from "../config/api";

export default function Afiliaciones() {
  const [tab, setTab] = useState("personas");
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [topLocalidades, setTopLocalidades] = useState(["Todos"]);
  const [topLocValue, setTopLocValue] = useState("Todos");

  const [showAddPersona, setShowAddPersona] = useState(false);
  const [personaForm, setPersonaForm] = useState({
    ci: "",
    nombre: "",
    apellido: "",
    telefono: "",
  });

  const [personasDraftValues, setPersonasDraftValues] = useState(() =>
    buildDefaultPersonas()
  );
  const [personasAppliedValues, setPersonasAppliedValues] = useState(() =>
    buildDefaultPersonas()
  );
  const [personasFilterCatalogs, setPersonasFilterCatalogs] = useState({
    tipos: ["Todos"],
    acciones: ["Todos"],
  });

  const [agendadosValues, setAgendadosValues] = useState(() =>
    buildDefaultAgendados()
  );

  const [personasItems, setPersonasItems] = useState([]);
  const [personasLoading, setPersonasLoading] = useState(false);
  const [personasRefreshing, setPersonasRefreshing] = useState(false);
  const [personasError, setPersonasError] = useState("");
  const [personasPage, setPersonasPage] = useState(1);
  const [personasTotal, setPersonasTotal] = useState(0);
  const [personasTotalPages, setPersonasTotalPages] = useState(0);
  const [personasFiltrosError, setPersonasFiltrosError] = useState("");

  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [detalleTab, setDetalleTab] = useState("datos");
  const [accionesPersona, setAccionesPersona] = useState([]);
  const [accionesPersonaLoading, setAccionesPersonaLoading] = useState(false);
  const [accionesPersonaError, setAccionesPersonaError] = useState("");

  const [mapPoints, setMapPoints] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const [edadMinInput, setEdadMinInput] = useState("");
  const [edadMaxInput, setEdadMaxInput] = useState("");
  const [edadMinAplicada, setEdadMinAplicada] = useState("");
  const [edadMaxAplicada, setEdadMaxAplicada] = useState("");
  const [edadError, setEdadError] = useState("");

  const [tipoPersona, setTipoPersona] = useState("todos");
  const [personasReloadToken, setPersonasReloadToken] = useState(0);

  const mapRef = useRef(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [locMsg, setLocMsg] = useState("");

  const setPersonaField = (key, value) => {
    setPersonaForm((prev) => ({ ...prev, [key]: value }));
  };

  const ciOk = personaForm.ci.length > 0 && /^\d+$/.test(personaForm.ci);
  const telOk = personaForm.telefono === "" || /^\d+$/.test(personaForm.telefono);
  const canSubmit =
    ciOk &&
    telOk &&
    personaForm.nombre.trim() !== "" &&
    personaForm.apellido.trim() !== "";

  const closeAddPersona = () => setShowAddPersona(false);

  const onSubmitPersona = () => {
    if (!canSubmit) return;

    console.log("Nueva persona:", personaForm);
    setPersonaForm({
      ci: "",
      nombre: "",
      apellido: "",
      telefono: "",
    });
    closeAddPersona();
  };

  const handleOpenPersonaDetalle = (item) => {
    setPersonaSeleccionada(item);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
    setAccionesPersonaLoading(false);
  };

  const handleClosePersonaDetalle = () => {
    setPersonaSeleccionada(null);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
    setAccionesPersonaLoading(false);
  };

  const handleResetPersonas = async () => {
    const defaults = buildDefaultPersonas();

    setOpenDropdownId(null);
    setTopLocValue("Todos");
    setPersonasDraftValues(defaults);
    setPersonasAppliedValues(defaults);
    setShowFilters(false);
    handleClosePersonaDetalle();

    try {
      await fetch(`${API_BASE_URL}/personas/snapshot/refresh`, {
        method: "POST",
      });
    } catch (err) {
      console.error("No se pudo refrescar snapshot de personas:", err);
    }

    setPersonasPage(1);
    setPersonasReloadToken((prev) => prev + 1);
  };

  const handleResetAgendados = () => {
    setOpenDropdownId(null);
    setAgendadosValues(buildDefaultAgendados());
    setShowFilters(false);
  };

  const handleAcceptPersonasFilters = () => {
    const edadDesde = personasDraftValues.edadDesde.trim();
    const edadHasta = personasDraftValues.edadHasta.trim();

    if (
      edadDesde !== "" &&
      edadHasta !== "" &&
      Number(edadDesde) > Number(edadHasta)
    ) {
      setPersonasFiltrosError("La edad desde no puede ser mayor que la edad hasta");
      return;
    }

    setPersonasFiltrosError("");
    setPersonasAppliedValues({ ...personasDraftValues });
    setPersonasPage(1);
    setShowFilters(false);
    setOpenDropdownId(null);
    handleClosePersonaDetalle();
  };

  const handleLocate = () => {
    const map = mapRef.current;

    if (!map) {
      setLocStatus("error");
      setLocMsg("Mapa no listo");
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocStatus("error");
      setLocMsg("Geolocalización no soportada");
      return;
    }

    const applyLocation = (latitude, longitude, zoom = 15) => {
      const next = { lat: latitude, lng: longitude };
      setUserLoc(next);

      map.flyTo([latitude, longitude], zoom, {
        animate: true,
        duration: 0.8,
      });
    };

    setLocStatus("loading");
    setLocMsg("Obteniendo ubicación...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setLocStatus("ok");
        setLocMsg("");

        const zoom = accuracy && accuracy > 2000 ? 12 : 15;
        applyLocation(latitude, longitude, zoom);
      },
      (err) => {
        if (err.code === 1) {
          setLocStatus("error");
          setLocMsg("Permiso de ubicación denegado");
          return;
        }

        setLocMsg(
          err.code === 3
            ? "Tiempo de espera agotado, reintentando..."
            : "No se pudo obtener ubicación, reintentando..."
        );

        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            const { latitude, longitude, accuracy } = pos2.coords;

            setLocStatus("ok");
            setLocMsg("");

            const zoom = accuracy && accuracy > 2000 ? 12 : 15;
            applyLocation(latitude, longitude, zoom);
          },
          (err2) => {
            setLocStatus("error");

            if (err2.code === 1) setLocMsg("Permiso de ubicación denegado");
            else if (err2.code === 2) setLocMsg("Ubicación no disponible");
            else if (err2.code === 3) setLocMsg("Tiempo de espera agotado");
            else setLocMsg("No se pudo obtener ubicación");
          },
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 600000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 600000,
      }
    );
  };

  const handleApplyEdadFiltro = () => {
    const min = edadMinInput.trim();
    const max = edadMaxInput.trim();

    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      setEdadError("La edad mínima no puede ser mayor que la máxima");
      return;
    }

    setEdadError("");
    setEdadMinAplicada(min);
    setEdadMaxAplicada(max);
  };

  const handleClearEdadFiltro = () => {
    setEdadMinInput("");
    setEdadMaxInput("");
    setEdadMinAplicada("");
    setEdadMaxAplicada("");
    setEdadError("");
  };

  const handlePrevPersonasPage = () => {
    setPersonasPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPersonasPage = () => {
    setPersonasPage((prev) => {
      if (!personasTotalPages) return prev;
      return Math.min(personasTotalPages, prev + 1);
    });
  };

  const handleGoToPersonasPage = (nextPage) => {
    const safePage = Number(nextPage);

    if (!Number.isFinite(safePage) || safePage < 1) return;
    if (personasTotalPages && safePage > personasTotalPages) return;

    setPersonasPage(safePage);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenDropdownId(null);
        setShowAddPersona(false);
        setShowFilters(false);

        if (personaSeleccionada) {
          handleClosePersonaDetalle();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [personaSeleccionada]);

  useEffect(() => {
    if (!showFilters) {
      setOpenDropdownId(null);
      setPersonasFiltrosError("");
      return;
    }

    if (tab === "personas") {
      setPersonasDraftValues({ ...personasAppliedValues });
      setPersonasFiltrosError("");
    }
  }, [showFilters, tab, personasAppliedValues]);

  useEffect(() => {
    setLocMsg("");
    if (locStatus !== "idle") setLocStatus("idle");
  }, [tab, locStatus]);

  useEffect(() => {
    if (tab !== "personas" && tab !== "mapa") return;

    let cancelled = false;

    const loadLocalidades = async () => {
      try {
        const saved = getConfiguracionGuardada();
        const asesorCodigo = saved?.asesorCodigo
          ? String(saved.asesorCodigo).trim()
          : "";

        if (!asesorCodigo) {
          if (!cancelled) {
            setTopLocalidades(["Todos"]);
            setTopLocValue("Todos");
          }
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/personas/localidades?asesor=${encodeURIComponent(asesorCodigo)}`
        );

        if (!res.ok) {
          throw new Error("No se pudieron cargar las localidades");
        }

        const data = await res.json();
        const items =
          Array.isArray(data.items) && data.items.length > 0
            ? data.items
            : ["Todos"];

        if (cancelled) return;

        setTopLocalidades(items);

        setTopLocValue((prev) => {
          if (items.includes(prev)) return prev;
          return "Todos";
        });
      } catch {
        if (!cancelled) {
          setTopLocalidades(["Todos"]);
          setTopLocValue("Todos");
        }
      }
    };

    loadLocalidades();

    return () => {
      cancelled = true;
    };
  }, [tab, personasReloadToken]);

  useEffect(() => {
    if (tab !== "personas") return;

    let cancelled = false;

    const loadPersonasFilterCatalogs = async () => {
      try {
        const saved = getConfiguracionGuardada();
        const asesorCodigo = saved?.asesorCodigo
          ? String(saved.asesorCodigo).trim()
          : "";

        if (!asesorCodigo) {
          if (!cancelled) {
            setPersonasFilterCatalogs({
              tipos: ["Todos"],
              acciones: ["Todos"],
            });
          }
          return;
        }

        const params = new URLSearchParams();
        params.set("asesor", asesorCodigo);

        if (topLocValue && topLocValue !== "Todos") {
          params.set("localidad", topLocValue);
        }

        const res = await fetch(`${API_BASE_URL}/personas/filtros?${params.toString()}`);

        if (!res.ok) {
          throw new Error("No se pudieron cargar los filtros");
        }

        const data = await res.json();

        if (cancelled) return;

        setPersonasFilterCatalogs({
          tipos:
            Array.isArray(data.tipos) && data.tipos.length > 0
              ? data.tipos
              : ["Todos"],
          acciones:
            Array.isArray(data.acciones) && data.acciones.length > 0
              ? data.acciones
              : ["Todos"],
        });
      } catch (err) {
        if (!cancelled) {
          setPersonasFilterCatalogs({
            tipos: ["Todos"],
            acciones: ["Todos"],
          });
        }
      }
    };

    loadPersonasFilterCatalogs();

    return () => {
      cancelled = true;
    };
  }, [tab, topLocValue, personasReloadToken]);

  useEffect(() => {
    if (tab !== "personas") return;

    let cancelled = false;

    const fetchPersonas = async () => {
      try {
        const isFirstLoad = personasItems.length === 0;

        if (isFirstLoad) setPersonasLoading(true);
        else setPersonasRefreshing(true);

        setPersonasError("");

        const saved = getConfiguracionGuardada();
        const asesorCodigo = saved?.asesorCodigo
          ? String(saved.asesorCodigo).trim()
          : "";

        if (!asesorCodigo) {
          if (!cancelled) {
            setPersonasItems([]);
            setPersonasTotal(0);
            setPersonasTotalPages(0);
            setPersonasError("No hay un asesor seleccionado en Configuración.");
          }
          return;
        }

        const params = new URLSearchParams();
        params.set("asesor", asesorCodigo);
        params.set("page", String(personasPage));
        params.set("page_size", String(PERSONAS_PAGE_SIZE));

        if (topLocValue && topLocValue !== "Todos") {
          params.set("localidad", topLocValue);
        }

        if (personasAppliedValues.texto.trim()) {
          params.set("texto", personasAppliedValues.texto.trim());
        }

        if (personasAppliedValues.tipo !== "Todos") {
          params.set("tipo", personasAppliedValues.tipo);
        }

        if (personasAppliedValues.edadDesde !== "") {
          params.set("edad_desde", personasAppliedValues.edadDesde);
        }

        if (personasAppliedValues.edadHasta !== "") {
          params.set("edad_hasta", personasAppliedValues.edadHasta);
        }

        if (personasAppliedValues.edadParidad !== "Todas") {
          params.set("edad_paridad", personasAppliedValues.edadParidad);
        }

        if (personasAppliedValues.nacionalidad !== "Todos") {
          params.set("nacionalidad", personasAppliedValues.nacionalidad);
        }

        if (personasAppliedValues.estado !== "Todos") {
          params.set("estado", personasAppliedValues.estado);
        }

        if (personasAppliedValues.fechaAccion !== "Todos") {
          params.set("fecha_accion", personasAppliedValues.fechaAccion);
        }

        if (personasAppliedValues.accion !== "Todos") {
          params.set("accion", personasAppliedValues.accion);
        }

        if (personasAppliedValues.ley !== "Todos") {
          params.set("ley", personasAppliedValues.ley);
        }

        const url = `${API_BASE_URL}/personas?${params.toString()}`;
        const res = await fetch(url);

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            errorData?.detail || "No se pudo cargar la lista de personas"
          );
        }

        const data = await res.json();

        if (cancelled) return;

        setPersonasItems(Array.isArray(data.items) ? data.items : []);
        setPersonasTotal(Number(data.total) || 0);
        setPersonasTotalPages(Number(data.total_pages) || 0);

        const backendPage = Number(data.page) || 1;
        if (backendPage !== personasPage) {
          setPersonasPage(backendPage);
        }
      } catch (err) {
        if (!cancelled) {
          setPersonasItems([]);
          setPersonasTotal(0);
          setPersonasTotalPages(0);
          setPersonasError(err.message || "Error cargando personas");
        }
      } finally {
        if (!cancelled) {
          setPersonasLoading(false);
          setPersonasRefreshing(false);
        }
      }
    };

    fetchPersonas();

    return () => {
      cancelled = true;
    };
  }, [tab, personasPage, personasReloadToken, topLocValue, personasAppliedValues, personasItems.length]);

  useEffect(() => {
    setPersonasPage(1);
  }, [topLocValue, personasAppliedValues]);

  useEffect(() => {
    if (!personaSeleccionada?.cedula) return;
    if (detalleTab !== "acciones") return;

    let cancelled = false;
    const cedula = String(personaSeleccionada.cedula).trim();

    const fetchAcciones = async () => {
      try {
        if (!cancelled) {
          setAccionesPersonaLoading(true);
          setAccionesPersonaError("");
        }

        const res = await fetch(
          `${API_BASE_URL}/personas/${encodeURIComponent(cedula)}/acciones`
        );

        if (!res.ok) {
          throw new Error("No se pudieron cargar las acciones");
        }

        const data = await res.json();

        if (!cancelled) {
          setAccionesPersona(Array.isArray(data.items) ? data.items : []);
          setAccionesPersonaError("");
        }
      } catch (err) {
        if (!cancelled) {
          setAccionesPersona([]);
          setAccionesPersonaError(err.message || "Error cargando acciones");
        }
      } finally {
        if (!cancelled) {
          setAccionesPersonaLoading(false);
        }
      }
    };

    fetchAcciones();

    return () => {
      cancelled = true;
    };
  }, [personaSeleccionada?.cedula, detalleTab]);

  useEffect(() => {
    if (tab !== "mapa") return;

    let cancelled = false;

    const fetchMap = async () => {
      try {
        setMapLoading(true);
        setMapError("");

        const saved = getConfiguracionGuardada();
        const asesorCodigo = saved?.asesorCodigo
          ? String(saved.asesorCodigo).trim()
          : "";

        const params = new URLSearchParams();

        if (asesorCodigo) {
          params.set("asesor", asesorCodigo);
        }

        if (topLocValue && topLocValue !== "Todos") {
          params.set("localidad", topLocValue);
        }

        if (edadMinAplicada !== "") {
          params.set("edad_min", edadMinAplicada);
        }

        if (edadMaxAplicada !== "") {
          params.set("edad_max", edadMaxAplicada);
        }

        if (tipoPersona && tipoPersona !== "todos") {
          params.set("tipo_persona", tipoPersona);
        }

        const queryString = params.toString();
        const url = `${API_BASE_URL}/mapa${queryString ? `?${queryString}` : ""}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("No se pudo cargar el mapa");

        const data = await res.json();

        if (!cancelled) {
          setMapPoints(Array.isArray(data.points) ? data.points : []);
        }
      } catch (err) {
        if (!cancelled) {
          setMapError(err.message || "Error cargando mapa");
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    };

    fetchMap();

    return () => {
      cancelled = true;
    };
  }, [tab, edadMinAplicada, edadMaxAplicada, tipoPersona, topLocValue]);

  return (
    <div className="afi-page">
      <AfiliacionesTabs tab={tab} setTab={setTab} />

      {tab === "personas" && (
        <PersonasPanel
          topLocValue={topLocValue}
          setTopLocValue={setTopLocValue}
          topLocalidades={topLocalidades}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
          handleResetPersonas={handleResetPersonas}
          setShowFilters={setShowFilters}
          setShowAddPersona={setShowAddPersona}
          personasItems={personasItems}
          personasLoading={personasLoading}
          personasRefreshing={personasRefreshing}
          personasError={personasError}
          totalPersonas={personasTotal}
          page={personasPage}
          totalPages={personasTotalPages}
          onPrevPage={handlePrevPersonasPage}
          onNextPage={handleNextPersonasPage}
          onGoToPage={handleGoToPersonasPage}
          personaSeleccionada={personaSeleccionada}
          detalleTab={detalleTab}
          setDetalleTab={setDetalleTab}
          onOpenPersonaDetalle={handleOpenPersonaDetalle}
          onClosePersonaDetalle={handleClosePersonaDetalle}
          accionesPersona={accionesPersona}
          accionesPersonaLoading={accionesPersonaLoading}
          accionesPersonaError={accionesPersonaError}
        />
      )}

      {tab === "mapa" && (
        <MapaPanel
          mapRef={mapRef}
          userLoc={userLoc}
          locStatus={locStatus}
          locMsg={locMsg}
          handleLocate={handleLocate}
          mapPoints={mapPoints}
          mapLoading={mapLoading}
          mapError={mapError}
          edadMinInput={edadMinInput}
          edadMaxInput={edadMaxInput}
          setEdadMinInput={setEdadMinInput}
          setEdadMaxInput={setEdadMaxInput}
          handleApplyEdadFiltro={handleApplyEdadFiltro}
          handleClearEdadFiltro={handleClearEdadFiltro}
          edadError={edadError}
          tipoPersona={tipoPersona}
          setTipoPersona={setTipoPersona}
        />
      )}

      {tab === "agendados" && (
        <AgendadosPanel
          handleResetAgendados={handleResetAgendados}
          setShowFilters={setShowFilters}
        />
      )}

      <FiltrosModal
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        tab={tab}
        personasValues={personasDraftValues}
        setPersonasValues={setPersonasDraftValues}
        agendadosValues={agendadosValues}
        setAgendadosValues={setAgendadosValues}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
        personasFilterCatalogs={personasFilterCatalogs}
        onAcceptPersonas={handleAcceptPersonasFilters}
        personasFiltrosError={personasFiltrosError}
      />

      <AddPersonaModal
        show={showAddPersona}
        closeAddPersona={closeAddPersona}
        personaForm={personaForm}
        setPersonaField={setPersonaField}
        digitsOnly={digitsOnly}
        ciOk={ciOk}
        telOk={telOk}
        canSubmit={canSubmit}
        onSubmitPersona={onSubmitPersona}
      />
    </div>
  );
}