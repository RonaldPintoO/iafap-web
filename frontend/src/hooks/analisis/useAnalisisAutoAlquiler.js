import { useCallback, useEffect, useState } from "react";
import { fetchAutoAlquilerAnalisis } from "../../components/analisis/analisis.api";

export default function useAnalisisAutoAlquiler({ enabled, fechaInicio, fechaFin }) {
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
      const result = await fetchAutoAlquilerAnalisis({ fechaInicio, fechaFin });
      setData(result || null);
    } catch (err) {
      console.error("[Analisis AutoAlquiler] error:", err);
      setError(err.message || "No se pudo cargar el análisis de auto/alquiler.");
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
