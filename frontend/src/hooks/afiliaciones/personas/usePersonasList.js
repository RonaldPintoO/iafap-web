import { useEffect, useState } from "react";
import { PERSONAS_PAGE_SIZE } from "../../../components/afiliaciones/shared/afiliaciones.utils";
import { apiFetch } from "../../../config/api";
import { getAsesorConfigurado } from "../shared/afiliacionesController.helpers";

export default function usePersonasList({
  tab,
  topLocValue,
  personasAppliedValues,
  personasReloadToken,
}) {
  const [personasItems, setPersonasItems] = useState([]);
  const [personasLoading, setPersonasLoading] = useState(false);
  const [personasRefreshing, setPersonasRefreshing] = useState(false);
  const [personasError, setPersonasError] = useState("");
  const [personasPage, setPersonasPage] = useState(1);
  const [personasTotal, setPersonasTotal] = useState(0);
  const [personasTotalPages, setPersonasTotalPages] = useState(0);

  useEffect(() => {
    if (tab !== "personas") return;

    let cancelled = false;

    const fetchPersonas = async () => {
      try {
        const isFirstLoad = personasPage === 1 && personasItems.length === 0;

        if (isFirstLoad) setPersonasLoading(true);
        else setPersonasRefreshing(true);

        setPersonasError("");

        const asesorCodigo = getAsesorConfigurado();

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
        params.set("page", String(personasPage));
        params.set("page_size", String(PERSONAS_PAGE_SIZE));
        params.set("asesor", asesorCodigo);

        if (topLocValue && topLocValue !== "Todos") {
          params.set("localidad", topLocValue);
        }

        if (personasAppliedValues.texto.trim() !== "") {
          params.set("texto", personasAppliedValues.texto.trim());
        }

        if (personasAppliedValues.tipo !== "Todos") {
          params.set("tipo", personasAppliedValues.tipo);
        }

        if (personasAppliedValues.edadDesde.trim() !== "") {
          params.set("edad_desde", personasAppliedValues.edadDesde.trim());
        }

        if (personasAppliedValues.edadHasta.trim() !== "") {
          params.set("edad_hasta", personasAppliedValues.edadHasta.trim());
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

        const url = `/personas?${params.toString()}`;
        const res = await apiFetch(url);

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            errorData?.detail || "No se pudo cargar la lista de personas",
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
  }, [
    tab,
    personasPage,
    personasReloadToken,
    topLocValue,
    personasAppliedValues,
    personasItems.length,
  ]);

  useEffect(() => {
    setPersonasPage(1);
  }, [topLocValue, personasAppliedValues]);

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

  return {
    personasItems,
    personasLoading,
    personasRefreshing,
    personasError,
    personasPage,
    setPersonasPage,
    personasTotal,
    personasTotalPages,
    handlePrevPersonasPage,
    handleNextPersonasPage,
    handleGoToPersonasPage,
  };
}
