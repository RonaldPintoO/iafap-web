import { apiFetch } from "../../config/api";
import { normalizeEstadisticasPayload } from "./estadisticas.utils";

async function readPayload(response) {
  const contentType = response.headers?.get?.("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text
        ? "La respuesta del servidor no es JSON. Verificá el proxy /estadisticas en Vite."
        : "Respuesta inválida del servidor.",
    );
  }

  return response.json();
}

export async function fetchRankingProduccion({ fechaInicio, fechaFin }) {
  const params = new URLSearchParams();
  params.set("fecha_inicio", fechaInicio);
  params.set("fecha_fin", fechaFin);

  const response = await apiFetch(`/estadisticas/ranking-produccion?${params.toString()}`);
  const payload = await readPayload(response);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload.detail || payload.message || "No se pudo cargar el ranking de producción.");
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return normalizeEstadisticasPayload(payload);
}
