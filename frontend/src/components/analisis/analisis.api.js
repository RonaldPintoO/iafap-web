import { apiFetch } from "../../config/api";

function unwrapApiResponse(payload) {
  if (!payload) return null;
  if (payload.ok === true && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  if (payload.data?.asesor_numero || payload.data?.resumen) return payload.data;
  if (payload.asesor_numero || payload.resumen || payload.detalle || payload.rendidos || payload.no_rendidos) return payload;
  return payload;
}

async function fetchAnalisis(path, fallbackMessage) {
  const response = await apiFetch(path);

  if (response && typeof response.json === "function") {
    const contentType = response.headers?.get?.("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text().catch(() => "");
      const error = new Error(`${fallbackMessage} Respuesta no JSON del servidor.`);
      error.status = response.status;
      error.data = text;
      throw error;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.detail || payload.message || fallbackMessage);
      error.status = response.status;
      error.data = payload;
      throw error;
    }
    return unwrapApiResponse(payload);
  }

  if (response && response.ok === false) {
    const error = new Error(response.detail || response.message || fallbackMessage);
    error.data = response;
    throw error;
  }

  return unwrapApiResponse(response);
}

function buildPeriodoParams({ fechaInicio, fechaFin }) {
  const params = new URLSearchParams();
  params.set("fecha_inicio", fechaInicio);
  params.set("fecha_fin", fechaFin);
  return params.toString();
}

export function fetchProduccionAnalisis({ fechaInicio, fechaFin }) {
  return fetchAnalisis(
    `/analisis/produccion?${buildPeriodoParams({ fechaInicio, fechaFin })}`,
    "No se pudo cargar la producción.",
  );
}

export function fetchAccionesAnalisis({ fechaInicio, fechaFin }) {
  return fetchAnalisis(
    `/analisis/acciones?${buildPeriodoParams({ fechaInicio, fechaFin })}`,
    "No se pudo cargar el análisis de acciones.",
  );
}

export function fetchAutoAlquilerAnalisis({ fechaInicio, fechaFin }) {
  return fetchAnalisis(
    `/analisis/autoalquiler?${buildPeriodoParams({ fechaInicio, fechaFin })}`,
    "No se pudo cargar el análisis de auto/alquiler.",
  );
}
