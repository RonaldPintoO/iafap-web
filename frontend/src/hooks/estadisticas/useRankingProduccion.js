import { useCallback, useEffect, useState } from "react";

import { fetchRankingProduccion } from "../../components/estadisticas/estadisticas.api";

export default function useRankingProduccion({ fechaInicio, fechaFin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(fechaInicio && fechaFin));
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!fechaInicio || !fechaFin) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchRankingProduccion({ fechaInicio, fechaFin });
      setData(result || null);
    } catch (err) {
      console.error("[Estadisticas Ranking] error:", err);
      setError(err.message || "No se pudo cargar el ranking.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
