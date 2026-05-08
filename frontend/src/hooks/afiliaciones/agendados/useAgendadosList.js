import { useEffect, useMemo, useState } from "react";
import {
  AGENDADOS_PAGE_SIZE,
  buildDefaultAgendados,
} from "../../../components/afiliaciones/shared/afiliaciones.utils";
import { getLocalidadOptions } from "../../../components/formularios/forms.utils";
import { fetchLocalidadesByDepartamento } from "../../../components/formularios/formularios.catalogos.api";
import { apiFetch } from "../../../config/api";
import { getAsesorActivo } from "../shared/afiliacionesController.helpers";

export default function useAgendadosList({ tab, formDepartamentos }) {
  const [agendadosValues, setAgendadosValues] = useState(() =>
    buildDefaultAgendados(),
  );
  const [agendadosItems, setAgendadosItems] = useState([]);
  const [agendadosLoading, setAgendadosLoading] = useState(false);
  const [agendadosRefreshing, setAgendadosRefreshing] = useState(false);
  const [agendadosError, setAgendadosError] = useState("");
  const [agendadosReloadToken, setAgendadosReloadToken] = useState(0);
  const [agendadosPage, setAgendadosPage] = useState(1);
  const [agendadosLocalidades, setAgendadosLocalidades] = useState([]);
  const [agendadosLocalidadesLoading, setAgendadosLocalidadesLoading] =
    useState(false);

  const agendadosDepartamentoOptions = useMemo(
    () => ["Todos", ...formDepartamentos],
    [formDepartamentos],
  );

  const agendadosLocalidadOptions = useMemo(
    () => ["Todos", ...getLocalidadOptions(agendadosLocalidades).map((opt) => opt.value)],
    [agendadosLocalidades],
  );

  useEffect(() => {
    let cancelled = false;
    const departamento = agendadosValues.dptoAg;

    if (!departamento || departamento === "Todos") {
      setAgendadosLocalidades([]);
      if (agendadosValues.loc !== "Todos") {
        setAgendadosValues((prev) => ({ ...prev, loc: "Todos" }));
      }
      return () => {
        cancelled = true;
      };
    }

    async function loadLocalidadesAgendados() {
      try {
        setAgendadosLocalidadesLoading(true);
        const items = await fetchLocalidadesByDepartamento(departamento);
        if (cancelled) return;

        setAgendadosLocalidades(items);

        setAgendadosValues((prev) => {
          const actualExiste = items.some(
            (loc) => (loc?.localidad || loc) === prev.loc,
          );

          return {
            ...prev,
            loc: actualExiste ? prev.loc : "Todos",
          };
        });
      } catch (err) {
        if (!cancelled) {
          console.warn("[Afiliaciones] No se pudieron cargar localidades de agendados:", err);
          setAgendadosLocalidades([]);
          setAgendadosValues((prev) => ({ ...prev, loc: "Todos" }));
        }
      } finally {
        if (!cancelled) setAgendadosLocalidadesLoading(false);
      }
    }

    loadLocalidadesAgendados();

    return () => {
      cancelled = true;
    };
  }, [agendadosValues.dptoAg, agendadosValues.loc]);

  useEffect(() => {
    if (tab !== "agendados") return;

    let cancelled = false;

    const fetchAgendados = async () => {
      try {
        const isFirstLoad = agendadosItems.length === 0;
        if (isFirstLoad) setAgendadosLoading(true);
        else setAgendadosRefreshing(true);
        setAgendadosError("");

        const asesorCodigo = getAsesorActivo();

        if (!asesorCodigo) {
          if (!cancelled) {
            setAgendadosItems([]);
            setAgendadosError("No hay un asesor seleccionado en Configuración.");
          }
          return;
        }

        const params = new URLSearchParams();
        params.set("asesor", asesorCodigo);

        if (agendadosValues.estado && agendadosValues.estado !== "Pendientes") {
          params.set("estado", agendadosValues.estado);
        }

        if (agendadosValues.fecha && agendadosValues.fecha !== "Todos") {
          params.set("fecha", agendadosValues.fecha);
        }
        if (agendadosValues.dptoAg && agendadosValues.dptoAg !== "Todos") {
          params.set("departamento", agendadosValues.dptoAg);
        }
        if (agendadosValues.loc && agendadosValues.loc !== "Todos") {
          params.set("localidad", agendadosValues.loc);
        }

        const res = await apiFetch(`/personas/agendados?${params.toString()}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          throw new Error(data?.detail || "No se pudieron cargar los agendados");
        }

        if (!cancelled) {
          setAgendadosItems(Array.isArray(data.items) ? data.items : []);
          setAgendadosError("");
        }
      } catch (err) {
        if (!cancelled) {
          setAgendadosItems([]);
          setAgendadosError(err.message || "Error cargando agendados");
        }
      } finally {
        if (!cancelled) {
          setAgendadosLoading(false);
          setAgendadosRefreshing(false);
        }
      }
    };

    fetchAgendados();

    return () => {
      cancelled = true;
    };
  }, [tab, agendadosValues, agendadosReloadToken, agendadosItems.length]);


  const agendadosTotal = agendadosItems.length;
  const agendadosTotalPages = useMemo(() => {
    if (!agendadosTotal) return 0;
    return Math.ceil(agendadosTotal / AGENDADOS_PAGE_SIZE);
  }, [agendadosTotal]);

  const agendadosPageItems = useMemo(() => {
    const safePage = Math.min(Math.max(agendadosPage, 1), agendadosTotalPages || 1);
    const start = (safePage - 1) * AGENDADOS_PAGE_SIZE;
    return agendadosItems.slice(start, start + AGENDADOS_PAGE_SIZE);
  }, [agendadosItems, agendadosPage, agendadosTotalPages]);

  useEffect(() => {
    setAgendadosPage(1);
  }, [agendadosValues, agendadosReloadToken]);

  useEffect(() => {
    if (agendadosTotalPages > 0 && agendadosPage > agendadosTotalPages) {
      setAgendadosPage(agendadosTotalPages);
    }
  }, [agendadosPage, agendadosTotalPages]);

  const handlePrevAgendadosPage = () => {
    setAgendadosPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextAgendadosPage = () => {
    setAgendadosPage((prev) => {
      if (!agendadosTotalPages) return prev;
      return Math.min(agendadosTotalPages, prev + 1);
    });
  };

  const handleGoToAgendadosPage = (nextPage) => {
    const safePage = Number(nextPage);

    if (!Number.isFinite(safePage) || safePage < 1) return;
    if (agendadosTotalPages && safePage > agendadosTotalPages) return;

    setAgendadosPage(safePage);
  };

  const handleResetAgendados = ({ closeFilters, closeDropdowns } = {}) => {
    closeDropdowns?.();
    setAgendadosValues(buildDefaultAgendados());
    closeFilters?.();
    setAgendadosReloadToken((prev) => prev + 1);
  };

  return {
    agendadosValues,
    setAgendadosValues,
    agendadosItems: agendadosPageItems,
    agendadosTotal,
    agendadosPage,
    agendadosTotalPages,
    agendadosLoading,
    agendadosRefreshing,
    agendadosError,
    agendadosReloadToken,
    setAgendadosReloadToken,
    agendadosDepartamentoOptions,
    agendadosLocalidadOptions,
    agendadosLocalidadesLoading,
    handlePrevAgendadosPage,
    handleNextAgendadosPage,
    handleGoToAgendadosPage,
    handleResetAgendados,
  };
}
