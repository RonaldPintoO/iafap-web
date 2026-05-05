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


const RESULTADOS_ACCIONES_VISIBLES = [
  "DIRECCION NUEVA",
  "FIN DE SEMANA",
  "GEO MANUAL",
  "LLAMADA AGENDADA",
  "MAIL NUEVO",
  "NO ATIENDE",
  "NO ESTABA",
  "NO HABIA NADIE",
  "NO VIVE AHI",
  "SIN ACTIVIDAD",
  "TELEFONO INCORRECTO",
];

function normalizeCatalogText(value) {
  return normalizeText(value).replace(/\s+/g, " ");
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

  const total = filteredItems.length;
  const totalPages = total > 0 ? Math.ceil(total / currentPageSize) : 0;
  const normalizedPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const start = (normalizedPage - 1) * currentPageSize;
  const end = start + currentPageSize;

  const snapshotStatus = snapshotService.getSnapshotStatus();

  return {
    items: filteredItems.slice(start, end),
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
  const visibles = RESULTADOS_ACCIONES_VISIBLES.map(normalizeCatalogText);

  const tiposResult = await pool.request().query(`
    SELECT
      ta_num,
      LTRIM(RTRIM(ta_nom)) AS ta_nom,
      ta_tipo,
      ta_activo
    FROM [dbo].[TIPOACCION]
    WHERE ta_activo = 1
    ORDER BY ta_num
  `);

  const request = pool.request();
  visibles.forEach((name, idx) => {
    request.input(`resnom${idx}`, sql.VarChar(80), name);
  });

  const inList = visibles.map((_, idx) => `@resnom${idx}`).join(", ");

  const resultadosResult = await request.query(`
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
    FROM [dbo].[RESULTADOS]
    WHERE UPPER(LTRIM(RTRIM(resnom))) COLLATE Latin1_General_CI_AI IN (${inList})
    ORDER BY
      CASE UPPER(LTRIM(RTRIM(resnom))) COLLATE Latin1_General_CI_AI
        WHEN 'DIRECCION NUEVA' THEN 1
        WHEN 'FIN DE SEMANA' THEN 2
        WHEN 'GEO MANUAL' THEN 3
        WHEN 'LLAMADA AGENDADA' THEN 4
        WHEN 'MAIL NUEVO' THEN 5
        WHEN 'NO ATIENDE' THEN 6
        WHEN 'NO ESTABA' THEN 7
        WHEN 'NO HABIA NADIE' THEN 8
        WHEN 'NO VIVE AHI' THEN 9
        WHEN 'SIN ACTIVIDAD' THEN 10
        WHEN 'TELEFONO INCORRECTO' THEN 11
        ELSE 99
      END,
      resnom
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
      FROM [dbo].[TIPOACCION]
      WHERE ta_num = @acctipo
        AND ta_activo = 1
    `);

  if (!tipoResult.recordset?.[0]) {
    const error = new Error("El tipo de acción no está habilitado");
    error.statusCode = 400;
    throw error;
  }

  const visibles = RESULTADOS_ACCIONES_VISIBLES.map(normalizeCatalogText);
  const request = pool.request().input("resnum", sql.SmallInt, resnum);

  visibles.forEach((name, idx) => {
    request.input(`resnom${idx}`, sql.VarChar(80), name);
  });

  const inList = visibles.map((_, idx) => `@resnom${idx}`).join(", ");

  const resultadoResult = await request.query(`
    SELECT TOP (1)
      resnum,
      LTRIM(RTRIM(resnom)) AS resnom,
      restipo
    FROM [dbo].[RESULTADOS]
    WHERE resnum = @resnum
      AND UPPER(LTRIM(RTRIM(resnom))) COLLATE Latin1_General_CI_AI IN (${inList})
  `);

  const resultado = resultadoResult.recordset?.[0];

  if (!resultado) {
    const error = new Error("El resultado seleccionado no está habilitado");
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
        CONVERT(datetime, '17530101', 112),
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
    items,
  };
}

async function getAccionesPersona({ cedula }) {
  const cedulaTxt = String(cedula || "").trim();

  if (!cedulaTxt) {
    const error = new Error("Cédula requerida");
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  const snapshotItems = snapshotService.getAccionesByDocumento(cedulaTxt) || [];

  snapshotService.refreshAccionesForDocumento(cedulaTxt).catch((err) => {
    console.error("[acciones] refresh puntual error:", err?.message || err);
  });

  return {
    total: snapshotItems.length,
    items: snapshotItems,
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
  crearAccionPersona,
  refreshPersonasSnapshot,
  getAccionesPersona,
  getAccionAdjuntoPdf,
  getPersonasSnapshotStatus,
  getVinculosPersona,
  getFormularioFoto,
};
