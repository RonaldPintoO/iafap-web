import { authFetch } from "../components/auth/auth.api";
import { getAuthSession } from "../components/auth/auth.storage";
import { useEffect, useMemo, useState } from "react";
import PersonaDetalle from "../components/afiliaciones/personas/PersonaDetalle";
import FormularioCargaModal from "../components/formularios/FormularioCargaModal";
import {
  buildDefaultDatos,
  buildFormularioPayload,
  getDepartamentoOptions,
  getFormularioPendienteOptions,
  getLocalidadOptions,
  getNombrePaisOptions,
  getProyectoOptions,
  todayInputDate,
  mergeFormularioDetalleToDatos,
} from "../components/formularios/forms.utils";
import {
  fetchFormulariosCatalogos,
  fetchLocalidadesByDepartamento,
} from "../components/formularios/formularios.catalogos.api";
import {
  enviarFormulario,
  fetchFormularioDetalle,
  fetchFormulariosPendientes,
  fetchProyectosFormulario,
  verificarFormulario,
} from "../components/formularios/formularios.api";
import { validateFormularioPayload } from "../components/formularios/forms.validators";


function scrollAppToTop() {
  window.requestAnimationFrame(() => {
    const main = document.querySelector(".main");
    if (main && typeof main.scrollTo === "function") {
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    const detail = document.querySelector(".afi-detail");
    if (detail && typeof detail.scrollTo === "function") {
      detail.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

function onlyDigitsInput(value) {
  return value.replace(/\D/g, "");
}

function fechaDDMMYYYYToInput(value) {
  const clean = String(value || "").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return "";

  const [dd, mm, yyyy] = clean.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SoloCedula() {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [persona, setPersona] = useState(null);
  const [detalleTab, setDetalleTab] = useState("datos");

  const [accionesPersona, setAccionesPersona] = useState([]);
  const [accionesPersonaLoading, setAccionesPersonaLoading] = useState(false);
  const [accionesPersonaError, setAccionesPersonaError] = useState("");

  const [showAccionModal, setShowAccionModal] = useState(false);
  const [accionesCatalogos, setAccionesCatalogos] = useState({
    tipos: [],
    resultados: [],
  });
  const [accionesCatalogosLoading, setAccionesCatalogosLoading] =
    useState(false);
  const [accionesCatalogosError, setAccionesCatalogosError] = useState("");

  const [accionSaving, setAccionSaving] = useState(false);
  const [accionSaveError, setAccionSaveError] = useState("");
  const [accionEditando, setAccionEditando] = useState(null);

  const [showFormularioModal, setShowFormularioModal] = useState(false);
  const [formularioTab, setFormularioTab] = useState("datos");
  const [formularioDatos, setFormularioDatos] = useState(() =>
    buildDefaultDatos(),
  );

  const [formPaises, setFormPaises] = useState([]);
  const [formDepartamentos, setFormDepartamentos] = useState([]);
  const [formLocalidades, setFormLocalidades] = useState([]);
  const [formCatalogosLoading, setFormCatalogosLoading] = useState(true);
  const [formCatalogosError, setFormCatalogosError] = useState("");
  const [formulariosPendientes, setFormulariosPendientes] = useState([]);
  const [proyectosFormulario, setProyectosFormulario] = useState([]);
  const [formularioSaving, setFormularioSaving] = useState(false);

  const formPaisOptions = useMemo(
    () => getNombrePaisOptions(formPaises),
    [formPaises],
  );

  const formDepartamentoOptions = useMemo(
    () => getDepartamentoOptions(formDepartamentos),
    [formDepartamentos],
  );

  const formLocalidadOptions = useMemo(
    () => getLocalidadOptions(formLocalidades),
    [formLocalidades],
  );

  const formularioOptions = useMemo(
    () => getFormularioPendienteOptions(formulariosPendientes, formularioDatos.formulario),
    [formulariosPendientes, formularioDatos.formulario],
  );

  const proyectoOptions = useMemo(
    () => getProyectoOptions(proyectosFormulario, formularioDatos.proyecto),
    [proyectosFormulario, formularioDatos.proyecto],
  );

  const getAsesorLogueado = () => {
    const session = getAuthSession();
    return session?.user?.asenum ? String(session.user.asenum) : "";
  };

  useEffect(() => {
    if (persona?.cedula) {
      scrollAppToTop();
    }
  }, [persona?.cedula]);

  function onChange(e) {
    const clean = onlyDigitsInput(e.target.value).slice(0, 9);
    setCedula(clean);
  }

  async function buscar() {
    if (!cedula) {
      alert("Ingresá una cédula.");
      return;
    }

    if (cedula.length < 7) {
      alert("La cédula parece incompleta (mínimo 7 dígitos).");
      return;
    }

    setLoading(true);
    setError("");
    setPersona(null);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
    setShowFormularioModal(false);

    try {
      const response = await authFetch(`/solo-cedula/${cedula}`);
      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo consultar la cédula.");
      }

      if (!json.data) {
        setError("No se encontró información para la cédula ingresada.");
        return;
      }

      setPersona(json.data);
    } catch (err) {
      setError(err.message || "Ocurrió un error al consultar la cédula.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarAccionesCatalogos() {
    setAccionesCatalogosLoading(true);
    setAccionesCatalogosError("");

    try {
      const response = await authFetch("/personas/acciones/catalogos");
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.ok) {
        throw new Error(json?.detail || "No se pudieron cargar las opciones.");
      }

      setAccionesCatalogos({
        tipos: Array.isArray(json.tipos) ? json.tipos : [],
        resultados: Array.isArray(json.resultados) ? json.resultados : [],
      });
    } catch (err) {
      setAccionesCatalogos({ tipos: [], resultados: [] });
      setAccionesCatalogosError(
        err.message || "No se pudieron cargar las opciones.",
      );
    } finally {
      setAccionesCatalogosLoading(false);
    }
  }

  async function abrirNuevaAccion() {
    setAccionSaveError("");
    setAccionEditando(null);
    setShowAccionModal(true);

    if (
      !accionesCatalogos.tipos.length ||
      !accionesCatalogos.resultados.length
    ) {
      await cargarAccionesCatalogos();
    }
  }

  async function abrirEditarAccion(accion) {
    if (!accion?.accnum) return;

    setAccionSaveError("");
    setAccionEditando(accion);
    setShowAccionModal(true);

    if (
      !accionesCatalogos.tipos.length ||
      !accionesCatalogos.resultados.length
    ) {
      await cargarAccionesCatalogos();
    }
  }

  function cerrarNuevaAccion() {
    if (accionSaving) return;

    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
  }

  async function guardarNuevaAccion(payload) {
    const ci = String(persona?.cedula || "").trim();
    if (!ci) return;

    setAccionSaving(true);
    setAccionSaveError("");

    try {
      const editandoAccnum = accionEditando?.accnum;

      const url = editandoAccnum
        ? `/personas/acciones/${encodeURIComponent(editandoAccnum)}`
        : `/personas/${encodeURIComponent(ci)}/acciones`;

      const method = editandoAccnum ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            (editandoAccnum
              ? "No se pudo actualizar la acción."
              : "No se pudo guardar la acción."),
        );
      }

      setAccionesPersona(Array.isArray(json.items) ? json.items : []);
      setShowAccionModal(false);
      setAccionEditando(null);
    } catch (err) {
      setAccionSaveError(
        err.message ||
          (accionEditando?.accnum
            ? "No se pudo actualizar la acción."
            : "No se pudo guardar la acción."),
      );
    } finally {
      setAccionSaving(false);
    }
  }

  function cerrarFormularioModal() {
    if (formularioSaving) return;
    setShowFormularioModal(false);
  }

  async function cargarFormulariosPendientes() {
    const data = await fetchFormulariosPendientes();
    const items = data.items || [];
    setFormulariosPendientes(items);
    return items;
  }

  async function cargarProyectosFormulario(fecha = formularioDatos.fechaForm || todayInputDate()) {
    const data = await fetchProyectosFormulario(fecha);
    const items = data.items || [];
    setProyectosFormulario(items);
    setFormularioDatos((prev) => {
      const actualExiste = items.some((p) => String(p.ProyectoId) === String(prev.proyecto));
      return {
        ...prev,
        proyecto: actualExiste ? prev.proyecto : String(items[0]?.ProyectoId || prev.proyecto || ""),
      };
    });
    return items;
  }

  async function cargarDetalleFormulario({ fornum, asesor = "" }) {
    const formulario = String(fornum || "").trim();

    if (!formulario) {
      setFormularioDatos((prev) => ({ ...prev, formulario: "" }));
      return;
    }

    const hoy = todayInputDate();

    setFormularioDatos((prev) => ({
      ...prev,
      formulario,
      asesor: getAsesorLogueado() || asesor || prev.asesor,
      asesorForm: getAsesorLogueado() || asesor || prev.asesorForm,
      fechaForm: prev.fechaForm || hoy,
    }));

    try {
      const detalle = await fetchFormularioDetalle(formulario);

      setFormularioDatos((prev) =>
        mergeFormularioDetalleToDatos(
          {
            ...prev,
            formulario,
            asesor: getAsesorLogueado() || asesor || prev.asesor,
            asesorForm: getAsesorLogueado() || asesor || prev.asesorForm,
            fechaForm: prev.fechaForm || hoy,
          },
          detalle.item,
          { asesorLogueado: getAsesorLogueado() || asesor },
        ),
      );
    } catch (err) {
      console.warn("[SoloCedula] No se pudo cargar detalle del formulario:", err);
    }
  }

  async function handleFormularioChange(fornum) {
    const option = formularioOptions.find((opt) => opt.value === fornum);
    await cargarDetalleFormulario({
      fornum,
      asesor: option?.asesor || "",
    });
  }

  function resetFormularioModal() {
    const asesorCodigo = getAsesorLogueado();
    setFormularioDatos({
      ...buildDefaultDatos({
        paises: formPaises,
        departamentos: formDepartamentos,
        localidades: formLocalidades,
      }),
      asesor: asesorCodigo,
      asesorForm: asesorCodigo,
      fechaForm: todayInputDate(),
    });
    setFormularioTab("datos");
  }

  async function abrirFormularioModal(personaActual) {
    const hoy = todayInputDate();
    const asesorCodigo = getAsesorLogueado();

    const direccion = personaActual?.direccion || {};
    const telefonos = personaActual?.telefonos || {};

    const telefonoPrecarga =
      telefonos.telefono ||
      personaActual?.telefono ||
      personaActual?.pertel ||
      "";
    const celularPrecarga =
      telefonos.celular ||
      personaActual?.celular ||
      personaActual?.percel ||
      "";
    const mailPrecarga =
      personaActual?.mail ||
      personaActual?.email ||
      personaActual?.permail ||
      "";
    const callePrecarga =
      direccion.calle ||
      personaActual?.calle ||
      personaActual?.percalle ||
      "";
    const nroPrecarga =
      direccion.numero ||
      personaActual?.nroPuerta ||
      personaActual?.nro ||
      personaActual?.perpuerta ||
      "";

    setFormularioDatos((prev) => ({
      ...prev,
      formulario: "",
      asesor: asesorCodigo,
      asesorForm: asesorCodigo,
      fechaForm: hoy,

      cedula: personaActual?.cedula ? String(personaActual.cedula) : "",
      telefono: telefonoPrecarga ? String(telefonoPrecarga) : "",
      celular: celularPrecarga ? String(celularPrecarga) : "",
      mail: mailPrecarga || "",
      fechaNac:
        personaActual?.fechaNac?.slice?.(0, 10) ||
        fechaDDMMYYYYToInput(personaActual?.fechaNacimiento),
      departamento: personaActual?.departamento || "",
      localidad: personaActual?.ciudad || personaActual?.localidad || "",
      calle: callePrecarga,
      nro: nroPrecarga ? String(nroPrecarga) : "",
    }));

    setFormularioTab("datos");
    setShowFormularioModal(true);

    try {
      await Promise.all([
        cargarFormulariosPendientes(),
        cargarProyectosFormulario(todayInputDate()),
      ]);
    } catch (err) {
      console.warn("[SoloCedula] No se pudieron cargar formularios pendientes:", err);
      setFormulariosPendientes([]);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadFormularioCatalogos() {
      try {
        setFormCatalogosLoading(true);
        setFormCatalogosError("");

        const data = await fetchFormulariosCatalogos();
        if (cancelled) return;

        setFormPaises(data.paises || []);
        setFormDepartamentos(data.departamentos || []);

        const primerDepartamento = data.departamentos?.[0] || "";
        let localidadesIniciales = [];

        if (primerDepartamento) {
          localidadesIniciales =
            await fetchLocalidadesByDepartamento(primerDepartamento);

          if (cancelled) return;
        }

        setFormLocalidades(localidadesIniciales);
        setFormularioDatos(
          {
            ...buildDefaultDatos({
              paises: data.paises || [],
              departamentos: data.departamentos || [],
              localidades: localidadesIniciales || [],
            }),
            asesor: getAsesorLogueado(),
            asesorForm: getAsesorLogueado(),
            fechaForm: todayInputDate(),
          },
        );
      } catch (err) {
        if (!cancelled) {
          setFormCatalogosError(
            err.message || "No se pudieron cargar los catálogos.",
          );
        }
      } finally {
        if (!cancelled) setFormCatalogosLoading(false);
      }
    }

    loadFormularioCatalogos();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProyectosFormulario() {
      try {
        const data = await fetchProyectosFormulario(formularioDatos.fechaForm || todayInputDate());
        if (cancelled) return;
        const items = data.items || [];
        setProyectosFormulario(items);
        setFormularioDatos((prev) => {
          const actualExiste = items.some((p) => String(p.ProyectoId) === String(prev.proyecto));
          return {
            ...prev,
            proyecto: actualExiste ? prev.proyecto : String(items[0]?.ProyectoId || prev.proyecto || ""),
          };
        });
      } catch (err) {
        if (!cancelled) {
          console.warn("[SoloCedula] No se pudieron cargar proyectos:", err);
          setProyectosFormulario([]);
        }
      }
    }

    if (showFormularioModal) {
      loadProyectosFormulario();
    }

    return () => {
      cancelled = true;
    };
  }, [formularioDatos.fechaForm, showFormularioModal]);

  useEffect(() => {
    let cancelled = false;

    async function loadLocalidadesFormulario() {
      const departamento = formularioDatos.departamento;

      if (!departamento) {
        setFormLocalidades([]);
        return;
      }

      try {
        const items = await fetchLocalidadesByDepartamento(departamento);
        if (cancelled) return;

        setFormLocalidades(items);

        setFormularioDatos((prev) => {
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
        if (!cancelled) {
          setFormLocalidades([]);
        }
      }
    }

    if (showFormularioModal) {
      loadLocalidadesFormulario();
    }

    return () => {
      cancelled = true;
    };
  }, [formularioDatos.departamento, showFormularioModal]);

  useEffect(() => {
    if (!persona?.cedula || detalleTab !== "acciones") return;

    let cancelled = false;

    async function cargarAcciones() {
      setAccionesPersonaLoading(true);
      setAccionesPersonaError("");

      try {
        const response = await authFetch(
          `/personas/${encodeURIComponent(persona.cedula)}/acciones`,
        );
        const json = await response.json();

        if (!response.ok || !json?.ok) {
          throw new Error(json?.error || "No se pudieron cargar las acciones.");
        }

        if (!cancelled) {
          setAccionesPersona(Array.isArray(json.items) ? json.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setAccionesPersona([]);
          setAccionesPersonaError(
            err.message || "Error al cargar acciones de la persona.",
          );
        }
      } finally {
        if (!cancelled) {
          setAccionesPersonaLoading(false);
        }
      }
    }

    cargarAcciones();

    return () => {
      cancelled = true;
    };
  }, [persona, detalleTab]);

  async function guardarFormularioDesdeSoloCedula() {
    const validation = validateFormularioPayload(formularioDatos);

    if (validation.errors.length) {
      window.alert(validation.errors.join("\n"));
      setFormularioTab("datos");
      return;
    }

    for (const warning of validation.warnings) {
      const ok = window.confirm(warning);
      if (!ok) return;
    }

    try {
      setFormularioSaving(true);

      const verificacion = await verificarFormulario({
        formulario: formularioDatos.formulario,
        asesorForm: formularioDatos.asesorForm,
      });

      if (!verificacion.ok || verificacion.resultado !== "correcto") {
        window.alert("Verifique el número de formulario.");
        return;
      }

      const payload = buildFormularioPayload(formularioDatos);
      await enviarFormulario(formularioDatos.formulario, payload);

      window.alert("Formulario ingresado con éxito.");
      cerrarFormularioModal();
      resetFormularioModal();
      await Promise.all([
        cargarFormulariosPendientes(),
        cargarProyectosFormulario(todayInputDate()),
      ]);
    } catch (err) {
      window.alert(err.message || "Error al insertar el formulario.");
    } finally {
      setFormularioSaving(false);
    }
  }

  const personaDetalle = persona || null;

  function volverABusqueda() {
    setPersona(null);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
    setShowFormularioModal(false);
  }

  if (personaDetalle) {
    return (
      <>
        <PersonaDetalle
          item={personaDetalle}
          detalleTab={detalleTab}
          setDetalleTab={setDetalleTab}
          onClose={volverABusqueda}
          accionesPersona={accionesPersona}
          accionesPersonaLoading={accionesPersonaLoading}
          accionesPersonaError={accionesPersonaError}
          showAccionModal={showAccionModal}
          accionesCatalogos={accionesCatalogos}
          accionesCatalogosLoading={accionesCatalogosLoading}
          accionesCatalogosError={accionesCatalogosError}
          accionSaving={accionSaving}
          accionSaveError={accionSaveError}
          accionEditando={accionEditando}
          onOpenNuevaAccion={abrirNuevaAccion}
          onOpenEditarAccion={abrirEditarAccion}
          onCloseNuevaAccion={cerrarNuevaAccion}
          onSaveNuevaAccion={guardarNuevaAccion}
          onReloadAccionesCatalogos={cargarAccionesCatalogos}
          onOpenFormularioModal={abrirFormularioModal}
        />

        <FormularioCargaModal
          show={showFormularioModal}
          closeAdd={cerrarFormularioModal}
          addTab={formularioTab}
          setAddTab={setFormularioTab}
          datos={formularioDatos}
          setDatos={setFormularioDatos}
          paisOptions={formPaisOptions}
          departamentoOptions={formDepartamentoOptions}
          localidadOptions={formLocalidadOptions}
          proyectoOptions={proyectoOptions}
          formularioOptions={formularioOptions}
          onFormularioChange={handleFormularioChange}
          loadingCatalogos={formCatalogosLoading}
          errorCatalogos={formCatalogosError}
          saving={formularioSaving}
          onSubmit={guardarFormularioDesdeSoloCedula}
        />
      </>
    );
  }

  return (
    <div className="solo-page">
      <div className="solo-tabs">
        <button className="solo-tab is-active" type="button">
          Buscar Cédula
        </button>
        <div className="solo-tab-spacer" />
      </div>

      <div className="solo-content">
        <div className="solo-input-wrap">
          <input
            id="buscar-cedula"
            name="buscar_cedula"
            value={cedula}
            onChange={onChange}
            onFocus={(e) => e.target.select()}
            onDoubleClick={(e) => e.target.select()}
            onPointerUp={(e) => {
              if (e.target.value) e.target.select();
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Cédula"
          />
          <div className="solo-underline" />
        </div>

        <button
          className="solo-btn"
          type="button"
          onClick={buscar}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {error ? (
          <div className="afi-empty" style={{ marginTop: 18 }}>
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
