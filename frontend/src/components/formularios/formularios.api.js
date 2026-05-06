import { apiFetch } from "../../config/api";

async function parseJson(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.detail || fallbackMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchFormularios({ periodoDias, estatus }) {
  const params = new URLSearchParams();

  if (periodoDias) params.set("periodo_dias", String(periodoDias));
  if (estatus) params.set("estatus", estatus);

  const response = await apiFetch(`/formularios?${params.toString()}`);
  const data = await parseJson(response, "No se pudieron obtener los formularios.");

  return {
    asesor: data.asesor || "",
    total: Number(data.total || 0),
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function fetchFormulariosPendientes() {
  const response = await apiFetch("/formularios/pendientes");
  const data = await parseJson(response, "No se pudieron obtener los formularios pendientes.");

  return {
    asesor: data.asesor || "",
    total: Number(data.total || 0),
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function fetchProyectosFormulario(fecha = "") {
  const params = new URLSearchParams();
  if (fecha) params.set("fecha", fecha);

  const query = params.toString();
  const response = await apiFetch(`/formularios/proyectos${query ? `?${query}` : ""}`);
  const data = await parseJson(response, "No se pudieron obtener los proyectos.");

  return {
    total: Number(data.total || 0),
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function verificarFormulario({ formulario, asesorForm }) {
  const response = await apiFetch("/formularios/verificar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formulario, asesorForm }),
  });

  return parseJson(response, "No se pudo verificar el formulario.");
}

export async function fetchFormularioDetalle(fornum) {
  const response = await apiFetch(`/formularios/${encodeURIComponent(fornum)}`);
  return parseJson(response, "No se pudo cargar el formulario.");
}

export async function enviarFormulario(fornum, payload) {
  const response = await apiFetch(`/formularios/${encodeURIComponent(fornum)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson(response, "No se pudo enviar el formulario.");
}
