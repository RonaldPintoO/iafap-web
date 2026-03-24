export const CONFIG_STORAGE_KEY = "webapp_configuracion";

export function saveConfiguracion(data) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(data));
}

export function getConfiguracionGuardada() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}