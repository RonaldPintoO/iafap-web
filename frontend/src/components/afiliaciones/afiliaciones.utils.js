export const PERSONAS_FILTER_OPTIONS = {
  edadParidad: ["Todas", "Par", "Impar"],
  nacionalidad: ["Todos", "Nacional", "Extranjero"],
  estado: [
    "Todos",
    "Pendiente con Gestión",
    "Pendiente sin Gestión",
    "Finalizado",
  ],
  fechaAccion: [
    "Todos",
    "0-7",
    "8-15",
    "16-30",
    "31-180",
    "181-360",
    "+360",
  ],
  ley: ["Todos", "No Consultado", "Ley 16.713", "Ley 20.130"],
};

export const AGENDADOS_FILTERS = [
  { id: "fecha", label: "Fecha", options: ["Todos", "Hoy", "Mañana", "Esta Semana", "Semana Próxima"], defaultValue: "Todos" },
  {
    id: "dptoAg",
    label: "Dpto.",
    options: ["Todos", "CANELONES", "CERRO LARGO", "LAVALLEJA", "MALDONADO", "MONTEVIDEO", "PAYSANDU", "SALTO", "SAN JOSE", "SORIANO", "TACUAREMBO"],
    defaultValue: "Todos",
  },
  { id: "loc", label: "Loc.", options: ["Todos", "(pendiente: depende del Dpto.)"], defaultValue: "Todos" },
];

export const PERSONAS_PAGE_SIZE = 100;

export function digitsOnly(v) {
  return v.replace(/\D+/g, "");
}

export function buildDefaultPersonas() {
  return {
    texto: "",
    tipo: "Todos",
    edadDesde: "",
    edadHasta: "",
    edadParidad: "Todas",
    nacionalidad: "Todos",
    estado: "Todos",
    fechaAccion: "Todos",
    accion: "Todos",
    ley: "Todos",
  };
}

export function buildDefaultAgendados() {
  const init = {};
  for (const f of AGENDADOS_FILTERS) init[f.id] = f.defaultValue;
  return init;
}