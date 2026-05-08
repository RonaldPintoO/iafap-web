const snapshotService = require("./snapshotService");

const sql = require("mssql");
const { getPool } = require("../config/database");

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function normalizeCatalogText(value) {
  return normalizeText(value);
}

function normalizeAccobs(value) {
  const text = cleanText(value);
  if (!text) return "";

  const normalizations = [
    { pattern: /^#*\s*consultado por asesor/i, value: "" },
  ];

  for (const rule of normalizations) {
    if (rule.pattern.test(text)) return rule.value;
  }

  return text;
}

function safePage(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function safePageSize(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 100;
  return Math.min(Math.floor(n), 100);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}


function toSmallInt(value, fieldName) {
  const n = Number(value);

  if (!Number.isInteger(n)) {
    const error = new Error(`${fieldName} debe ser numérico`);
    error.statusCode = 400;
    throw error;
  }

  return n;
}

function buildSqlCharValue(value, maxLength) {
  const text = cleanText(value);
  if (!text) return "";
  return text.slice(0, maxLength);
}

function formatDateOnly(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return cleanText(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDateTimeLocal(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return cleanText(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatSqlDateTimeInput(value) {
  const text = cleanText(value);
  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;

  const yyyy = Number(match[1]);
  const mm = Number(match[2]);
  const dd = Number(match[3]);
  const hh = Number(match[4] || 0);
  const min = Number(match[5] || 0);
  const ss = Number(match[6] || 0);

  const valid =
    yyyy >= 1900 && yyyy <= 2100 &&
    mm >= 1 && mm <= 12 &&
    dd >= 1 && dd <= 31 &&
    hh >= 0 && hh <= 23 &&
    min >= 0 && min <= 59 &&
    ss >= 0 && ss <= 59;

  if (!valid) return null;

  return `${match[1]}-${match[2]}-${match[3]} ${String(hh).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function getAcccontactoForResultado({ resultado, payload }) {
  const requiereAgenda = Number(resultado?.resagendar) === 1;

  if (!requiereAgenda) {
    return { requiereAgenda, acccontactoSql: "1753-01-01 00:00:00" };
  }

  const acccontactoSql = formatSqlDateTimeInput(payload?.acccontacto);

  if (!acccontactoSql) {
    const error = new Error("Debe ingresar fecha y hora para la agenda");
    error.statusCode = 400;
    throw error;
  }

  return { requiereAgenda, acccontactoSql };
}

function compareText(a, b) {
  return cleanText(a).localeCompare(cleanText(b), "es", {
    sensitivity: "base",
    numeric: true,
  });
}

function getPuertaNumber(value) {
  const match = cleanText(value).match(/\d+/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const n = Number(match[0]);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function sortItemsByDireccion(items) {
  return [...items].sort((a, b) => {
    const byDepartamento = compareText(a.departamento, b.departamento);
    if (byDepartamento !== 0) return byDepartamento;

    const byCiudad = compareText(a.ciudad, b.ciudad);
    if (byCiudad !== 0) return byCiudad;

    const byCalle = compareText(a.calle, b.calle);
    if (byCalle !== 0) return byCalle;

    const byPuerta = getPuertaNumber(a.nroPuerta) - getPuertaNumber(b.nroPuerta);
    if (byPuerta !== 0) return byPuerta;

    const byDireccion = compareText(a.direccion, b.direccion);
    if (byDireccion !== 0) return byDireccion;

    const byNombre = compareText(a.nombreCompleto, b.nombreCompleto);
    if (byNombre !== 0) return byNombre;

    return compareText(a.cedula, b.cedula);
  });
}

function buildDireccionCompleta(row) {
  const partes = [];
  const calle = cleanText(row.calle);
  const puerta = cleanText(row.nro_puerta);
  const apto = cleanText(row.apto);
  const bis = cleanText(row.bis);
  const entre1 = cleanText(row.entre1);
  const entre2 = cleanText(row.entre2);
  const manzana = cleanText(row.manzana);
  const solar = cleanText(row.solar);
  const ruta = cleanText(row.ruta);
  const km = cleanText(row.km);

  if (calle || puerta) partes.push([calle, puerta].filter(Boolean).join(" "));
  if (apto) partes.push(`Apto. ${apto}`);
  if (bis) partes.push(`Bis ${bis}`);
  if (entre1 || entre2) partes.push(`Entre ${[entre1, entre2].filter(Boolean).join(" y ")}`);
  if (manzana) partes.push(`Mza. ${manzana}`);
  if (solar) partes.push(`Solar ${solar}`);
  if (ruta) partes.push(`Ruta ${ruta}`);
  if (km) partes.push(`Km ${km}`);

  return partes.filter(Boolean).join(", ");
}


function aplicarPermisosEdicionAcciones(items, authUser) {
  const asenumTxt = cleanText(authUser?.asenum);
  const nowMs = Date.now();

  return (Array.isArray(items) ? items : []).map((item) => {
    const segundosRestantes = Math.max(
      0,
      toNumberOrNull(item?.editableSegundosRestantes) || 0,
    );
    const esMismoAsesor = Boolean(
      asenumTxt && cleanText(item?.asenum) && asenumTxt === cleanText(item.asenum),
    );
    const estaEnVentana = Boolean(item?.puedeEditarServidor && segundosRestantes > 0);
    const editableHastaMs = segundosRestantes > 0 ? nowMs + segundosRestantes * 1000 : null;

    return {
      ...item,
      puedeEditar: Boolean(item?.accnum && esMismoAsesor && estaEnVentana),
      editableHasta: editableHastaMs ? new Date(editableHastaMs).toISOString() : null,
    };
  });
}

function filterItemsByLocalidad(items, localidad) {
  const localidadNorm = normalizeText(localidad);

  if (!localidadNorm || localidadNorm === "TODOS") {
    return items;
  }

  return items.filter((item) => normalizeText(item.ciudad) === localidadNorm);
}

function detectImageMime(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return "application/octet-stream";
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // HEIF / HEIC
  // ISO BMFF: bytes 4-7 = "ftyp", brand típico: heic/heif/mif1/msf1
  const boxType = buffer.slice(4, 8).toString("ascii");
  const brand = buffer.slice(8, 12).toString("ascii").toLowerCase();

  if (
    boxType === "ftyp" &&
    ["heic", "heix", "hevc", "hevx", "heif", "mif1", "msf1"].includes(brand)
  ) {
    return "image/heif";
  }

  return "application/octet-stream";
}

function getExtensionFromMime(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/heif":
      return "heif";
    default:
      return "bin";
  }
}

async function getVinculosPersona({ cedula }) {
  const ci = String(cedula || "").trim();

  if (!ci) {
    const error = new Error("La cédula es requerida");
    error.statusCode = 400;
    throw error;
  }

  const pool = await getPool();

  const result = await pool.request().input("cedula", sql.VarChar, ci).query(`
      SELECT
  r.relci2 AS cedula,
  t.reltipdet AS tipoVinculo,
  p.perprinom AS primerNombre,
  p.persegnom AS segundoNombre,
  p.perpriape AS primerApellido,
  p.persegape AS segundoApellido,
  p.perfecnac AS nacimiento,
  CASE
    WHEN LTRIM(RTRIM(p.perafap)) = 'IN' THEN 'INTEGRACION'
    WHEN LTRIM(RTRIM(p.perafap)) IN ('AF', 'OA', 'UN', 'RE') THEN 'OTRA AFAP'
    WHEN LTRIM(RTRIM(p.perafap)) = '' OR p.perafap IS NULL THEN 'SIN AFAP'
    ELSE 'SIN AFAP'
  END AS situacionAfap,
  p.perdepto AS departamento,
  p.perciudad AS localidad,
  p.pertel AS telefono,
  p.percel AS celular,
  p.percalle AS calle,
  p.perpuerta AS numeroPuerta,
  p.perapto AS apto
FROM RELACIONES AS r
INNER JOIN TIPORELACIONES AS t
  ON r.reltipnum = t.reltipnum
INNER JOIN PERSONA AS p
  ON p.perci = r.relci2
WHERE r.relci1 = @cedula
ORDER BY t.reltipdet, p.perpriape, p.persegape, p.perprinom;
    `);

  const items = result.recordset || [];

  return {
    total: items.length,
    items,
  };
}

async function getFormularioFoto({ cedula }) {
  const cedulaTxt = String(cedula || "").trim();

  if (!cedulaTxt) {
    const error = new Error("Cédula requerida");
    error.statusCode = 400;
    throw error;
  }

  const pool = await getPool();

  const result = await pool
    .request()
    .input("cedula", sql.VarChar(20), cedulaTxt).query(`
      SELECT TOP (1)
        forci,
        forfoto
      FROM [afapformularios].[dbo].[FORMULAR]
      WHERE LTRIM(RTRIM(CONVERT(VARCHAR(20), forci))) = @cedula
        AND forfoto IS NOT NULL
    `);

  const row = result.recordset?.[0];

  if (!row || !row.forfoto) {
    const error = new Error("No hay formulario disponible para esta persona");
    error.statusCode = 404;
    throw error;
  }

  const buffer = Buffer.isBuffer(row.forfoto)
    ? row.forfoto
    : Buffer.from(row.forfoto);

  const mimeType = detectImageMime(buffer);
  const extension = getExtensionFromMime(mimeType);

  return {
    buffer,
    mimeType,
    filename: `formulario_${cedulaTxt}.${extension}`,
    disposition: "inline",
  };
}

function matchTexto(item, texto) {
  const query = normalizeText(texto);
  if (!query) return true;

  const haystack = [
    item.nombreCompleto,
    item.primerNombre,
    item.segundoNombre,
    item.primerApellido,
    item.segundoApellido,
    item.cedula,
    item.calle,
    item.telefono,
    item.celular,
  ]
    .map(normalizeText)
    .join(" ");

  return haystack.includes(query);
}

function matchTipo(item, tipo) {
  const value = normalizeText(tipo);
  if (!value || value === "TODOS") return true;
  return normalizeText(item.asidetalle) === value;
}

function matchEdad(item, edadDesde, edadHasta) {
  const edad = Number(item.edad);

  if (!Number.isFinite(edad)) return false;

  if (edadDesde !== null && edad < edadDesde) return false;
  if (edadHasta !== null && edad > edadHasta) return false;

  return true;
}

function matchEdadParidad(item, edadParidad) {
  const paridad = normalizeText(edadParidad);

  if (!paridad || paridad === "TODAS") return true;

  const edad = Number(item.edad);
  if (!Number.isFinite(edad)) return false;

  if (paridad === "PAR") return edad % 2 === 0;
  if (paridad === "IMPAR") return edad % 2 !== 0;

  return true;
}

function matchNacionalidad(item, nacionalidad) {
  const value = normalizeText(nacionalidad);

  if (!value || value === "TODOS") return true;
  if (value === "NACIONAL") return !item.tieneDocumentoExtranjero;
  if (value === "EXTRANJERO") return Boolean(item.tieneDocumentoExtranjero);

  return true;
}

function matchEstado(item, estado) {
  const value = normalizeText(estado);

  if (!value || value === "TODOS") return true;
  return normalizeText(item.estadoFiltro) === value;
}

function getDiferenciaDias(ts) {
  if (!ts) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fecha = new Date(ts);
  fecha.setHours(0, 0, 0, 0);

  const diffMs = hoy.getTime() - fecha.getTime();
  return Math.floor(diffMs / 86400000);
}

function matchFechaAccion(item, fechaAccion) {
  const value = cleanText(fechaAccion);

  if (!value || normalizeText(value) === "TODOS") return true;

  const dias = getDiferenciaDias(item.ultimaAccionTs);
  if (dias === null || dias < 0) return false;

  if (value === "0-7") return dias >= 0 && dias <= 7;
  if (value === "8-15") return dias >= 8 && dias <= 15;
  if (value === "16-30") return dias >= 16 && dias <= 30;
  if (value === "31-180") return dias >= 31 && dias <= 180;
  if (value === "181-360") return dias >= 181 && dias <= 360;
  if (value === "+360") return dias > 360;

  return true;
}

function matchAccion(item, accion) {
  const value = normalizeText(accion);

  if (!value || value === "TODOS") return true;
  return normalizeText(item.resnom) === value;
}

function matchLey(item, ley) {
  const value = normalizeText(ley);

  if (!value || value === "TODOS") return true;
  return normalizeText(item.leyLabel) === value;
}

function filterItems(items, filters) {
  const edadDesde = toNumberOrNull(filters.edadDesde);
  const edadHasta = toNumberOrNull(filters.edadHasta);

  return items.filter((item) => {
    if (!matchTexto(item, filters.texto)) return false;
    if (!matchTipo(item, filters.tipo)) return false;
    if (!matchEdad(item, edadDesde, edadHasta)) return false;
    if (!matchEdadParidad(item, filters.edadParidad)) return false;
    if (!matchNacionalidad(item, filters.nacionalidad)) return false;
    if (!matchEstado(item, filters.estado)) return false;
    if (!matchFechaAccion(item, filters.fechaAccion)) return false;
    if (!matchAccion(item, filters.accion)) return false;
    if (!matchLey(item, filters.ley)) return false;

    return true;
  });
}

function sortAndUnique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

async function getPersonas({
  asesor,
  page = 1,
  pageSize = 100,
  localidad = "Todos",
  texto = "",
  tipo = "Todos",
  edadDesde = "",
  edadHasta = "",
  edadParidad = "Todas",
  nacionalidad = "Todos",
  estado = "Todos",
  fechaAccion = "Todos",
  accion = "Todos",
  ley = "Todos",
}) {
  const asesorTxt = cleanText(asesor);

  if (!asesorTxt) {
    const error = new Error("El parámetro 'asesor' es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  const edadDesdeNum = toNumberOrNull(edadDesde);
  const edadHastaNum = toNumberOrNull(edadHasta);

  if (
    edadDesdeNum !== null &&
    edadHastaNum !== null &&
    edadDesdeNum > edadHastaNum
  ) {
    const error = new Error(
      "La edad desde no puede ser mayor que la edad hasta",
    );
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  const currentPage = safePage(page);
  const currentPageSize = safePageSize(pageSize);

  const allItems = snapshotService.getItemsByAsesor(asesorTxt);
  const byLocalidad = filterItemsByLocalidad(allItems, localidad);
  const filteredItems = filterItems(byLocalidad, {
    texto,
    tipo,
    edadDesde,
    edadHasta,
    edadParidad,
    nacionalidad,
    estado,
    fechaAccion,
    accion,
    ley,
  });

  const orderedItems = sortItemsByDireccion(filteredItems);

  const total = orderedItems.length;
  const totalPages = total > 0 ? Math.ceil(total / currentPageSize) : 0;
  const normalizedPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const start = (normalizedPage - 1) * currentPageSize;
  const end = start + currentPageSize;

  const snapshotStatus = snapshotService.getSnapshotStatus();

  return {
    items: orderedItems.slice(start, end),
    total,
    page: normalizedPage,
    page_size: currentPageSize,
    total_pages: totalPages,
    localidad: cleanText(localidad) || "Todos",
    snapshot_version: snapshotStatus.version,
    snapshot_last_completed_at: snapshotStatus.lastCompletedAt,
    snapshot_is_refreshing: snapshotStatus.isRefreshing,
  };
}

async function getLocalidades({ asesor }) {
  const asesorTxt = cleanText(asesor);

  if (!asesorTxt) {
    const error = new Error("El parámetro 'asesor' es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  const items = snapshotService.getItemsByAsesor(asesorTxt);

  const unique = new Set();

  for (const item of items) {
    const ciudad = cleanText(item.ciudad);
    if (ciudad) {
      unique.add(ciudad);
    }
  }

  const localidades = Array.from(unique).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );

  return ["Todos", ...localidades];
}

async function getFiltrosPersonas({ asesor, localidad = "Todos" }) {
  const asesorTxt = cleanText(asesor);

  if (!asesorTxt) {
    const error = new Error("El parámetro 'asesor' es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  const items = snapshotService.getItemsByAsesor(asesorTxt);
  const byLocalidad = filterItemsByLocalidad(items, localidad);

  const tipos = sortAndUnique(
    byLocalidad.map((item) => cleanText(item.asidetalle)),
  );
  const acciones = sortAndUnique(
    byLocalidad
      .map((item) => cleanText(item.resnom))
      .filter((value) => value && value !== "Sin Acción"),
  );

  return {
    tipos: ["Todos", ...tipos],
    acciones: ["Todos", ...acciones],
  };
}

async function refreshPersonasSnapshot() {
  return snapshotService.refreshSnapshot({
    reason: "manual-endpoint",
    force: false,
  });
}

async function getAccionesCatalogos() {
  const pool = await getPool();

  const tiposResult = await pool.request().query(`
    SELECT
      ta_num,
      LTRIM(RTRIM(ta_nom)) AS ta_nom,
      ta_tipo,
      ta_activo
    FROM [dbo].[TIPOACCION] WITH (NOLOCK)
    WHERE ta_activo = 1
    ORDER BY ta_num
  `);

  const resultadosResult = await pool.request().query(`
    SELECT
      resnum,
      LTRIM(RTRIM(resnom)) AS resnom,
      restipo,
      rescelular,
      restransfiere,
      resestrellas,
      rescheck,
      resnvodir,
      resnvotel,
      resagendar
    FROM [dbo].[RESULTADOS] WITH (NOLOCK)
    WHERE restipo IN (0, 1)
      AND ISNULL(rescelular, 0) IN (1, 2)
    ORDER BY
      restipo,
      LTRIM(RTRIM(resnom))
  `);

  return {
    tipos: (tiposResult.recordset || []).map((row) => ({
      ta_num: toNumberOrNull(row.ta_num),
      ta_nom: cleanText(row.ta_nom),
      ta_tipo: toNumberOrNull(row.ta_tipo),
      ta_activo: toNumberOrNull(row.ta_activo),
    })),
    resultados: (resultadosResult.recordset || []).map((row) => ({
      resnum: toNumberOrNull(row.resnum),
      resnom: cleanText(row.resnom),
      restipo: toNumberOrNull(row.restipo),
      rescelular: toNumberOrNull(row.rescelular),
      restransfiere: toNumberOrNull(row.restransfiere),
      resestrellas: toNumberOrNull(row.resestrellas),
      rescheck: toNumberOrNull(row.rescheck),
      resnvodir: toNumberOrNull(row.resnvodir),
      resnvotel: toNumberOrNull(row.resnvotel),
      resagendar: toNumberOrNull(row.resagendar),
    })),
  };
}

async function validarCatalogoAccion({ acctipo, resnum }) {
  const pool = await getPool();

  const tipoResult = await pool
    .request()
    .input("acctipo", sql.SmallInt, acctipo)
    .query(`
      SELECT TOP (1) ta_num
      FROM [dbo].[TIPOACCION] WITH (NOLOCK)
      WHERE ta_num = @acctipo
        AND ta_activo = 1
    `);

  if (!tipoResult.recordset?.[0]) {
    const error = new Error("El tipo de acción no está habilitado");
    error.statusCode = 400;
    throw error;
  }

  const resultadoResult = await pool
    .request()
    .input("resnum", sql.SmallInt, resnum)
    .query(`
      SELECT TOP (1)
        resnum,
        LTRIM(RTRIM(resnom)) AS resnom,
        restipo,
        resagendar,
        rescelular,
        restransfiere,
        resestrellas,
        rescheck,
        resnvodir,
        resnvotel
      FROM [dbo].[RESULTADOS] WITH (NOLOCK)
      WHERE resnum = @resnum
        AND restipo IN (0, 1)
        AND ISNULL(rescelular, 0) IN (1, 2)
    `);

  const resultado = resultadoResult.recordset?.[0];

  if (!resultado) {
    const error = new Error("El resultado seleccionado no existe");
    error.statusCode = 400;
    throw error;
  }

  return resultado;
}

async function crearAccionPersona({ cedula, authUser, payload }) {
  const cedulaTxt = cleanText(cedula);
  const asenumTxt = cleanText(authUser?.asenum);

  if (!cedulaTxt) {
    const error = new Error("Cédula requerida");
    error.statusCode = 400;
    throw error;
  }

  if (!asenumTxt) {
    const error = new Error("No se pudo identificar el asesor autenticado");
    error.statusCode = 401;
    throw error;
  }

  const acctipo = toSmallInt(payload?.acctipo, "acctipo");
  const resnum = toSmallInt(payload?.resnum, "resnum");
  const accvaluacionRaw = Number(payload?.accvaluacion || 0);
  const accvaluacion = Number.isInteger(accvaluacionRaw)
    ? Math.max(0, Math.min(5, accvaluacionRaw))
    : 0;

  const resultado = await validarCatalogoAccion({ acctipo, resnum });
  const resultadoNorm = normalizeCatalogText(resultado.resnom);
  const { acccontactoSql } = getAcccontactoForResultado({ resultado, payload });

  const accobs = buildSqlCharValue(payload?.accobs, 512);
  const accdirnvo =
    resultadoNorm === "DIRECCION NUEVA" || resultadoNorm === "MAIL NUEVO"
      ? buildSqlCharValue(payload?.accdirnvo, 200)
      : "";
  const acctelnvo =
    resultadoNorm === "TELEFONO INCORRECTO"
      ? buildSqlCharValue(payload?.acctelnvo, 40)
      : "";

  if (
    (resultadoNorm === "DIRECCION NUEVA" || resultadoNorm === "MAIL NUEVO") &&
    !accdirnvo
  ) {
    const error = new Error("Debe ingresar el dato nuevo");
    error.statusCode = 400;
    throw error;
  }

  if (resultadoNorm === "TELEFONO INCORRECTO" && !acctelnvo) {
    const error = new Error("Debe ingresar el teléfono nuevo");
    error.statusCode = 400;
    throw error;
  }

  const pool = await getPool();

  const insertResult = await pool
    .request()
    .input("acctipo", sql.SmallInt, acctipo)
    .input("resnum", sql.SmallInt, resnum)
    .input("accobs", sql.VarChar(512), accobs || null)
    .input("accvaluacion", sql.SmallInt, accvaluacion)
    .input("acccontacto", sql.VarChar(19), acccontactoSql)
    .input("perci", sql.Int, Number(cedulaTxt))
    .input("asenum", sql.Int, Number(asenumTxt))
    .input("accobs2", sql.Char(80), "")
    .input("acctelnvo", sql.Char(40), acctelnvo || null)
    .input("accdirnvo", sql.Char(200), accdirnvo || null)
    .query(`
      INSERT INTO [dbo].[ACCIONES] (
        acccuando,
        acctipo,
        resnum,
        accobs,
        acccontacto,
        accmedio,
        accvaluacion,
        perci,
        asenum,
        accobs2,
        acctelnvo,
        accdirnvo,
        accext,
        accadjunto
      )
      OUTPUT INSERTED.accnum
      VALUES (
        SYSDATETIME(),
        @acctipo,
        @resnum,
        @accobs,
        CONVERT(datetime, @acccontacto, 120),
        0,
        @accvaluacion,
        @perci,
        @asenum,
        @accobs2,
        @acctelnvo,
        @accdirnvo,
        NULL,
        NULL
      )
    `);

  const accnum = toNumberOrNull(insertResult.recordset?.[0]?.accnum);
  const items = await snapshotService.refreshAccionesForDocumento(cedulaTxt);
  return {
    accnum,
    items: aplicarPermisosEdicionAcciones(items, authUser),
  };
}


async function actualizarAccionPersona({ accnum, authUser, payload }) {
  const accnumValue = toSmallInt(accnum, "accnum");
  const asenumTxt = cleanText(authUser?.asenum);

  if (!asenumTxt) {
    const error = new Error("No se pudo identificar el asesor autenticado");
    error.statusCode = 401;
    throw error;
  }

  const acctipo = toSmallInt(payload?.acctipo, "acctipo");
  const resnum = toSmallInt(payload?.resnum, "resnum");
  const accvaluacionRaw = Number(payload?.accvaluacion || 0);
  const accvaluacion = Number.isInteger(accvaluacionRaw)
    ? Math.max(0, Math.min(5, accvaluacionRaw))
    : 0;

  const resultado = await validarCatalogoAccion({ acctipo, resnum });
  const resultadoNorm = normalizeCatalogText(resultado.resnom);
  const { acccontactoSql } = getAcccontactoForResultado({ resultado, payload });

  const accobs = buildSqlCharValue(payload?.accobs, 512);
  const accdirnvo =
    resultadoNorm === "DIRECCION NUEVA" || resultadoNorm === "MAIL NUEVO"
      ? buildSqlCharValue(payload?.accdirnvo, 200)
      : "";
  const acctelnvo =
    resultadoNorm === "TELEFONO INCORRECTO"
      ? buildSqlCharValue(payload?.acctelnvo, 40)
      : "";

  if (
    (resultadoNorm === "DIRECCION NUEVA" || resultadoNorm === "MAIL NUEVO") &&
    !accdirnvo
  ) {
    const error = new Error("Debe ingresar el dato nuevo");
    error.statusCode = 400;
    throw error;
  }

  if (resultadoNorm === "TELEFONO INCORRECTO" && !acctelnvo) {
    const error = new Error("Debe ingresar el teléfono nuevo");
    error.statusCode = 400;
    throw error;
  }

  const pool = await getPool();

  const updateResult = await pool
    .request()
    .input("accnum", sql.Int, accnumValue)
    .input("asenum", sql.Int, Number(asenumTxt))
    .input("acctipo", sql.SmallInt, acctipo)
    .input("resnum", sql.SmallInt, resnum)
    .input("accobs", sql.VarChar(512), accobs || null)
    .input("accvaluacion", sql.SmallInt, accvaluacion)
    .input("acccontacto", sql.VarChar(19), acccontactoSql)
    .input("accobs2", sql.Char(80), "")
    .input("acctelnvo", sql.Char(40), acctelnvo || null)
    .input("accdirnvo", sql.Char(200), accdirnvo || null)
    .query(`
      UPDATE [dbo].[ACCIONES]
      SET
        acctipo = @acctipo,
        resnum = @resnum,
        accobs = @accobs,
        acccontacto = CONVERT(datetime, @acccontacto, 120),
        accvaluacion = @accvaluacion,
        accobs2 = @accobs2,
        acctelnvo = @acctelnvo,
        accdirnvo = @accdirnvo
      OUTPUT INSERTED.accnum, INSERTED.perci
      WHERE accnum = @accnum
        AND TRY_CAST(asenum AS int) = @asenum
        AND acccuando >= DATEADD(MINUTE, -5, SYSDATETIME())
    `);

  const updated = updateResult.recordset?.[0];

  if (!updated) {
    const checkResult = await pool
      .request()
      .input("accnum", sql.Int, accnumValue)
      .query(`
        SELECT TOP (1)
          accnum,
          asenum,
          acccuando,
          DATEDIFF(SECOND, acccuando, SYSDATETIME()) AS segundos_desde_accion
        FROM [dbo].[ACCIONES]
        WHERE accnum = @accnum
      `);

    const row = checkResult.recordset?.[0];

    if (!row) {
      const error = new Error("La acción no existe");
      error.statusCode = 404;
      throw error;
    }

    if (cleanText(row.asenum) !== asenumTxt) {
      const error = new Error("Solo el asesor que creó la acción puede editarla");
      error.statusCode = 403;
      throw error;
    }

    const error = new Error("La acción ya no se puede editar porque pasaron más de 5 minutos");
    error.statusCode = 409;
    throw error;
  }

  const cedulaTxt = cleanText(updated.perci);
  const items = await snapshotService.refreshAccionesForDocumento(cedulaTxt);
  return {
    accnum: toNumberOrNull(updated.accnum),
    cedula: cedulaTxt,
    items: aplicarPermisosEdicionAcciones(items, authUser),
  };
}

async function getAgendados({ asesor, estado = "Pendientes", fecha = "Todos", departamento = "Todos", localidad = "Todos" }) {
  const asesorTxt = cleanText(asesor);

  if (!asesorTxt) {
    const error = new Error("No se pudo identificar el asesor para consultar agendados");
    error.statusCode = 400;
    throw error;
  }

  const estadoFiltro = normalizeCatalogText(estado || "Pendientes");
  const fechaFiltro = normalizeCatalogText(fecha || "Todos");
  const departamentoNorm = normalizeCatalogText(departamento || "Todos");
  const localidadNorm = normalizeCatalogText(localidad || "Todos");

  const pool = await getPool();
  const result = await pool
    .request()
    .input("asesor", sql.Int, Number(asesorTxt))
    .query(`
      SELECT TOP (500)
        a.accnum,
        a.acccontacto AS fecha_agendada,
        CONVERT(varchar(19), a.acccontacto, 120) AS fecha_agendada_sql,
        a.acccuando AS fecha_accion,
        CONVERT(varchar(19), a.acccuando, 120) AS fecha_accion_sql,
        a.asenum AS asesor,
        a.perci AS documento,
        p.perprinom AS primer_nombre,
        p.persegnom AS segundo_nombre,
        p.perpriape AS primer_apellido,
        p.persegape AS segundo_apellido,
        p.perfecnac AS fecha_nacimiento,
        p.pertel AS telefono,
        p.percel AS celular,
        p.perdepto AS departamento,
        p.perciudad AS localidad,
        p.percalle AS calle,
        p.perpuerta AS nro_puerta,
        p.perapto AS apto,
        p.perbis AS bis,
        p.perentre1 AS entre1,
        p.perentre2 AS entre2,
        p.permanzana AS manzana,
        p.persolar AS solar,
        p.perruta AS ruta,
        p.perkm AS km,
        r.resnom AS resultado,
        r.resnum,
        r.restipo,
        a.accobs AS observacion,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM [dbo].[ACCIONES] ax WITH (NOLOCK)
            WHERE ax.perci = a.perci
              AND TRY_CAST(ax.asenum AS int) = TRY_CAST(a.asenum AS int)
              AND ax.accnum <> a.accnum
              AND ax.acccuando > a.acccontacto
          ) THEN 1
          ELSE 0
        END AS cerrado,
        (
          SELECT TOP (1) CONVERT(varchar(19), ax.acccuando, 120)
          FROM [dbo].[ACCIONES] ax WITH (NOLOCK)
          WHERE ax.perci = a.perci
            AND TRY_CAST(ax.asenum AS int) = TRY_CAST(a.asenum AS int)
            AND ax.accnum <> a.accnum
            AND ax.acccuando > a.acccontacto
          ORDER BY ax.acccuando ASC, ax.accnum ASC
        ) AS fecha_cierre_sql,
        de.tipo_documento AS tipo_documento_extranjero,
        de.id_pais AS id_pais_extranjero,
        de.documento AS documento_extranjero,
        pb.nombre AS pais_extranjero
      FROM [dbo].[ACCIONES] a WITH (NOLOCK)
      INNER JOIN [dbo].[RESULTADOS] r WITH (NOLOCK)
        ON r.resnum = a.resnum
       AND ISNULL(r.resagendar, 0) = 1
      INNER JOIN [dbo].[PERSONA] p WITH (NOLOCK)
        ON p.perci = a.perci
      LEFT JOIN [dbo].[DOCUMENTO_EXTRANJERO] de WITH (NOLOCK)
        ON TRY_CAST(de.ci_ficticia AS bigint) = TRY_CAST(p.perci AS bigint)
      LEFT JOIN [dbo].[PAISES_BPS] pb WITH (NOLOCK)
        ON pb.idpais = de.id_pais
      WHERE TRY_CAST(a.asenum AS int) = @asesor
        AND a.acccontacto >= CONVERT(datetime, '17530102', 112)
      ORDER BY a.acccontacto ASC, a.accnum DESC
    `);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  weekEnd.setHours(23, 59, 59, 999);

  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  nextWeekStart.setHours(0, 0, 0, 0);

  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
  nextWeekEnd.setHours(23, 59, 59, 999);

  const rows = Array.isArray(result.recordset) ? result.recordset : [];
  const items = rows
    .map((row) => {
      const tipoDocumentoExtranjero = cleanText(row.tipo_documento_extranjero);
      const documentoExtranjero = cleanText(row.documento_extranjero);
      const idPaisExtranjero = toNumberOrNull(row.id_pais_extranjero);
      const paisExtranjero = cleanText(row.pais_extranjero);
      const esExtranjero = Boolean(tipoDocumentoExtranjero || documentoExtranjero || idPaisExtranjero !== null);
      const pais = esExtranjero ? paisExtranjero || "Extranjero" : "Uruguay";
      const fechaAgendada = row.fecha_agendada instanceof Date ? row.fecha_agendada : new Date(row.fecha_agendada);

      return {
        accnum: toNumberOrNull(row.accnum),
        fechaAgendada: row.fecha_agendada_sql || formatDateTimeLocal(row.fecha_agendada),
        fechaAgendadaIso: row.fecha_agendada_sql ? String(row.fecha_agendada_sql).replace(" ", "T") : null,
        fechaAgendadaTexto: formatDateTimeLocal(row.fecha_agendada_sql || row.fecha_agendada),
        fechaAccion: row.fecha_accion_sql || formatDateTimeLocal(row.fecha_accion),
        cerrado: toNumberOrNull(row.cerrado) === 1,
        fechaCierre: row.fecha_cierre_sql || null,
        estadoAgendado: toNumberOrNull(row.cerrado) === 1
          ? "Cerrado"
          : fechaAgendada < today
            ? "Vencido"
            : fechaAgendada < tomorrow
              ? "Hoy"
              : "Próximo",
        diasVencido: toNumberOrNull(row.cerrado) === 1 || fechaAgendada >= today
          ? 0
          : Math.max(1, Math.floor((today.getTime() - fechaAgendada.getTime()) / 86400000)),
        asesor: cleanText(row.asesor),
        documento: cleanText(row.documento),
        nombreCompleto: [row.primer_nombre, row.segundo_nombre, row.primer_apellido, row.segundo_apellido].map(cleanText).filter(Boolean).join(" "),
        primerNombre: cleanText(row.primer_nombre),
        segundoNombre: cleanText(row.segundo_nombre),
        primerApellido: cleanText(row.primer_apellido),
        segundoApellido: cleanText(row.segundo_apellido),
        fechaNacimiento: formatDateOnly(row.fecha_nacimiento),
        telefono: cleanText(row.telefono),
        celular: cleanText(row.celular),
        departamento: cleanText(row.departamento),
        localidad: cleanText(row.localidad),
        calle: cleanText(row.calle),
        nroPuerta: cleanText(row.nro_puerta),
        apto: cleanText(row.apto),
        bis: cleanText(row.bis),
        entre1: cleanText(row.entre1),
        entre2: cleanText(row.entre2),
        manzana: cleanText(row.manzana),
        solar: cleanText(row.solar),
        ruta: cleanText(row.ruta),
        km: cleanText(row.km),
        direccion: buildDireccionCompleta(row),
        resultado: cleanText(row.resultado),
        resnum: toNumberOrNull(row.resnum),
        restipo: toNumberOrNull(row.restipo),
        observacion: normalizeAccobs(row.observacion),
        pais,
        esExtranjero,
        cedulaFicticia: esExtranjero ? cleanText(row.documento) : "",
        tipoDocumentoExtranjero,
        documentoExtranjero,
        idPaisExtranjero,
        paisExtranjero,
        _fechaAgendadaDate: fechaAgendada,
      };
    })
    .filter((item) => {
      if (departamentoNorm && departamentoNorm !== "TODOS" && normalizeCatalogText(item.departamento) !== departamentoNorm) {
        return false;
      }

      if (localidadNorm && localidadNorm !== "TODOS" && normalizeCatalogText(item.localidad) !== localidadNorm) {
        return false;
      }

      const d = item._fechaAgendadaDate;
      if (!(d instanceof Date) || Number.isNaN(d.getTime())) return false;

      if (estadoFiltro === "PENDIENTES" && item.cerrado) return false;
      if (estadoFiltro === "CERRADOS" && !item.cerrado) return false;

      if (fechaFiltro === "HOY") return d >= today && d < tomorrow;
      if (fechaFiltro === "MANANA") return d >= tomorrow && d < afterTomorrow;
      if (fechaFiltro === "ESTA SEMANA") return d >= today && d <= weekEnd;
      if (fechaFiltro === "SEMANA PROXIMA") return d >= nextWeekStart && d <= nextWeekEnd;
      if (fechaFiltro === "VENCIDOS") return d < today;
      if (fechaFiltro === "PROXIMOS") return d >= today;

      return true;
    })
    .map(({ _fechaAgendadaDate, ...item }) => item);

  return {
    asesor: asesorTxt,
    total: items.length,
    items,
  };
}

async function getAccionesPersona({ cedula, authUser }) {
  const cedulaTxt = String(cedula || "").trim();

  if (!cedulaTxt) {
    const error = new Error("Cédula requerida");
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  let snapshotItems = snapshotService.getAccionesByDocumento(cedulaTxt) || [];

  try {
    snapshotItems = await snapshotService.refreshAccionesForDocumento(cedulaTxt);
  } catch (err) {
    console.error("[acciones] refresh puntual error:", err?.message || err);
  }

  const items = aplicarPermisosEdicionAcciones(snapshotItems, authUser);

  return {
    total: items.length,
    items,
  };
}

function getPersonasSnapshotStatus() {
  return snapshotService.getSnapshotStatus();
}

async function getAccionAdjuntoPdf({ accnum }) {
  return snapshotService.getAccionPdfAdjunto(accnum);
}

module.exports = {
  getPersonas,
  getLocalidades,
  getFiltrosPersonas,
  getAccionesCatalogos,
  getAgendados,
  crearAccionPersona,
  actualizarAccionPersona,
  refreshPersonasSnapshot,
  getAccionesPersona,
  getAccionAdjuntoPdf,
  getPersonasSnapshotStatus,
  getVinculosPersona,
  getFormularioFoto,
};
