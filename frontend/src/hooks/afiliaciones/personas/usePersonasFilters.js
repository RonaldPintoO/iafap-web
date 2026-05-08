import { useEffect, useState } from "react";
import { buildDefaultPersonas } from "../../../components/afiliaciones/shared/afiliaciones.utils";
import { apiFetch } from "../../../config/api";
import { getAsesorConfigurado } from "../shared/afiliacionesController.helpers";

export default function usePersonasFilters({
  tab,
  showFilters,
  topLocValue,
  personasReloadToken,
  setOpenDropdownId,
  setShowFilters,
  setPersonasPage,
  onCloseDetalle,
}) {
  const [personasDraftValues, setPersonasDraftValues] = useState(() =>
    buildDefaultPersonas(),
  );
  const [personasAppliedValues, setPersonasAppliedValues] = useState(() =>
    buildDefaultPersonas(),
  );
  const [personasFilterCatalogs, setPersonasFilterCatalogs] = useState({
    tipos: ["Todos"],
    acciones: ["Todos"],
  });
  const [personasFiltrosError, setPersonasFiltrosError] = useState("");

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
  }, [showFilters, tab, personasAppliedValues, setOpenDropdownId]);

  useEffect(() => {
    if (tab !== "personas") return;

    let cancelled = false;

    const loadPersonasFilterCatalogs = async () => {
      try {
        const asesorCodigo = getAsesorConfigurado();

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

        const res = await apiFetch(`/personas/filtros?${params.toString()}`);

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
      } catch {
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

  const handleAcceptPersonasFilters = () => {
    const edadDesde = personasDraftValues.edadDesde.trim();
    const edadHasta = personasDraftValues.edadHasta.trim();

    if (
      edadDesde !== "" &&
      edadHasta !== "" &&
      Number(edadDesde) > Number(edadHasta)
    ) {
      setPersonasFiltrosError(
        "La edad desde no puede ser mayor que la edad hasta",
      );
      return;
    }

    setPersonasFiltrosError("");
    setPersonasAppliedValues({ ...personasDraftValues });
    setPersonasPage(1);
    setShowFilters(false);
    setOpenDropdownId(null);
    onCloseDetalle();
  };

  const resetPersonasFilters = () => {
    const defaults = buildDefaultPersonas();
    setPersonasDraftValues(defaults);
    setPersonasAppliedValues(defaults);
    setPersonasFiltrosError("");
  };

  return {
    personasDraftValues,
    setPersonasDraftValues,
    personasAppliedValues,
    personasFilterCatalogs,
    personasFiltrosError,
    setPersonasFiltrosError,
    handleAcceptPersonasFilters,
    resetPersonasFilters,
  };
}
