export const PERIODOS = ["5 días", "10 días", "15 días", "20 días", "25 días", "30 días"];

export const ESTATUS = ["Todos", "En Proceso", "Activos", "Inactivos"];

// Leyenda (modal info)
export const LEYENDA = [
  { color: "#000000", label: "Anulado" },
  { color: "#d32f2f", label: "Rechazado" },
  { color: "#2f3fa3", label: "Sin Actividad" },
  { color: "#cfead1", label: "Recibido sin errores" },
  { color: "#43a047", label: "Ingresado a BPS" },
  { color: "#ffa000", label: "Faltante" },
  { color: "#ffffff", label: "Vacío", border: "#000000" },
];

// Opciones demo para Datos
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

// Nuevos catálogos para frontend
export const PAISES = [
  "URUGUAY",
  "ITALIA",
  "ESPAÑA",
  "ALEMANIA",
  "ISLAS SALOMON",
  "GRANADA",
  "ARGENTINA",
  "ESTADOS UNIDOS DE NORTE AMERICA",
];

export const DEPARTAMENTOS = [
  "ARTIGAS",
  "CANELONES",
  "CERRO LARGO",
  "COLONIA",
  "DURAZNO",
  "FLORIDA",
  "FLORES",
  "LAVALLEJA",
  "MALDONADO",
  "MONTEVIDEO",
  "PAYSANDU",
  "RIO NEGRO",
  "ROCHA",
  "RIVERA",
  "SALTO",
  "SAN JOSE",
  "SORIANO",
  "TACUAREMBO",
  "TREINTA Y TRES",
];

export const LOCALIDADES_POR_DEPARTAMENTO = {
  ARTIGAS: ["ARTIGAS", "BELLA UNION", "TOMAS GOMENSORO"],
  CANELONES: [
    "LAS PIEDRAS",
    "CANELONES",
    "LA PAZ",
    "PANDO",
    "SANTA LUCIA",
    "PROGRESO",
    "SAN RAMON",
    "JUAN ANTONIO ARTIGAS",
    "COLONIA NICOLICH",
    "JOAQUIN SUAREZ",
    "PASO DE CARRASCO",
    "SANTA ROSA",
    "SAUCE",
    "TALA",
    "ATLANTIDA",
  ],
  "CERRO LARGO": ["MELO", "RIO BRANCO", "FRAILE MUERTO"],
  COLONIA: ["COLONIA DEL SACRAMENTO", "CARMELO", "JUAN LACAZE", "NUEVA HELVECIA"],
  DURAZNO: ["DURAZNO", "SARANDI DEL YI"],
  FLORIDA: ["FLORIDA", "SARANDI GRANDE"],
  FLORES: ["TRINIDAD"],
  LAVALLEJA: ["MINAS", "JOSE PEDRO VARELA", "MARISCALA"],
  MALDONADO: ["MALDONADO", "PUNTA DEL ESTE", "SAN CARLOS", "PIRIAPOLIS"],
  MONTEVIDEO: ["CENTRO", "CORDON", "POCITOS", "BUCEO", "UNION", "CERRO"],
  PAYSANDU: ["PAYSANDU", "GUICHON", "QUEBRACHO"],
  "RIO NEGRO": ["FRAY BENTOS", "YOUNG"],
  ROCHA: ["ROCHA", "CHUY", "CASTILLOS", "LA PALOMA"],
  RIVERA: ["RIVERA", "TRANQUERAS"],
  SALTO: ["SALTO", "CONSTITUCION"],
  "SAN JOSE": ["SAN JOSE DE MAYO", "LIBERTAD", "CIUDAD DEL PLATA"],
  SORIANO: ["MERCEDES", "DOLORES", "CARDONA"],
  TACUAREMBO: ["TACUAREMBO", "PASO DE LOS TOROS"],
  "TREINTA Y TRES": ["TREINTA Y TRES", "VERGARA"],
};

export const ADD_TABS = [
  { id: "datos", label: "Datos" },
  { id: "formulario", label: "Formulario" },
  { id: "ci_frente", label: "Cédula Frente" },
  { id: "ci_dorso", label: "Cédula Dorso" },
  { id: "f35_frente", label: "Form. >35 Frente" },
  { id: "f35_dorso", label: "Form. >35 Dorso" },
];

export function buildDefaultDatos() {
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

    pais: "URUGUAY",
    departamento: "",
    localidad: "",
  };
}

/**
 * Helpers genéricos
 */
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

export function getLocalidadesByDepartamento(departamento = "") {
  return LOCALIDADES_POR_DEPARTAMENTO[departamento] || [];
}

/**
 * Validación de CI uruguaya
 * Solo aplica para documento tipo CI
 */
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

/**
 * Helpers de fecha
 */
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

