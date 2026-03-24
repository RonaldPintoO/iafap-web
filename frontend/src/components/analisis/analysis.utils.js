export const ANALYSIS_TABS = [
  {
    id: "mas",
    label: "Más Acciones",
    title: "Datos con más de 2 acciones",
  },
  {
    id: "temprano",
    label: "Temprano",
    title: "Datos con acciones antes de las 13hs",
  },
  {
    id: "tarde",
    label: "De Tarde",
    title: "Datos con acciones después de las 13hs",
  },
];

export function getAnalysisTitle(tab) {
  return ANALYSIS_TABS.find((t) => t.id === tab)?.title || "";
}