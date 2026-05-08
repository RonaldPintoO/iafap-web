import { useEffect, useMemo, useState } from "react";
import {
  buildDefaultDatos,
  buildFormularioPayload,
  getDepartamentoOptions,
  getFormularioPendienteOptions,
  getLocalidadOptions,
  getNombrePaisOptions,
  getProyectoOptions,
  mergeFormularioDetalleToDatos,
  todayInputDate,
} from "../../../components/formularios/forms.utils";
import {
  fetchFormulariosCatalogos,
  fetchLocalidadesByDepartamento,
} from "../../../components/formularios/formularios.catalogos.api";
import {
  enviarFormulario,
  fetchFormularioDetalle,
  fetchFormulariosPendientes,
  fetchProyectosFormulario,
  verificarFormulario,
} from "../../../components/formularios/formularios.api";
import { validateFormularioPayload } from "../../../components/formularios/forms.validators";
import { getAsesorLogueado } from "../shared/afiliacionesController.helpers";

export default function useFormularioCargaController() {
  const [showFormularioModal, setShowFormularioModal] = useState(false);
  const [formularioTab, setFormularioTab] = useState("datos");
  const [formularioDatos, setFormularioDatos] = useState(() =>
    buildDefaultDatos(),
  );

  const [formPaises, setFormPaises] = useState([]);
  const [formDepartamentos, setFormDepartamentos] = useState([]);
  const [formLocalidades, setFormLocalidades] = useState([]);
  const [formFormulariosPendientes, setFormFormulariosPendientes] = useState([]);
  const [formProyectos, setFormProyectos] = useState([]);
  const [formCatalogosLoading, setFormCatalogosLoading] = useState(true);
  const [formCatalogosError, setFormCatalogosError] = useState("");
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

  const formFormularioOptions = useMemo(
    () => getFormularioPendienteOptions(formFormulariosPendientes, formularioDatos.formulario),
    [formFormulariosPendientes, formularioDatos.formulario],
  );

  const formProyectoOptions = useMemo(
    () => getProyectoOptions(formProyectos, formularioDatos.proyecto),
    [formProyectos, formularioDatos.proyecto],
  );

  const closeFormularioModal = () => {
    if (formularioSaving) return;
    setShowFormularioModal(false);
  };

  const resetFormularioModal = () => {
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
  };

  const reloadFormulariosPendientesModal = async () => {
    const data = await fetchFormulariosPendientes();
    const items = Array.isArray(data.items) ? data.items : [];
    setFormFormulariosPendientes(items);
    return items;
  };

  const reloadProyectosModal = async (fecha = formularioDatos.fechaForm || todayInputDate()) => {
    const data = await fetchProyectosFormulario(fecha);
    const items = Array.isArray(data.items) ? data.items : [];
    setFormProyectos(items);
    setFormularioDatos((prev) => {
      const actualExiste = items.some((p) => String(p.ProyectoId) === String(prev.proyecto));
      return {
        ...prev,
        proyecto: actualExiste ? prev.proyecto : String(items[0]?.ProyectoId || prev.proyecto || ""),
      };
    });
    return items;
  };

  const cargarDetalleFormularioModal = async ({ fornum, asesor = "" }) => {
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
      console.warn("[Afiliaciones] No se pudo cargar detalle del formulario:", err);
    }
  };

  const handleFormularioPendienteChange = async (fornum) => {
    const option = formFormularioOptions.find((opt) => opt.value === fornum);
    await cargarDetalleFormularioModal({
      fornum,
      asesor: option?.asesor || "",
    });
  };

  const handleOpenFormularioModal = async (persona) => {
    const hoy = todayInputDate();
    const asesorCodigo = getAsesorLogueado();

    const fechaNac = persona?.fechaNac ? persona.fechaNac.slice(0, 10) : "";

    setFormularioDatos((prev) => ({
      ...prev,
      formulario: "",
      asesor: asesorCodigo,
      asesorForm: asesorCodigo,
      fechaForm: hoy,

      cedula: persona?.cedula ? String(persona.cedula) : "",
      telefono: persona?.telefono ? String(persona.telefono) : "",
      celular: persona?.celular ? String(persona.celular) : "",
      mail: persona?.mail || "",
      fechaNac,
      departamento: persona?.departamento || "",
      localidad: persona?.ciudad || persona?.localidad || "",
      calle: persona?.calle || "",
      nro: persona?.nroPuerta || persona?.nro || "",
    }));

    setFormularioTab("datos");
    setShowFormularioModal(true);

    try {
      await Promise.all([
        reloadFormulariosPendientesModal(),
        reloadProyectosModal(todayInputDate()),
      ]);
    } catch (err) {
      console.warn("[Afiliaciones] No se pudieron cargar formularios pendientes:", err);
      setFormFormulariosPendientes([]);
    }
  };

  const handleSubmitFormulario = async () => {
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
      closeFormularioModal();
      resetFormularioModal();
      await Promise.all([
        reloadFormulariosPendientesModal(),
        reloadProyectosModal(todayInputDate()),
      ]);
    } catch (err) {
      window.alert(err.message || "Error al insertar el formulario.");
    } finally {
      setFormularioSaving(false);
    }
  };

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
          buildDefaultDatos({
            paises: data.paises || [],
            departamentos: data.departamentos || [],
            localidades: localidadesIniciales || [],
          }),
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
    let ignore = false;

    async function loadFormProyectos() {
      try {
        const data = await fetchProyectosFormulario(formularioDatos.fechaForm || todayInputDate());
        if (ignore) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setFormProyectos(items);
        setFormularioDatos((prev) => {
          const actualExiste = items.some((p) => String(p.ProyectoId) === String(prev.proyecto));
          return {
            ...prev,
            proyecto: actualExiste ? prev.proyecto : String(items[0]?.ProyectoId || prev.proyecto || ""),
          };
        });
      } catch (err) {
        if (!ignore) {
          console.warn("[Afiliaciones] No se pudieron cargar proyectos:", err);
          setFormProyectos([]);
        }
      }
    }

    if (showFormularioModal) loadFormProyectos();
    return () => {
      ignore = true;
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

  return {
    showFormularioModal,
    setShowFormularioModal,
    closeFormularioModal,
    formularioTab,
    setFormularioTab,
    formularioDatos,
    setFormularioDatos,
    formPaises,
    formDepartamentos,
    formLocalidades,
    formPaisOptions,
    formDepartamentoOptions,
    formLocalidadOptions,
    formProyectoOptions,
    formFormularioOptions,
    handleFormularioPendienteChange,
    formCatalogosLoading,
    formCatalogosError,
    formularioSaving,
    handleOpenFormularioModal,
    handleSubmitFormulario,
  };
}
