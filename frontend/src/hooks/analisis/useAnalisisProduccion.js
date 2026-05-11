import { useCallback, useEffect, useState } from "react";
import { fetchProduccionAnalisis } from "../../components/analisis/analisis.api";

export default function useAnalisisProduccion({ enabled, fechaInicio, fechaFin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && fechaInicio && fechaFin));
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!enabled || !fechaInicio || !fechaFin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchProduccionAnalisis({ fechaInicio, fechaFin });
      setData(result || null);
    } catch (err) {
      console.error("[Analisis Produccion] error:", err);
      setError(err.message || "No se pudo cargar la producción.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, fechaInicio, fechaFin]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
