import { apiFetch } from "../../config/api";

async function parseJson(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.detail || fallbackMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function fetchFormulariosCatalogos() {
  const response = await apiFetch("/formularios/catalogos");
  const data = await parseJson(response, "No se pudieron obtener los catálogos.");

  return {
    paises: Array.isArray(data.paises) ? data.paises : [],
    departamentos: Array.isArray(data.departamentos) ? data.departamentos : [],
  };
}

export async function fetchLocalidadesByDepartamento(departamento) {
  if (!departamento) return [];

  const params = new URLSearchParams({ departamento });
  const response = await apiFetch(`/formularios/catalogos/localidades?${params.toString()}`);
  const data = await parseJson(response, "No se pudieron obtener las localidades.");

  return Array.isArray(data.items) ? data.items : [];
}