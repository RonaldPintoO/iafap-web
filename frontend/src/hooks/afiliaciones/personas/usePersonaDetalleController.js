import { useEffect, useState } from "react";
import { apiFetch } from "../../../config/api";
import { scrollAppToTop } from "../shared/afiliacionesController.helpers";

export default function usePersonaDetalleController({
  onAfterSaveAccion,
} = {}) {
  const [vinculosPersona, setVinculosPersona] = useState([]);
  const [vinculosPersonaLoading, setVinculosPersonaLoading] = useState(false);
  const [vinculosPersonaError, setVinculosPersonaError] = useState("");

  const [vinculosInfoModal, setVinculosInfoModal] = useState([]);
  const [vinculosInfoModalLoading, setVinculosInfoModalLoading] =
    useState(false);
  const [vinculosInfoModalError, setVinculosInfoModalError] = useState("");

  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
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

  useEffect(() => {
    if (personaSeleccionada?.cedula) {
      scrollAppToTop();
    }
  }, [personaSeleccionada?.cedula]);

  const handleOpenPersonaDetalle = (item) => {
    setPersonaSeleccionada(item);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
    setAccionesPersonaLoading(false);
    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
    setVinculosPersona([]);
    setVinculosPersonaError("");
    setVinculosPersonaLoading(false);
  };

  const handleClosePersonaDetalle = () => {
    setPersonaSeleccionada(null);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
    setAccionesPersonaLoading(false);
    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
  };

  const handleOpenVinculoDelVinculo = async (item) => {
    if (!item?.cedula) return;

    try {
      setVinculosInfoModalLoading(true);
      setVinculosInfoModalError("");
      setVinculosInfoModal([]);
      const res = await apiFetch(
        `/personas/${encodeURIComponent(item.cedula)}/vinculos`,
      );

      if (!res.ok) {
        throw new Error("No se pudieron cargar los vínculos del vínculo");
      }

      const data = await res.json();

      setVinculosInfoModal(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setVinculosInfoModal([]);
      setVinculosInfoModalError(
        err.message || "Error cargando vínculos del vínculo",
      );
    } finally {
      setVinculosInfoModalLoading(false);
    }
  };

  const cargarAccionesCatalogos = async () => {
    setAccionesCatalogosLoading(true);
    setAccionesCatalogosError("");

    try {
      const res = await apiFetch("/personas/acciones/catalogos");
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.detail || "No se pudieron cargar las opciones");
      }

      setAccionesCatalogos({
        tipos: Array.isArray(data.tipos) ? data.tipos : [],
        resultados: Array.isArray(data.resultados) ? data.resultados : [],
      });
    } catch (err) {
      setAccionesCatalogos({ tipos: [], resultados: [] });
      setAccionesCatalogosError(
        err.message || "No se pudieron cargar las opciones",
      );
    } finally {
      setAccionesCatalogosLoading(false);
    }
  };

  const ensureAccionesCatalogos = async () => {
    if (!accionesCatalogos.tipos.length || !accionesCatalogos.resultados.length) {
      await cargarAccionesCatalogos();
    }
  };

  const handleOpenNuevaAccion = async () => {
    setAccionEditando(null);
    setAccionSaveError("");
    setShowAccionModal(true);
    await ensureAccionesCatalogos();
  };

  const handleOpenEditarAccion = async (accion) => {
    if (!accion?.accnum) return;

    setAccionEditando(accion);
    setAccionSaveError("");
    setShowAccionModal(true);
    await ensureAccionesCatalogos();
  };

  const handleCloseNuevaAccion = () => {
    if (accionSaving) return;
    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
  };

  const handleSaveNuevaAccion = async (payload) => {
    const cedula = String(personaSeleccionada?.cedula || "").trim();
    if (!cedula) return;

    const editandoAccnum = accionEditando?.accnum;

    setAccionSaving(true);
    setAccionSaveError("");

    try {
      const res = await apiFetch(
        editandoAccnum
          ? `/personas/acciones/${encodeURIComponent(editandoAccnum)}`
          : `/personas/${encodeURIComponent(cedula)}/acciones`,
        {
          method: editandoAccnum ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.detail ||
            (editandoAccnum
              ? "No se pudo actualizar la acción"
              : "No se pudo guardar la acción"),
        );
      }

      setAccionesPersona(Array.isArray(data.items) ? data.items : []);
      setShowAccionModal(false);
      setAccionEditando(null);
      onAfterSaveAccion?.();
    } catch (err) {
      setAccionSaveError(
        err.message ||
          (editandoAccnum
            ? "No se pudo actualizar la acción"
            : "No se pudo guardar la acción"),
      );
    } finally {
      setAccionSaving(false);
    }
  };

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

        const res = await apiFetch(
          `/personas/${encodeURIComponent(cedula)}/acciones`,
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
    const cedula = personaSeleccionada?.cedula;

    if (!cedula) return;
    if (detalleTab !== "vinculos") return;

    let cancelled = false;

    const fetchVinculos = async () => {
      try {
        setVinculosPersonaLoading(true);
        setVinculosPersonaError("");

        const res = await apiFetch(
          `/personas/${encodeURIComponent(cedula)}/vinculos`,
        );

        if (!res.ok) {
          throw new Error("No se pudieron cargar los vínculos");
        }

        const data = await res.json();

        if (!cancelled) {
          setVinculosPersona(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setVinculosPersona([]);
          setVinculosPersonaError(err.message || "Error cargando vínculos");
        }
      } finally {
        if (!cancelled) {
          setVinculosPersonaLoading(false);
        }
      }
    };

    fetchVinculos();

    return () => {
      cancelled = true;
    };
  }, [personaSeleccionada?.cedula, detalleTab]);

  return {
    personaSeleccionada,
    detalleTab,
    setDetalleTab,
    handleOpenPersonaDetalle,
    handleClosePersonaDetalle,
    accionesPersona,
    accionesPersonaLoading,
    accionesPersonaError,
    vinculosPersona,
    vinculosPersonaLoading,
    vinculosPersonaError,
    handleOpenVinculoDelVinculo,
    vinculosInfoModal,
    vinculosInfoModalLoading,
    vinculosInfoModalError,
    showAccionModal,
    accionesCatalogos,
    accionesCatalogosLoading,
    accionesCatalogosError,
    accionSaving,
    accionSaveError,
    accionEditando,
    handleOpenNuevaAccion,
    handleOpenEditarAccion,
    handleCloseNuevaAccion,
    handleSaveNuevaAccion,
    cargarAccionesCatalogos,
    ensureAccionesCatalogos,
    setAccionEditando,
    setAccionSaveError,
    setShowAccionModal,
  };
}
