import { useEffect, useMemo, useState } from "react";

import {
  buildDefaultDatos,
  buildFormularioPayload,
  getDepartamentoOptions,
  getLocalidadOptions,
  getFormularioPendienteOptions,
  getNombrePaisOptions,
  getProyectoOptions,
  todayInputDate,
  getPeriodoDias,
  mapFormularioItem,
  mergeFormularioDetalleToDatos,
} from "../components/formularios/forms.utils";

import {
  anularFormulario,
  enviarFormulario,
  fetchFormularioDetalle,
  fetchFormularios,
  fetchFormulariosPendientes,
  fetchProyectosFormulario,
  verificarFormulario,
} from "../components/formularios/formularios.api";
import {
  fetchFormulariosCatalogos,
  fetchLocalidadesByDepartamento,
} from "../components/formularios/formularios.catalogos.api";
import { validateFormularioPayload } from "../components/formularios/forms.validators";
import { getAuthSession } from "../components/auth/auth.storage";

import FormsToolbar from "../components/formularios/FormsToolbar";
import FormsList from "../components/formularios/FormsList";
import FormsInfoModal from "../components/formularios/FormsInfoModal";
import FormularioCargaModal from "../components/formularios/FormularioCargaModal";
import AnularFormularioModal from "../components/formularios/AnularFormularioModal";

