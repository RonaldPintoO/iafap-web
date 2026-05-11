export const ESTADISTICAS_TABS = [
  { id: "total_produccion", label: "Total", metric: "total_produccion" },
  { id: "total_20130", label: "20.130", metric: "total_20130" },
  { id: "total_16713", label: "16.713", metric: "total_16713" },
  { id: "total_voluntarias", label: "Voluntarias", metric: "total_voluntarias" },
  { id: "total_traspasos", label: "Traspasos", metric: "total_traspasos" },
  { id: "total_firma_art8", label: "Firma Art. 8", metric: "total_firma_art8" },
];

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
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function normalizeEstadisticasPayload(payload) {
  if (!payload) return null;

  if (payload.ok === true && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }

  if (payload.data && (payload.data.resumen || payload.data.ranking)) {
    return payload.data;
  }

  return payload;
}

export function getMetricTotal(resumen, metric) {
  return Number(resumen?.[metric] || 0);
}

export function getMetricLabel(metric) {
  return ESTADISTICAS_TABS.find((item) => item.metric === metric)?.label || "Total";
}
