import { useEffect, useState } from "react";
import { apiFetch } from "../../../config/api";
import { getAsesorConfigurado } from "../shared/afiliacionesController.helpers";

export default function useTopLocalidades({ tab, personasReloadToken }) {
  const [topLocalidades, setTopLocalidades] = useState(["Todos"]);
  const [topLocValue, setTopLocValue] = useState("Todos");

  useEffect(() => {
    if (tab !== "personas" && tab !== "mapa") return;

    let cancelled = false;

    const loadLocalidades = async () => {
      try {
        const asesorCodigo = getAsesorConfigurado();

        if (!asesorCodigo) {
          if (!cancelled) {
            setTopLocalidades(["Todos"]);
            setTopLocValue("Todos");
          }
          return;
        }

        const res = await apiFetch(
          `/personas/localidades?asesor=${encodeURIComponent(asesorCodigo)}`,
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
        setTopLocValue((prev) => (items.includes(prev) ? prev : "Todos"));
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

  return {
    topLocalidades,
    topLocValue,
    setTopLocValue,
  };
}
