export const PERIODOS = [
  "5 días",
  "10 días",
  "15 días",
  "20 días",
  "25 días",
  "30 días",
];

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


export function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export function isValidInputDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const year = Number(String(value).slice(0, 4));
  return year >= 1900;
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
  return String(v)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

export function formatMoney(v = "") {
  const nums = cleanNumbers(v);
  if (!nums) return "";
  return Number(nums).toLocaleString("es-UY");
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

export function parseDDMMYYYYToInputDate(str) {
  if (!str || !/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return "";
  const [dd, mm, yyyy] = str.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

export function getEdadDesdeFecha(inputDate) {
  if (!inputDate) return null;
  const nac = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(nac.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad -= 1;
  return edad;
}

export function getPeriodoDias(periodo) {
  const n = parseInt(periodo, 10);
  return Number.isFinite(n) ? n : 30;
}

export function buildDefaultDatos({ paises = [] } = {}) {
  const uruguay =
    paises.find((p) => normalizeText(p?.nombre || p) === "URUGUAY") || null;

  return {
    proyecto: "",
    distancia: DISTANCIAS[0],
    asesor: "",
    asesorForm: "",
    fechaForm: todayInputDate(),

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

    fotoFormulario: "",
    fotoCiFrente: "",
    fotoCiDorso: "",
    foto35Frente: "",
    foto35Dorso: "",
  };
}

function hasFormularioValue(value) {
  const text = cleanText(value);
  if (!text) return false;

  const normalized = normalizeText(text);
  if (normalized === "0") return false;
  if (normalized === "0.00") return false;
  if (normalized === "1753-01-01") return false;
  if (normalized === "01/01/1753") return false;
  if (normalized === "1900-01-01") return false;
  if (normalized === "01/01/1900") return false;

  return true;
}

function formularioValue(value, fallback) {
  return hasFormularioValue(value) ? cleanText(value) : fallback;
}

export function mergeFormularioDetalleToDatos(prev, detalle = {}, extra = {}) {
  const asesorLogueado = cleanText(extra.asesorLogueado);
  const detalleFechaForm = cleanText(detalle.forfec);
  const detalleFechaNac = cleanText(detalle.forfecnac);

  return {
    ...prev,
    formulario: hasFormularioValue(detalle.fornum) ? String(detalle.fornum) : prev.formulario,
    cedula: hasFormularioValue(detalle.forci) ? String(detalle.forci) : prev.cedula,
    fechaForm: isValidInputDate(detalleFechaForm) ? detalleFechaForm : prev.fechaForm || todayInputDate(),
    telefono: formularioValue(detalle.fortel, prev.telefono),
    celular: formularioValue(detalle.forcel, prev.celular),
    calle: formularioValue(detalle.fordire, prev.calle),
    nro: formularioValue(detalle.forpuerta, prev.nro),
    apto: formularioValue(detalle.forapto, prev.apto),
    bis: formularioValue(detalle.forbis, prev.bis),
    localidad: formularioValue(detalle.forciu, prev.localidad),
    departamento: formularioValue(detalle.fordepto, prev.departamento),
    mail: formularioValue(detalle.formail, prev.mail),
    proyecto: hasFormularioValue(detalle.forproy) ? String(detalle.forproy) : prev.proyecto,
    distancia: formularioValue(detalle.fordonde, prev.distancia),
    asesor: asesorLogueado || prev.asesor,
    asesorForm: asesorLogueado || prev.asesorForm,
    fechaNac: isValidInputDate(detalleFechaNac) ? detalleFechaNac : prev.fechaNac,
    empresa: formularioValue(detalle.forempresa, prev.empresa),
    sueldo: hasFormularioValue(detalle.forsueldo) ? String(detalle.forsueldo) : prev.sueldo,
    tipoDocumento: formularioValue(detalle.fortipdoc, prev.tipoDocumento),
    codigoCI: formularioValue(detalle.forcitipo, prev.codigoCI),
    serieCodCI: formularioValue(detalle.forcodciser, prev.serieCodCI),
    nroCodCI: formularioValue(detalle.forcodci, prev.nroCodCI),
    fotoFormulario: detalle.forfoto || prev.fotoFormulario,
    fotoCiFrente: detalle.forcifoto || prev.fotoCiFrente,
    fotoCiDorso: detalle.forcifoto2 || prev.fotoCiDorso,
    foto35Frente: detalle.for35f || prev.foto35Frente,
    foto35Dorso: detalle.for35d || prev.foto35Dorso,
  };
}

export function buildFormularioPayload(datos) {
  return {
    formulario: cleanText(datos.formulario),
    fechaForm: cleanText(datos.fechaForm),
    tipoDocumento: cleanText(datos.tipoDocumento),
    documento: cleanText(datos.cedula),
    pais: cleanText(datos.pais),
    paisId: datos.paisId ?? null,
    fechaNac: cleanText(datos.fechaNac),
    telefono: cleanText(datos.telefono),
    celular: cleanText(datos.celular),
    empresa: cleanText(datos.empresa),
    sueldo: cleanText(datos.sueldo),
    mail: cleanText(datos.mail),
    calle: cleanText(datos.calle),
    puerta: cleanText(datos.nro),
    apto: cleanText(datos.apto),
    bis: cleanText(datos.bis),
    departamento: cleanText(datos.departamento),
    localidad: cleanText(datos.localidad),
    proyecto: cleanText(datos.proyecto),
    asesorForm: cleanText(datos.asesorForm),
    autorizacion: cleanText(datos.asesorForm),
    forauto: normalizeText(datos.distancia).includes("+100") ? 1 : 0,
    distancia: cleanText(datos.distancia),
    codigoCI: cleanText(datos.nroCodCI),
    serieCodCI: cleanText(datos.serieCodCI),
    tipoImpresionCI: cleanText(datos.codigoCI),
    fotos: {
      formulario: datos.fotoFormulario || "",
      ciFrente: datos.fotoCiFrente || "",
      ciDorso: datos.fotoCiDorso || "",
      form35Frente: datos.foto35Frente || "",
      form35Dorso: datos.foto35Dorso || "",
    },
  };
}

export function getProyectoOptions(items = [], selectedProyecto = "") {
  const selected = cleanText(selectedProyecto);
  const seenValues = new Set();
  const seenLabels = new Set();
  const options = [];

  for (const item of items || []) {
    const value = cleanText(item?.ProyectoId || item?.proyectoId || item?.id);
    const label = cleanText(item?.ProyectoNombre || item?.nombre || `Proyecto ${value}`);
    const labelKey = normalizeText(label);

    if (!value || seenValues.has(value) || seenLabels.has(labelKey)) continue;

    seenValues.add(value);
    seenLabels.add(labelKey);
    options.push({
      value,
      label,
      asenum: item?.asenum != null ? String(item.asenum) : "",
      matricula: cleanText(item?.ProyectoMatricula || item?.matricula),
      deptos: cleanText(item?.Deptos || item?.deptos),
      raw: item,
    });
  }

  if (selected && !seenValues.has(selected)) {
    options.unshift({
      value: selected,
      label: `Proyecto ${selected}`,
      asenum: "",
      matricula: "",
      deptos: "",
      raw: null,
    });
  }

  return options;
}

export function getFormularioPendienteOptions(items = [], selectedFormulario = "") {
  const selected = cleanText(selectedFormulario);
  const seen = new Set();
  const options = [];

  for (const item of items || []) {
    const fornum = cleanText(item?.fornum || item?.id);
    if (!fornum || seen.has(fornum)) continue;

    seen.add(fornum);

    options.push({
      value: fornum,
      label: `Formulario ${fornum}`,
      asesor: item?.forpromoto ? String(item.forpromoto) : "",
      raw: item,
    });
  }

  if (selected && !seen.has(selected)) {
    options.unshift({
      value: selected,
      label: `Formulario ${selected}`,
      asesor: "",
      raw: null,
    });
  }

  return options;
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
  const seen = new Set();
  const options = [];

  for (const loc of localidades || []) {
    const value = loc?.localidad || loc;
    const label = loc?.localidad || loc;
    const key = normalizeText(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push({
      value,
      label,
      idlocalidad: loc?.idlocalidad ?? null,
    });
  }

  return options;
}

export function formatDateTimeParts(value) {
  if (!value) return { fecha: "Pendiente", hora: "" };

  const text = String(value).trim();

  const sqlMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?/);
  if (sqlMatch) {
    const [, yyyy, mm, dd, hh = "", min = ""] = sqlMatch;
    const fecha = `${Number(dd)}/${Number(mm)}/${yyyy}`;
    const hora = hh && min ? `${hh}:${min}` : "";
    return { fecha, hora };
  }

  const ddmmyyyy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy, hh = "", min = ""] = ddmmyyyy;
    const fecha = `${Number(dd)}/${Number(mm)}/${yyyy}`;
    const hora = hh && min ? `${hh}:${min}` : "";
    return { fecha, hora };
  }

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return { fecha: "", hora: "" };

  const fecha = dt.toLocaleDateString("es-UY");
  const hora = dt.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { fecha, hora };
}

export function resolveFormularioVisual(row) {
  return {
    estadoTxt: cleanText(row?.estadoTexto || row?.foraccion || "Pendiente"),
    estadoDetalle: cleanText(row?.estadoDetalle),
    color: cleanText(row?.estadoColor) || "#ffa000",
    estatus: cleanText(row?.estadoFiltro) || "Todos",
    borderColor: cleanText(row?.estadoBorde),
  };
}

export function mapFormularioItem(row) {
  const { fecha, hora } = formatDateTimeParts(row?.forcuando);
  const visual = resolveFormularioVisual(row);
  const distancia = Number(row?.forauto || 0) === 1 ? ">100km" : "<100km";
  const proyectoAsesor = cleanText(row?.forproyase) || cleanText(row?.forproy);

  return {
    id: row?.fornum ? String(row.fornum) : "",
    detalle: cleanText(row?.fordetalle),
    proy: proyectoAsesor || "—",
    km: proyectoAsesor ? distancia : "",
    fecha,
    hora,
    estadoTxt: visual.estadoTxt,
    estadoDetalle: visual.estadoDetalle,
    color: visual.color,
    estatus: visual.estatus,
    borderColor: visual.borderColor || "",
    asesor: row?.forquien_env ? String(row.forquien_env) : "",
    raw: row,
  };
}