export default function Formularios() {
  const [periodo, setPeriodo] = useState("30 días");
  const [estatus, setEstatus] = useState("En Proceso");
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [showInfo, setShowInfo] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addTab, setAddTab] = useState("datos");

  const [itemsRaw, setItemsRaw] = useState([]);
  const [formulariosPendientes, setFormulariosPendientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [catalogosLoading, setCatalogosLoading] = useState(true);
  const [catalogosError, setCatalogosError] = useState("");
  const [paises, setPaises] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  const [datos, setDatos] = useState(() => buildDefaultDatos());
  const [saving, setSaving] = useState(false);
  const [showAnular, setShowAnular] = useState(false);
  const [formularioAnular, setFormularioAnular] = useState(null);
  const [motivoAnular, setMotivoAnular] = useState("");
  const [fotoAnular, setFotoAnular] = useState("");

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
  const formularioOptions = useMemo(
    () => getFormularioPendienteOptions(formulariosPendientes, datos.formulario),
    [formulariosPendientes, datos.formulario],
  );

  const proyectoOptions = useMemo(
    () => getProyectoOptions(proyectos, datos.proyecto),
    [proyectos, datos.proyecto],
  );

  const getAsesorLogueado = () => {
    const session = getAuthSession();
    return session?.user?.asenum ? String(session.user.asenum) : "";
  };

  const closeAdd = () => {
    if (saving) return;
    setShowAdd(false);
    setOpenDropdownId(null);
  };

  const resetAdd = () => {
    const asesorCodigo = getAsesorLogueado();
    setDatos({
      ...buildDefaultDatos({ paises, departamentos, localidades }),
      asesor: asesorCodigo,
      asesorForm: asesorCodigo,
      fechaForm: todayInputDate(),
    });
    setAddTab("datos");
  };

  const reloadFormularios = async () => {
    const data = await fetchFormularios({
      periodoDias: getPeriodoDias(periodo),
      estatus,
    });
    setItemsRaw(data.items || []);
  };

  const reloadFormulariosPendientes = async () => {
    const data = await fetchFormulariosPendientes();
    setFormulariosPendientes(data.items || []);
    return data.items || [];
  };

  const reloadProyectos = async (fecha = datos.fechaForm || todayInputDate()) => {
    const data = await fetchProyectosFormulario(fecha);
    const items = data.items || [];
    setProyectos(items);
    setDatos((prev) => {
      const actualExiste = items.some((p) => String(p.ProyectoId) === String(prev.proyecto));
      return {
        ...prev,
        proyecto: actualExiste ? prev.proyecto : String(items[0]?.ProyectoId || prev.proyecto || ""),
      };
    });
    return items;
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        setOpenDropdownId(null);
        setShowInfo(false);
        setShowAdd(false);
        setShowAnular(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [saving]);

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
        const asesorCodigo = getAsesorLogueado();
        setDatos({
          ...buildDefaultDatos({ paises: data.paises || [] }),
          asesor: asesorCodigo,
          asesorForm: asesorCodigo,
          fechaForm: todayInputDate(),
        });
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

        if (!ignore) setItemsRaw(data.items || []);
      } catch (err) {
        if (!ignore) {
          setItemsRaw([]);
          setError(err.message || "No se pudieron cargar los formularios.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadFormularios();
    return () => {
      ignore = true;
    };
  }, [periodo, estatus]);

  useEffect(() => {
    let ignore = false;

    async function loadPendientes() {
      try {
        const data = await fetchFormulariosPendientes();
        if (!ignore) setFormulariosPendientes(data.items || []);
      } catch (err) {
        if (!ignore) {
          console.warn("[Formularios] No se pudieron cargar pendientes:", err);
          setFormulariosPendientes([]);
        }
      }
    }

    loadPendientes();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProyectos() {
      try {
        const data = await fetchProyectosFormulario(datos.fechaForm || todayInputDate());
        if (ignore) return;

        const items = data.items || [];
        setProyectos(items);
        setDatos((prev) => {
          const actualExiste = items.some((p) => String(p.ProyectoId) === String(prev.proyecto));
          return {
            ...prev,
            proyecto: actualExiste ? prev.proyecto : String(items[0]?.ProyectoId || prev.proyecto || ""),
          };
        });
      } catch (err) {
        if (!ignore) {
          console.warn("[Formularios] No se pudieron cargar proyectos:", err);
          setProyectos([]);
        }
      }
    }

    if (showAdd) loadProyectos();
    return () => {
      ignore = true;
    };
  }, [datos.fechaForm, showAdd]);

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
          const actualExiste = items.some((loc) => (loc.localidad || loc) === prev.localidad);
          return {
            ...prev,
            localidad: actualExiste ? prev.localidad : items[0]?.localidad || "",
          };
        });
      } catch {
        if (!ignore) setLocalidades([]);
      }
    }

    if (showAdd) loadLocalidades();
    return () => {
      ignore = true;
    };
  }, [datos.departamento, showAdd]);

  const cargarDetalleFormulario = async ({ fornum, asesor = "" }) => {
    const formulario = String(fornum || "").trim();
    if (!formulario) {
      setDatos((prev) => ({ ...prev, formulario: "" }));
      return;
    }

    const hoy = todayInputDate();

    setDatos((prev) => ({
      ...prev,
      formulario,
      asesor: getAsesorLogueado() || asesor || prev.asesor,
      asesorForm: getAsesorLogueado() || asesor || prev.asesorForm,
      fechaForm: prev.fechaForm || hoy,
    }));

    try {
      const detalle = await fetchFormularioDetalle(formulario);
      setDatos((prev) =>
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
      console.warn("[Formularios] No se pudo cargar detalle:", err);
    }
  };

  const handleFormularioChange = async (fornum) => {
    const option = formularioOptions.find((opt) => opt.value === fornum);
    await cargarDetalleFormulario({
      fornum,
      asesor: option?.asesor || "",
    });
  };

  const handleOpenFormulario = async (item) => {
    setAddTab("datos");
    setShowAdd(true);
    await cargarDetalleFormulario({
      fornum: item.id,
      asesor: item.asesor,
    });
  };

  const handleOpenAnular = (item) => {
    setFormularioAnular(item);
    setMotivoAnular("");
    setFotoAnular("");
    setShowAnular(true);
  };

  const closeAnular = () => {
    if (saving) return;
    setShowAnular(false);
    setFormularioAnular(null);
    setMotivoAnular("");
    setFotoAnular("");
  };

  const handleAnularSubmit = async () => {
    const fornum = formularioAnular?.id;
    if (!fornum) return;

    if (!motivoAnular.trim()) {
      window.alert("Debe ingresar el motivo de anulación.");
      return;
    }

    if (!fotoAnular) {
      window.alert("Debe cargar una foto o comprobante para la anulación.");
      return;
    }

    const ok = window.confirm(`Se enviará la solicitud de anulación del formulario ${fornum}. ¿Desea continuar?`);
    if (!ok) return;

    try {
      setSaving(true);
      await anularFormulario(fornum, {
        detalle: motivoAnular.trim(),
        foto: fotoAnular,
      });

      window.alert("Solicitud de anulación enviada con éxito.");
      closeAnular();
      await reloadFormularios();
      await reloadFormulariosPendientes();
    } catch (err) {
      window.alert(err.message || "Error al anular el formulario.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const validation = validateFormularioPayload(datos);

    if (validation.errors.length) {
      window.alert(validation.errors.join("\n"));
      setAddTab("datos");
      return;
    }

    for (const warning of validation.warnings) {
      const ok = window.confirm(warning);
      if (!ok) return;
    }

    try {
      setSaving(true);

      const verificacion = await verificarFormulario({
        formulario: datos.formulario,
        asesorForm: datos.asesorForm,
      });

      if (!verificacion.ok || verificacion.resultado !== "correcto") {
        window.alert("Verifique el número de formulario.");
        return;
      }

      const payload = buildFormularioPayload(datos);
      await enviarFormulario(datos.formulario, payload);

      window.alert("Formulario ingresado con éxito.");
      closeAdd();
      resetAdd();
      await reloadFormularios();
      await reloadFormulariosPendientes();
    } catch (err) {
      window.alert(err.message || "Error al insertar el formulario.");
    } finally {
      setSaving(false);
    }
  };

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
        <FormsList items={items} onItemClick={handleOpenFormulario} onAnularClick={handleOpenAnular} />
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
          resetAdd();
          setShowAdd(true);
          setAddTab("datos");
          reloadFormulariosPendientes().catch((err) => {
            console.warn("[Formularios] No se pudieron recargar pendientes:", err);
          });
          reloadProyectos(todayInputDate()).catch((err) => {
            console.warn("[Formularios] No se pudieron recargar proyectos:", err);
          });
        }}
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      <FormsInfoModal showInfo={showInfo} setShowInfo={setShowInfo} />


      <AnularFormularioModal
        show={showAnular}
        formulario={formularioAnular}
        motivo={motivoAnular}
        setMotivo={setMotivoAnular}
        foto={fotoAnular}
        setFoto={setFotoAnular}
        onClose={closeAnular}
        onSubmit={handleAnularSubmit}
        saving={saving}
      />

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
        proyectoOptions={proyectoOptions}
        formularioOptions={formularioOptions}
        onFormularioChange={handleFormularioChange}
        loadingCatalogos={catalogosLoading}
        errorCatalogos={catalogosError}
        saving={saving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