/**
 * Crea data demo relativa al día actual, para que los filtros de período
 * siempre se puedan probar sin depender de fechas fijas viejas.
 */
export function buildDemoItems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [
    {
      id: "217450",
      ci: "65882368",
      fo: "FO",
      proy: "3075",
      km: "<100km",
      fecha: formatDateDDMMYY(addDays(today, -1)),
      hora: "09:22",
      estadoTxt: "BPS",
      color: "#43a047",
      estatus: "Activos",
    },
    {
      id: "218051",
      ci: "53258418",
      fo: "FO",
      proy: "3075",
      km: "<100km",
      fecha: formatDateDDMMYY(addDays(today, -3)),
      hora: "11:12",
      estadoTxt: "BPS",
      color: "#43a047",
      estatus: "Activos",
    },
    {
      id: "219777",
      ci: "48771234",
      fo: "FO",
      proy: "3064",
      km: "+100km",
      fecha: formatDateDDMMYY(addDays(today, -5)),
      hora: "15:48",
      estadoTxt: "Faltante firma",
      color: "#ffa000",
      estatus: "En Proceso",
    },
    {
      id: "206257",
      ci: "67231143",
      fo: "FO",
      proy: "3069",
      km: "<100km",
      fecha: formatDateDDMMYY(addDays(today, -7)),
      hora: "11:02",
      estadoTxt: "REC Solicitar codigo de CI",
      color: "#d32f2f",
      estatus: "Inactivos",
    },
    {
      id: "205900",
      ci: "45678123",
      fo: "FO",
      proy: "3117",
      km: "+100km",
      fecha: formatDateDDMMYY(addDays(today, -9)),
      hora: "10:17",
      estadoTxt: "En revisión",
      color: "#ffa000",
      estatus: "En Proceso",
    },
    {
      id: "210321",
      ci: "39874125",
      fo: "FO",
      proy: "3007",
      km: "<100km",
      fecha: formatDateDDMMYY(addDays(today, -12)),
      hora: "08:55",
      estadoTxt: "BPS",
      color: "#43a047",
      estatus: "Activos",
    },
    {
      id: "210654",
      ci: "41239876",
      fo: "FO",
      proy: "3152",
      km: "+100km",
      fecha: formatDateDDMMYY(addDays(today, -14)),
      hora: "16:20",
      estadoTxt: "Sin actividad",
      color: "#2f3fa3",
      estatus: "Inactivos",
    },
    {
      id: "211888",
      ci: "50123456",
      fo: "FO",
      proy: "2030",
      km: "<100km",
      fecha: formatDateDDMMYY(addDays(today, -18)),
      hora: "13:10",
      estadoTxt: "Recibido sin errores",
      color: "#cfead1",
      estatus: "En Proceso",
    },
    {
      id: "213100",
      ci: "56781234",
      fo: "FO",
      proy: "3005",
      km: "+100km",
      fecha: formatDateDDMMYY(addDays(today, -23)),
      hora: "09:40",
      estadoTxt: "BPS",
      color: "#43a047",
      estatus: "Activos",
    },
    {
      id: "214444",
      ci: "62345678",
      fo: "FO",
      proy: "1512",
      km: "<100km",
      fecha: formatDateDDMMYY(addDays(today, -28)),
      hora: "12:03",
      estadoTxt: "Rechazado",
      color: "#d32f2f",
      estatus: "Inactivos",
    },
    {
      id: "199999",
      ci: "34567891",
      fo: "FO",
      proy: "1332",
      km: "<100km",
      fecha: formatDateDDMMYY(addDays(today, -40)),
      hora: "14:07",
      estadoTxt: "Anulado",
      color: "#000000",
      estatus: "Inactivos",
    },
    {
      id: "299999",
      ci: "78912345",
      fo: "FO",
      proy: "3093",
      km: "+100km",
      fecha: formatDateDDMMYY(addDays(today, 2)),
      hora: "10:00",
      estadoTxt: "Pendiente",
      color: "#ffa000",
      estatus: "En Proceso",
    },
  ];
}

export const DEMO_ITEMS = buildDemoItems();

/**
 * Filtro combinado de período + estatus
 */
export function filterFormsItems(items, periodo, estatus) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diasPeriodo = getPeriodoDias(periodo);

  return items.filter((it) => {
    const fechaItem = parseDDMMYYToDate(it.fecha);
    if (!fechaItem) return false;

    const diff = (hoy.getTime() - fechaItem.getTime()) / (1000 * 60 * 60 * 24);

    const dentroPeriodo = diff >= 0 && diff <= diasPeriodo;
    if (!dentroPeriodo) return false;

    if (estatus === "Todos") return true;
    return it.estatus === estatus;
  });
}