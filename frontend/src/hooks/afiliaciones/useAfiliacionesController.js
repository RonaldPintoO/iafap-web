import { useEffect, useState } from "react";
import { digitsOnly } from "../../components/afiliaciones/shared/afiliaciones.utils";
import { apiFetch } from "../../config/api";
import useAddPersonaModal from "./personas/useAddPersonaModal";
import useAfiliacionesMap from "./mapa/useAfiliacionesMap";
import useAgendadosList from "./agendados/useAgendadosList";
import useFormularioCargaController from "./formularios/useFormularioCargaController";
import usePersonaDetalleController from "./personas/usePersonaDetalleController";
import usePersonasFilters from "./personas/usePersonasFilters";
import usePersonasList from "./personas/usePersonasList";
import useTopLocalidades from "./personas/useTopLocalidades";
import { buildPersonaDesdeAgendado } from "./shared/afiliacionesController.helpers";

export default function useAfiliacionesController() {
  const [tab, setTab] = useState("personas");
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [personasReloadToken, setPersonasReloadToken] = useState(0);

  const closeDropdowns = () => setOpenDropdownId(null);
  const closeFilters = () => setShowFilters(false);

  const addPersona = useAddPersonaModal();
  const formulario = useFormularioCargaController();

  const agendados = useAgendadosList({
    tab,
    formDepartamentos: formulario.formDepartamentos,
  });

  const detalle = usePersonaDetalleController({
    onAfterSaveAccion: () => {
      setPersonasReloadToken((prev) => prev + 1);
      agendados.setAgendadosReloadToken((prev) => prev + 1);
    },
  });

  const topLocalidades = useTopLocalidades({
    tab,
    personasReloadToken,
  });

  const personasFilters = usePersonasFilters({
    tab,
    showFilters,
    topLocValue: topLocalidades.topLocValue,
    personasReloadToken,
    setOpenDropdownId,
    setShowFilters,
    setPersonasPage: () => {},
    onCloseDetalle: detalle.handleClosePersonaDetalle,
  });

  const personas = usePersonasList({
    tab,
    topLocValue: topLocalidades.topLocValue,
    personasReloadToken,
    personasAppliedValues: personasFilters.personasAppliedValues,
  });

  const mapa = useAfiliacionesMap({
    tab,
    topLocValue: topLocalidades.topLocValue,
  });

  const { setShowAddPersona } = addPersona;
  const {
    showFormularioModal,
    formularioSaving,
    setShowFormularioModal,
  } = formulario;
  const { personaSeleccionada, handleClosePersonaDetalle } = detalle;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeDropdowns();
        setShowAddPersona(false);
        closeFilters();

        if (showFormularioModal && !formularioSaving) {
          setShowFormularioModal(false);
        }

        if (personaSeleccionada) {
          handleClosePersonaDetalle();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    personaSeleccionada,
    showFormularioModal,
    formularioSaving,
    setShowAddPersona,
    setShowFormularioModal,
    handleClosePersonaDetalle,
  ]);

  const handleResetPersonas = async () => {
    closeDropdowns();
    topLocalidades.setTopLocValue("Todos");
    personasFilters.resetPersonasFilters();
    closeFilters();
    detalle.handleClosePersonaDetalle();

    apiFetch(`/personas/snapshot/refresh`, {
      method: "POST",
    }).catch((err) => {
      console.error("No se pudo refrescar snapshot de personas:", err);
    });

    personas.setPersonasPage(1);
    setPersonasReloadToken((prev) => prev + 1);
  };

  const handleResetAgendados = () => {
    agendados.handleResetAgendados({
      closeDropdowns,
      closeFilters,
    });
  };

  const handleOpenPersonaDesdeAgendado = (item) => {
    setTab("personas");
    detalle.handleOpenPersonaDetalle(buildPersonaDesdeAgendado(item));
  };

  const handleRegistrarGestionAgendado = async (item) => {
    setTab("personas");
    detalle.handleOpenPersonaDetalle(buildPersonaDesdeAgendado(item));
    detalle.setDetalleTab("acciones");
    detalle.setAccionEditando(null);
    detalle.setAccionSaveError("");
    detalle.setShowAccionModal(true);
    await detalle.ensureAccionesCatalogos();
  };

  return {
    tab,
    setTab,
    showFilters,
    setShowFilters,
    openDropdownId,
    setOpenDropdownId,

    ...topLocalidades,
    ...addPersona,

    personasDraftValues: personasFilters.personasDraftValues,
    setPersonasDraftValues: personasFilters.setPersonasDraftValues,
    personasFilterCatalogs: personasFilters.personasFilterCatalogs,
    personasFiltrosError: personasFilters.personasFiltrosError,
    handleAcceptPersonasFilters: personasFilters.handleAcceptPersonasFilters,
    handleResetPersonas,

    agendadosValues: agendados.agendadosValues,
    setAgendadosValues: agendados.setAgendadosValues,
    agendadosDepartamentoOptions: agendados.agendadosDepartamentoOptions,
    agendadosLocalidadOptions: agendados.agendadosLocalidadOptions,
    agendadosLocalidadesLoading: agendados.agendadosLocalidadesLoading,

    personasItems: personas.personasItems,
    personasLoading: personas.personasLoading,
    personasRefreshing: personas.personasRefreshing,
    personasError: personas.personasError,
    personasTotal: personas.personasTotal,
    personasPage: personas.personasPage,
    personasTotalPages: personas.personasTotalPages,
    handlePrevPersonasPage: personas.handlePrevPersonasPage,
    handleNextPersonasPage: personas.handleNextPersonasPage,
    handleGoToPersonasPage: personas.handleGoToPersonasPage,

    personaSeleccionada: detalle.personaSeleccionada,
    detalleTab: detalle.detalleTab,
    setDetalleTab: detalle.setDetalleTab,
    handleOpenPersonaDetalle: detalle.handleOpenPersonaDetalle,
    handleClosePersonaDetalle: detalle.handleClosePersonaDetalle,
    accionesPersona: detalle.accionesPersona,
    accionesPersonaLoading: detalle.accionesPersonaLoading,
    accionesPersonaError: detalle.accionesPersonaError,
    handleOpenFormularioModal: formulario.handleOpenFormularioModal,
    vinculosPersona: detalle.vinculosPersona,
    vinculosPersonaLoading: detalle.vinculosPersonaLoading,
    vinculosPersonaError: detalle.vinculosPersonaError,
    handleOpenVinculoDelVinculo: detalle.handleOpenVinculoDelVinculo,
    vinculosInfoModal: detalle.vinculosInfoModal,
    vinculosInfoModalLoading: detalle.vinculosInfoModalLoading,
    vinculosInfoModalError: detalle.vinculosInfoModalError,
    showAccionModal: detalle.showAccionModal,
    accionesCatalogos: detalle.accionesCatalogos,
    accionesCatalogosLoading: detalle.accionesCatalogosLoading,
    accionesCatalogosError: detalle.accionesCatalogosError,
    accionSaving: detalle.accionSaving,
    accionSaveError: detalle.accionSaveError,
    accionEditando: detalle.accionEditando,
    handleOpenNuevaAccion: detalle.handleOpenNuevaAccion,
    handleOpenEditarAccion: detalle.handleOpenEditarAccion,
    handleCloseNuevaAccion: detalle.handleCloseNuevaAccion,
    handleSaveNuevaAccion: detalle.handleSaveNuevaAccion,
    cargarAccionesCatalogos: detalle.cargarAccionesCatalogos,

    ...mapa,

    handleResetAgendados,
    agendadosItems: agendados.agendadosItems,
    agendadosTotal: agendados.agendadosTotal,
    agendadosPage: agendados.agendadosPage,
    agendadosTotalPages: agendados.agendadosTotalPages,
    handlePrevAgendadosPage: agendados.handlePrevAgendadosPage,
    handleNextAgendadosPage: agendados.handleNextAgendadosPage,
    handleGoToAgendadosPage: agendados.handleGoToAgendadosPage,
    agendadosLoading: agendados.agendadosLoading,
    agendadosRefreshing: agendados.agendadosRefreshing,
    agendadosError: agendados.agendadosError,
    handleOpenPersonaDesdeAgendado,
    handleRegistrarGestionAgendado,

    showFormularioModal: formulario.showFormularioModal,
    closeFormularioModal: formulario.closeFormularioModal,
    formularioTab: formulario.formularioTab,
    setFormularioTab: formulario.setFormularioTab,
    formularioDatos: formulario.formularioDatos,
    setFormularioDatos: formulario.setFormularioDatos,
    formPaisOptions: formulario.formPaisOptions,
    formDepartamentoOptions: formulario.formDepartamentoOptions,
    formLocalidadOptions: formulario.formLocalidadOptions,
    formProyectoOptions: formulario.formProyectoOptions,
    formFormularioOptions: formulario.formFormularioOptions,
    handleFormularioPendienteChange: formulario.handleFormularioPendienteChange,
    formCatalogosLoading: formulario.formCatalogosLoading,
    formCatalogosError: formulario.formCatalogosError,
    formularioSaving: formulario.formularioSaving,
    handleSubmitFormulario: formulario.handleSubmitFormulario,
    digitsOnly,
  };
}
