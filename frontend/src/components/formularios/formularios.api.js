import { apiFetch } from "../../config/api";

export async function fetchFormularios({ periodoDias, estatus }) {
  const params = new URLSearchParams();

  if (periodoDias) params.set("periodo_dias", String(periodoDias));
  if (estatus) params.set("estatus", estatus);

  const response = await apiFetch(`/formularios?${params.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.detail || "No se pudieron obtener los formularios.");
    error.status = response.status;
    throw error;
  }

  return {
    asesor: data.asesor || "",
    total: Number(data.total || 0),
    items: Array.isArray(data.items) ? data.items : [],
  };
}