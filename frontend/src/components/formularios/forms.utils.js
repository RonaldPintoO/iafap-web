export const PERIODOS = ["5 días", "10 días", "15 días", "20 días", "25 días", "30 días"];

export const ESTATUS = ["Todos", "En Proceso", "Activos", "Inactivos"];

export const LEYENDA = [
  { color: "#000000", label: "Anulado" },
  { color: "#d32f2f", label: "Rechazado" },
  { color: "#2f3fa3", label: "Sin Actividad" },
  { color: "#cfead1", label: "Recibido sin errores" },
  { color: "#43a047", label: "Ingresado a BPS" },
  { color: "#ffa000", label: "Faltante" },
  { color: "#ffffff", label: "Vacío", border: "#000000" },
];

export const PROYECTOS_DEMO = [
  "1332-PRO-CBD 1303",
  "1512-PRO-SBZ 1373",
  "1618-PRO-AAZ 6458",
  "2005-PRO-SCF 1356",
  "2030-PRO-AAR 4797",
  "3005-PRO-OAE 3103",
  "3007-PRO-SCG 4199",
  "3064-PRO-SDD 4937",
  "3065-PRO-SBI 6680",
  "3075-PRO-SDA 5511",
  "3093-PRO-SDD 4411",
  "3117-PRO-SCL 8868",
  "3152-PRO-ABK 2846",
];

export const DISTANCIAS = ["-100 Km", "+100 Km"];

export const TIPOS_DOC = [
  { value: "CI", label: "DO" },
  { value: "FS", label: "FS" },
  { value: "PA", label: "PA" },
];

export const CODIGO_CI = ["Electrónico", "Impreso"];

export const ADD_TABS = [
  { id: "datos", label: "Datos" },
  { id: "formulario", label: "Formulario" },
  { id: "ci_frente", label: "Cédula Frente" },
  { id: "ci_dorso", label: "Cédula Dorso" },
  { id: "f35_frente", label: "Form. >35 Frente" },
  { id: "f35_dorso", label: "Form. >35 Dorso" },
];

export function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeText(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function cleanNumbers(v = "") {
  return String(v).replace(/\D/g, "");
}

export function cleanAlphaNum(v = "") {
  return String(v).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function formatMoney(v = "") {
  const nums = cleanNumbers(v);
  if (!nums) return "";
  return Number(nums).toLocaleString("es-UY");
}

export function validarCedulaUruguaya(ci = "") {
  const clean = cleanNumbers(ci);
  if (clean.length < 7 || clean.length > 8) return false;

  const padded = clean.padStart(8, "0");
  const factors = [2, 9, 8, 7, 6, 3, 4];

  let sum = 0;
  for (let i = 0; i < 7; i += 1) {
    sum += Number(padded[i]) * factors[i];
  }

  const expected = (10 - (sum % 10)) % 10;
  return expected === Number(padded[7]);
}

export function formatDateDDMMYY(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
}

export function addDays(baseDate, diffDays) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diffDays);
  return d;
}

export function parseDDMMYYToDate(str) {
  if (!str || !/^\d{2}\/\d{2}\/\d{2}$/.test(str)) return null;
  const [dd, mm, yy] = str.split("/").map(Number);
  const fullYear = 2000 + yy;
  const date = new Date(fullYear, mm - 1, dd);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getPeriodoDias(periodo) {
  const n = parseInt(periodo, 10);
  return Number.isFinite(n) ? n : 30;
}

export function buildDefaultDatos({
  paises = [],
  departamentos = [],
  localidades = [],
} = {}) {
  const uruguay =
    paises.find((p) => normalizeText(p?.nombre || p) === "URUGUAY") || null;

  return {
    proyecto: PROYECTOS_DEMO[0],
    distancia: DISTANCIAS[0],
    asesor: "",
    asesorForm: "",
    fechaForm: "",

    formulario: "",
    tipoDocumento: "CI",
    cedula: "",

    codigoCI: "",
    serieCodCI: "",
    nroCodCI: "",

    fechaNac: "",
    telefono: "",
    celular: "",

    empresa: "",
    sueldo: "",

    mail: "",
    calle: "",
    nro: "",
    apto: "",
    bis: "",

    pais: uruguay?.nombre || "URUGUAY",
    paisId: uruguay?.idpais ?? 1,
    departamento: "",
    localidad: "",
  };
}

export function getNombrePaisOptions(paises = []) {
  return paises.map((p) => ({
    value: p.nombre,
    label: p.nombre,
    idpais: p.idpais,
  }));
}

export function getDepartamentoOptions(departamentos = []) {
  return departamentos.map((dep) => ({
    value: dep,
    label: dep,
  }));
}

export function getLocalidadOptions(localidades = []) {
  return localidades.map((loc) => ({
    value: loc.localidad || loc,
    label: loc.localidad || loc,
    idlocalidad: loc.idlocalidad ?? null,
  }));
}

export function formatDateTimeParts(value) {
  if (!value) {
    return {
      fecha: "Pendiente",
      hora: "",
    };
  }

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) {
    return {
      fecha: "",
      hora: "",
    };
  }

  const fecha = dt.toLocaleDateString("es-UY");
  const hora = dt.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { fecha, hora };
}

export function resolveFormularioVisual(row) {
  const accion = normalizeText(row?.foraccion);
  const detalleOriginal = cleanText(row?.fordetalle);
  const detalle = normalizeText(detalleOriginal);

  const isPendiente =
    row?.forcuando == null &&
    !cleanText(row?.foraccion) &&
    !cleanText(row?.fordetalle);

  if (isPendiente) {
    return {
      estadoTxt: "Pendiente",
      color: "#ffffff",
      estatus: "En Proceso",
      borderColor: "#000000",
    };
  }

  if (detalle.includes("SIN ACTIVIDAD")) {
    return {
      estadoTxt: detalleOriginal || "Sin actividad",
      color: "#2f3fa3",
      estatus: "Inactivos",
    };
  }

  if (accion === "OK") {
    return {
      estadoTxt: "BPS",
      color: "#43a047",
      estatus: "Activos",
    };
  }

  if (accion === "REC" && detalle.includes("ANULAR")) {
    return {
      estadoTxt: "Anulado",
      color: "#000000",
      estatus: "Inactivos",
    };
  }

  if (accion === "REC") {
    return {
      estadoTxt: detalleOriginal ? `REC ${detalleOriginal}` : "Rechazado",
      color: "#d32f2f",
      estatus: "Inactivos",
    };
  }

  if (detalleOriginal) {
    return {
      estadoTxt: detalleOriginal,
      color: "#ffa000",
      estatus: "En Proceso",
    };
  }

  if (accion === "ENV") {
    return {
      estadoTxt: "Recibido sin errores",
      color: "#cfead1",
      estatus: "En Proceso",
    };
  }

  return {
    estadoTxt: accion || "En proceso",
    color: "#ffa000",
    estatus: "En Proceso",
  };
}

export function mapFormularioItem(row) {
  const { fecha, hora } = formatDateTimeParts(row?.forcuando);
  const visual = resolveFormularioVisual(row);

  return {
    id: row?.fornum ? String(row.fornum) : "",
    ci: "—",
    fo: "FO",
    proy: "—",
    km: "",
    fecha,
    hora,
    estadoTxt: visual.estadoTxt,
    color: visual.color,
    estatus: visual.estatus,
    borderColor: visual.borderColor || "",
    asesor: row?.forquien_env ? String(row.forquien_env) : "",
    raw: row,
  };
}