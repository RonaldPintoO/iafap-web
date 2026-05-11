export const ANALYSIS_TABS = [
  { id: "produccion", label: "Producción", title: "Producción del período" },
  { id: "acciones", label: "Acciones", title: "Análisis de acciones" },
  { id: "autoalquiler", label: "Auto/Alquiler", title: "Rendimiento de Auto/Alquiler" },
];

export function getAnalysisTitle(tab) {
  return ANALYSIS_TABS.find((t) => t.id === tab)?.title || "";
}

export function formatNumber(value, decimals = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(value) {
  if (!value) return "—";

  const raw = String(value);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function estadoLabel(estado) {
  const labels = {
    RENDIDO: "Rendido",
    EN_CURSO: "En curso",
    FUTURO: "Futuro",
    PENDIENTE_RENDICION: "Pendiente de rendición",
    DESCONTAR: "Para descontar",
    Finalizado: "Finalizado",
    Pendiente: "Pendiente",
    Otro: "Otro",
  };
  return labels[estado] || estado || "—";
}

export function normalizeAnalisisPayload(payload) {
  if (!payload) return null;

  if (payload.ok === true && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }

  if (
    payload.data &&
    (payload.data.asesor_numero ||
      payload.data.resumen ||
      payload.data.detalle ||
      payload.data.rendidos ||
      payload.data.no_rendidos)
  ) {
    return payload.data;
  }

  return payload;
}

export function getAsesorDisplayName(data, asesorNombre) {
  const nombre = String(asesorNombre || data?.asesor_nombre || "").trim();
  if (nombre) return nombre;

  const numero = data?.asesor_numero;
  return numero ? `Asesor ${numero}` : "Asesor";
}
