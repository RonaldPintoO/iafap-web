const { getPool } = require("../config/database");
const env = require("../config/env");

const SNAPSHOT_REFRESH_MS = (env.SNAPSHOT_REFRESH_MINUTES || 5) * 60 * 1000;
const MAX_PAGE_SIZE = 100;

const ASESORES_SIN_GESTION = new Set(["1400", "2030", "3153", "3118", "2071"]);

let snapshotState = {
  isReady: false,
  isRefreshing: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastError: null,
  totalItems: 0,
  totalAsesores: 0,
  version: 0,
  globalItems: [],
  itemsByAsesor: new Map(),
  accionesByDocumento: new Map(),
  smsByDocumento: new Map(),
};

let refreshTimer = null;
let activeRefreshPromise = null;

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function fixMojibake(value) {
  const text = cleanText(value);
  if (!text) return "";

  return text
    .replace(/autom\u00DFticamente/gi, "automáticamente")
    .replace(/\u00DF/g, "á")
    .replace(/\u221A\u00B0/g, "á")
    .replace(/\u221A\u00A9/g, "é")
    .replace(/\u221A\u00AD/g, "í")
    .replace(/\u221A\u00B3/g, "ó")
    .replace(/\u221A\u00BA/g, "ú")
    .replace(/\u221A\u00B1/g, "ñ");
}

function buildNombreCompleto(
  primerNombre,
  segundoNombre,
  primerApellido,
  segundoApellido
) {
  return [
    cleanText(primerNombre),
    cleanText(segundoNombre),
    cleanText(primerApellido),
    cleanText(segundoApellido),
  ]
    .filter(Boolean)
    .join(" ");
}

function formatFechaDDMMYYYY(value) {
  if (!value) return "";

  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "";
  }
}

function formatFechaISO(value) {
  if (!value) return null;

  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function buildFechaAccionTexto(acccuando, asesorNombreCompleto, asenum) {
  if (!acccuando) return "Sin Acción";

  const fechaTxt = formatFechaDDMMYYYY(acccuando);
  const asesorTxt =
    cleanText(asesorNombreCompleto) || cleanText(asenum);

  if (fechaTxt && asesorTxt) {
    return `Fecha Última Acción ${fechaTxt} Asesor: ${asesorTxt}`;
  }
  if (fechaTxt) {
    return `Fecha Última Acción ${fechaTxt}`;
  }
  if (asesorTxt) {
    return `Asesor: ${asesorTxt}`;
  }

  return "Sin Acción";
}

function buildLeyendaAfiliacion(asignadoOficio, regimen) {
  if (asignadoOficio) {
    const reg = cleanText(regimen);
    return reg ? `Asignado de Oficio Régimen ${reg}` : "Asignado de Oficio";
  }

  return "Posible Afiliación Voluntaria";
}

function buildCardVariant(asignadoOficio, resnom) {
  if (!cleanText(resnom)) return "sin-accion";
  if (asignadoOficio) return "oficio";
  return "voluntaria";
}

function buildLeyLabel(perley) {
  const value = Number(perley);

  if (value === 1) return "Ley 16.713";
  if (value === 2) return "Ley 20.130";
  return "No Consultado";
}

function buildEstadoFiltro({ fechaUltimaAccion, restipo, asenum }) {
  if (!fechaUltimaAccion) return "Sin acciones";

  const tipoNum = Number(restipo);
  if (tipoNum === 1) return "Finalizado";

  const asesorTxt = cleanText(asenum);
  if (tipoNum === 0 && ASESORES_SIN_GESTION.has(asesorTxt)) {
    return "Pendiente sin Gestión";
  }

  return "Pendiente con Gestión";
}

function buildSexoLabel(persexo) {
  const value = cleanText(persexo).toUpperCase();

  if (value === "1" || value === "M") return "Hombre";
  if (value === "2" || value === "F") return "Mujer";
  return "N/D";
}

function buildSmsResultadoLabel(resultadoRaw) {
  const value = cleanText(resultadoRaw).toUpperCase();

  if (value === "SIN ACTIVIDAD") return "Sin Actividad";
  if (value === "AFILIABLE") return "Afiliable";
  if (value === "OTRA AFAP") return "Otra Afap";
  if (value === "AFILIADO") return "Afiliado";

  if (
    value === "ERROR DE COMUNICACION" ||
    value === "PAIS INVALIDO" ||
    value === "FECHA MAL" ||
    value === "CEDULA INCORRECTA"
  ) {
    return "Consultar";
  }

  return value ? "Consultar" : "";
}

function buildSmsResultadoColor(resultadoLabel) {
  const value = cleanText(resultadoLabel).toUpperCase();

  if (value === "SIN ACTIVIDAD") return "azul";
  if (value === "AFILIABLE") return "verde-claro";
  if (value === "OTRA AFAP") return "rojo";
  if (value === "AFILIADO") return "verde-oscuro";
  if (value === "CONSULTAR") return "azul";

  return "";
}

function buildHeroChipTexto({ smsResultadoLabel, leyLabel, smsFecha }) {
  const partes = [];

  if (cleanText(smsResultadoLabel)) partes.push(cleanText(smsResultadoLabel));
  if (cleanText(leyLabel)) partes.push(cleanText(leyLabel));

  const fechaTxt = formatFechaDDMMYYYY(smsFecha);
  if (fechaTxt) partes.push(fechaTxt);

  return partes.join(" ");
}

function safePage(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function safePageSize(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return MAX_PAGE_SIZE;
  return Math.min(Math.floor(n), MAX_PAGE_SIZE);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildDireccion(calle, nroPuerta) {
  const calleTxt = cleanText(calle);
  const puertaTxt = cleanText(nroPuerta);

  if (calleTxt && puertaTxt) return `${calleTxt} ${puertaTxt}`;
  if (calleTxt) return calleTxt;
  if (puertaTxt) return puertaTxt;

  return "";
}

function buildSnapshotIndex(items) {
  const map = new Map();

  for (const item of items) {
    const asesor = cleanText(item.asesorApp);

    if (!map.has(asesor)) {
      map.set(asesor, []);
    }

    map.get(asesor).push(item);
  }

  return map;
}

function buildSmsIndex(rows) {
  const map = new Map();

  for (const row of rows) {
    const cedula = cleanText(row.cedula);
    if (!cedula) continue;

    const resultadoRaw = cleanText(row.resultado);
    const resultadoLabel = buildSmsResultadoLabel(resultadoRaw);
    const fechaIso = formatFechaISO(row.fecha_consulta);
    const fechaTexto = formatFechaDDMMYYYY(row.fecha_consulta);
    const color = buildSmsResultadoColor(resultadoLabel);

    map.set(cedula, {
      cedula,
      smsResultadoRaw: resultadoRaw,
      smsResultadoLabel: resultadoLabel,
      smsResultadoFecha: fechaIso,
      smsResultadoFechaTexto: fechaTexto,
      smsResultadoColor: color,
    });
  }

  return map;
}

function mapDbRowToSnapshotItem(row, smsItem = null) {
  const fechaUltimaAccion = row.ultima_accion_fecha || null;
  const asesorUltimaAccion = cleanText(row.ultima_accion_asesor);
  const asesorUltimaAccionNombre = cleanText(row.asesor_nombre);
  const asesorUltimaAccionApellido = cleanText(row.asesor_apellido);
  const asesorUltimaAccionNombreCompleto =
    cleanText(row.asesor_nombre_completo) ||
    [asesorUltimaAccionNombre, asesorUltimaAccionApellido]
      .filter(Boolean)
      .join(" ");

  const resnomRaw = cleanText(row.ultima_accion_resnom);
  const ultimaAccionRestipo = toNumberOrNull(row.ultima_accion_restipo);
  const asignadoOficio = Boolean(row.asignado_oficio);
  const regimen = cleanText(row.regimen);
  const perley = toNumberOrNull(row.perley);
  const persexo = cleanText(row.persexo);

  const resnom = fechaUltimaAccion ? resnomRaw || "Sin Acción" : "Sin Acción";

  const fechaUltimaAccionTexto = fechaUltimaAccion
    ? buildFechaAccionTexto(
        fechaUltimaAccion,
        asesorUltimaAccionNombreCompleto,
        asesorUltimaAccion
      )
    : "Sin Acción";

  const fechaNacIso = formatFechaISO(row.fecha_nac);
  const latitud = toNumberOrNull(row.latitud);
  const longitud = toNumberOrNull(row.longitud);

  const tipoDocumentoExtranjero = cleanText(row.tipo_documento_extranjero);
  const documentoExtranjero = cleanText(row.documento_extranjero);
  const idPaisExtranjero = toNumberOrNull(row.id_pais_extranjero);
  const paisExtranjero = cleanText(row.pais_extranjero);

  const tieneDocumentoExtranjero =
    Boolean(tipoDocumentoExtranjero) ||
    Boolean(documentoExtranjero) ||
    idPaisExtranjero !== null;

  const leyLabel = buildLeyLabel(perley);
  const estadoFiltro = buildEstadoFiltro({
    fechaUltimaAccion,
    restipo: ultimaAccionRestipo,
    asenum: asesorUltimaAccion,
  });

  const smsResultadoRaw = smsItem?.smsResultadoRaw || "";
  const smsResultadoLabel = smsItem?.smsResultadoLabel || "";
  const smsResultadoFecha = smsItem?.smsResultadoFecha || null;
  const smsResultadoFechaTexto = smsItem?.smsResultadoFechaTexto || "";
  const smsResultadoColor = smsItem?.smsResultadoColor || "";
  const heroChipTexto = buildHeroChipTexto({
    smsResultadoLabel,
    leyLabel,
    smsFecha: smsResultadoFecha,
  });

  return {
    cedula: cleanText(row.cedula),
    asesorApp: cleanText(row.asesor_app),
    asidetalle: cleanText(row.asidetalle),

    nombreCompleto: buildNombreCompleto(
      row.primer_nombre,
      row.segundo_nombre,
      row.primer_apellido,
      row.segundo_apellido
    ),

    primerNombre: cleanText(row.primer_nombre),
    segundoNombre: cleanText(row.segundo_nombre),
    primerApellido: cleanText(row.primer_apellido),
    segundoApellido: cleanText(row.segundo_apellido),

    departamento: cleanText(row.departamento),
    ciudad: cleanText(row.ciudad),
    cp: cleanText(row.cp),

    fechaNac: fechaNacIso,
    edad: toNumberOrNull(row.edad),

    persexo,
    sexoLabel: buildSexoLabel(persexo),

    telefono: cleanText(row.telefono),
    celular: cleanText(row.celular),

    calle: cleanText(row.calle),
    nroPuerta: cleanText(row.nro_puerta),
    direccion: buildDireccion(row.calle, row.nro_puerta),

    latitud,
    longitud,

    tipoDocumentoExtranjero,
    documentoExtranjero,
    idPaisExtranjero,
    paisExtranjero,
    tieneDocumentoExtranjero,

    perley,
    leyLabel,

    resnom,
    fechaUltimaAccion: formatFechaDDMMYYYY(fechaUltimaAccion),
    fechaUltimaAccionTexto,
    asesorUltimaAccion,
    asesorUltimaAccionNombre,
    asesorUltimaAccionApellido,
    asesorUltimaAccionNombreCompleto,
    ultimaAccionRestipo,
    estadoFiltro,
    leyendaAfiliacion: buildLeyendaAfiliacion(asignadoOficio, regimen),
    asignadoOficio,
    regimen,
    cardVariant: buildCardVariant(asignadoOficio, resnomRaw),
    ultimaAccionTs: fechaUltimaAccion ? new Date(fechaUltimaAccion).getTime() : null,

    smsResultadoRaw,
    smsResultadoLabel,
    smsResultadoFecha,
    smsResultadoFechaTexto,
    smsResultadoColor,
    heroChipTexto,

    actividadChipLabel: smsResultadoLabel || resnom || "Consultar",
    actividadChipColor:
      smsResultadoColor ||
      buildCardVariant(asignadoOficio, resnomRaw) ||
      "consultar",
    actividadChipTexto:
      heroChipTexto ||
      smsResultadoLabel ||
      resnom ||
      "Consultar",
  };
}

function formatFechaAccionTexto(value) {
  if (!value) return "";

  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return "";
  }
}

const NORMALIZACIONES = [
  {
    pattern: /^#*\s*consultado por asesor/i,
    value: "",
  },
];

function normalizeAccobs(text) {
  const value = fixMojibake(text);
  if (!value) return "";

  const normalized = value.trim();

  for (const rule of NORMALIZACIONES) {
    if (rule.pattern.test(normalized)) {
      return rule.value; // puede ser ""
    }
  }

  return normalized;
}

function buildObservacion(row) {
  const resnum = toNumberOrNull(row.resnum);

  const accobs = normalizeAccobs(row.accobs);
  const accobs2 = normalizeAccobs(row.accobs2);
  const acctelnvo = cleanText(row.acctelnvo);
  const accdirnvo = cleanText(row.accdirnvo);

  const bloques = [];

  // RESNUM 40 → Empresa
  if (resnum === 40) {
    if (accobs) {
      bloques.push({ label: "Nombre Empresa", value: accobs });
    }
    if (accdirnvo) {
      bloques.push({ label: "Dirección Empresa", value: accdirnvo });
    }
    if (accobs2) {
      bloques.push({ label: "", value: accobs2 });
    }

    return bloques;
  }

  // RESNUM 41 → Teléfono
  if (resnum === 41) {
    if (acctelnvo) {
      return [{ label: "Tel", value: acctelnvo }];
    }
    return [];
  }

  // RESTO
  if (accobs) bloques.push({ label: "", value: accobs });
  if (accobs2) bloques.push({ label: "", value: accobs2 });
  if (acctelnvo) bloques.push({ label: "Tel", value: acctelnvo });
  if (accdirnvo) bloques.push({ label: "Dir", value: accdirnvo });

  return bloques;
}

function buildEstadoAccion(restipo) {
  const value = Number(restipo);
  if (value === 0) return "Pendiente";
  if (value === 1) return "Finalizado";
  return "Desconocido";
}

function normalizeAdjuntoExt(value) {
  return cleanText(value).toLowerCase();
}

function getAdjuntoCategoria(ext) {
  const value = normalizeAdjuntoExt(ext);

  if (["pdf"].includes(value)) return "documento";
  if (["jpg", "jpeg", "png", "heif", "heic"].includes(value)) return "imagen";
  if (["mp3", "wav", "ogg", "amr"].includes(value)) return "audio";
  if (["mp4", "mpeg"].includes(value)) return "video";

  return "";
}

function getAdjuntoAccionLabel(ext) {
  const categoria = getAdjuntoCategoria(ext);

  if (categoria === "documento") return "Ver PDF";
  if (categoria === "imagen") return "Ver Imagen";
  if (categoria === "audio") return "Descargar Audio";
  if (categoria === "video") return "Descargar Video";

  return "";
}

function getAdjuntoMimeType(ext) {
  const value = normalizeAdjuntoExt(ext);

  if (value === "pdf") return "application/pdf";
  if (value === "jpg" || value === "jpeg") return "image/jpeg";
  if (value === "png") return "image/png";
  if (value === "heif") return "image/heif";
  if (value === "heic") return "image/heic";
  if (value === "mp3") return "audio/mpeg";
  if (value === "wav") return "audio/wav";
  if (value === "ogg") return "audio/ogg";
  if (value === "amr") return "audio/amr";
  if (value === "mp4") return "video/mp4";
  if (value === "mpeg") return "video/mpeg";

  return "application/octet-stream";
}

function isAdjuntoInline(ext) {
  const categoria = getAdjuntoCategoria(ext);
  return categoria === "documento" || categoria === "imagen";
}

function isAdjuntoSoportado(ext) {
  return Boolean(getAdjuntoCategoria(ext));
}

function buildAccionesIndex(rows) {
  const map = new Map();

  for (const row of rows) {
    const cedula = cleanText(row.perci);
    if (!cedula) continue;

    if (!map.has(cedula)) {
      map.set(cedula, []);
    }

    const asesorNombreCompleto = cleanText(row.asesor_nombre_completo);
    const accext = normalizeAdjuntoExt(row.accext);
    const tieneAdjunto = Number(row.tiene_adjunto) === 1;
    const resnum = toNumberOrNull(row.resnum);
    const adjuntoCategoria = getAdjuntoCategoria(accext);
    const adjuntoAccionLabel = getAdjuntoAccionLabel(accext);
    const tieneAdjuntoVisible =
      tieneAdjunto && Boolean(accext) && isAdjuntoSoportado(accext);

    map.get(cedula).push({
      accnum: toNumberOrNull(row.accnum),
      cedula,
      fecha: formatFechaISO(row.acccuando),
      fechaTexto: formatFechaAccionTexto(row.acccuando),
      asenum: cleanText(row.asenum),
      asesorNombreCompleto,
      resnum,
      resnom: cleanText(row.resnom) || "Sin resultado",
      restipo: toNumberOrNull(row.restipo),
      estado: buildEstadoAccion(row.restipo),
      observacion: buildObservacion(row),
      accext,
      tieneAdjunto,
      tieneAdjuntoVisible,
      adjuntoCategoria,
      adjuntoAccionLabel,
    });
  }

  return map;
}

async function fetchSnapshotRowsFromDb() {
  const pool = await getPool();
  const request = pool.request();
  request.timeout = 120000;

  const query = `
    ;WITH AsignacionesActivas AS (
      SELECT
        asi.asenum,
        asi.perci,
        asi.asidetalle
      FROM dbo.ASGINACIONESCI asi WITH (NOLOCK)
      WHERE asi.asires < 90
        AND EXISTS (
          SELECT 1
          FROM dbo.ASGINACIONES a WITH (NOLOCK)
          WHERE a.asinum = asi.asinum
            AND a.asihasta > GETDATE()
        )
      GROUP BY asi.asenum, asi.perci, asi.asidetalle
    ),
    BasePersonas AS (
      SELECT
        p.perci AS cedula,
        p.perprinom AS primer_nombre,
        p.persegnom AS segundo_nombre,
        p.perpriape AS primer_apellido,
        p.persegape AS segundo_apellido,
        p.perfecnac AS fecha_nac,
        p.perley AS perley,
        p.persexo AS persexo,
        CASE
          WHEN YEAR(p.perfecnac) > 1900
            THEN FLOOR((CAST(GETDATE() AS float) - CAST(p.perfecnac AS float)) / 365.25)
          ELSE 0
        END AS edad,
        p.perdepto AS departamento,
        p.perpostal AS cp,
        p.perciudad AS ciudad,
        p.pertel AS telefono,
        p.percel AS celular,
        p.percalle AS calle,
        p.perpuerta AS nro_puerta,
        TRY_CAST(p.percorx AS decimal(10,6)) AS latitud,
        TRY_CAST(p.percory AS decimal(10,6)) AS longitud,
        aa.asenum AS asesor_app,
        aa.asidetalle
      FROM dbo.PERSONA p WITH (NOLOCK)
      INNER JOIN AsignacionesActivas aa
        ON aa.perci = p.perci
       AND aa.asenum > 0
      WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.ULTIMAACCION uf WITH (NOLOCK)
        WHERE uf.perci = p.perci
          AND uf.tipo = 'finalizado'
      )
    ),
    AccionesEvaluadas AS (
      SELECT
        a.perci,
        a.accnum,
        a.acccuando,
        a.accobs,
        a.asenum,
        a.resnum,
        r.resnom,
        r.restipo,
        CASE
          WHEN a.resnum = 38
            AND NOT EXISTS (
              SELECT 1
              FROM dbo.ACCIONES x WITH (NOLOCK)
              WHERE x.perci = a.perci
                AND x.acccuando > a.acccuando
                AND x.resnum NOT IN (25, 36, 38, 40, 41, 42, 43, 44)
            ) THEN 1
          WHEN EXISTS (
            SELECT 1
            FROM dbo.ACCIONES x WITH (NOLOCK)
            WHERE x.perci = a.perci
              AND x.resnum NOT IN (25, 36, 38, 40, 41, 42, 43, 44)
          ) THEN 2
          ELSE 3
        END AS prioridad
      FROM dbo.ACCIONES a WITH (NOLOCK)
      INNER JOIN dbo.RESULTADOS r WITH (NOLOCK)
        ON r.resnum = a.resnum
      WHERE a.acccuando >= '2023-01-01'
    ),
    AccionesPriorizadas AS (
      SELECT
        ae.*,
        ROW_NUMBER() OVER (
          PARTITION BY ae.perci
          ORDER BY ae.prioridad, ae.acccuando DESC
        ) AS rn
      FROM AccionesEvaluadas ae
      INNER JOIN BasePersonas bp
        ON bp.cedula = ae.perci
    ),
    UltimaAccion AS (
      SELECT
        perci,
        accnum,
        acccuando AS ultima_accion_fecha,
        resnom AS ultima_accion_resnom,
        restipo AS ultima_accion_restipo,
        asenum AS ultima_accion_asesor,
        CASE
          WHEN restipo = 1 THEN 'Finalizado'
          ELSE 'Pendiente'
        END AS tipo
      FROM AccionesPriorizadas
      WHERE rn = 1
    ),
    DataFinal AS (
      SELECT
        bp.cedula,
        bp.primer_nombre,
        bp.segundo_nombre,
        bp.primer_apellido,
        bp.segundo_apellido,
        bp.fecha_nac,
        bp.perley,
        bp.persexo,
        bp.edad,
        bp.departamento,
        bp.cp,
        bp.ciudad,
        bp.telefono,
        bp.celular,
        bp.calle,
        bp.nro_puerta,
        bp.latitud,
        bp.longitud,
        bp.asesor_app,
        bp.asidetalle,
        ua.ultima_accion_fecha,
        ua.ultima_accion_resnom,
        ua.ultima_accion_restipo,
        ua.ultima_accion_asesor,
        de.tipo_documento AS tipo_documento_extranjero,
        de.id_pais AS id_pais_extranjero,
        de.documento AS documento_extranjero,
        pb.nombre AS pais_extranjero
      FROM BasePersonas bp
      LEFT JOIN UltimaAccion ua
        ON ua.perci = bp.cedula
      LEFT JOIN dbo.DOCUMENTO_EXTRANJERO de WITH (NOLOCK)
        ON TRY_CAST(de.ci_ficticia AS bigint) = TRY_CAST(bp.cedula AS bigint)
      LEFT JOIN dbo.PAISES_BPS pb WITH (NOLOCK)
        ON pb.idpais = de.id_pais
    )
    SELECT
      d.cedula,
      d.primer_nombre,
      d.segundo_nombre,
      d.primer_apellido,
      d.segundo_apellido,
      d.fecha_nac,
      d.perley,
      d.persexo,
      d.edad,
      d.departamento,
      d.cp,
      d.ciudad,
      d.telefono,
      d.celular,
      d.calle,
      d.nro_puerta,
      d.latitud,
      d.longitud,
      d.asesor_app,
      d.asidetalle,
      d.ultima_accion_fecha,
      d.ultima_accion_resnom,
      d.ultima_accion_restipo,
      d.ultima_accion_asesor,
      d.tipo_documento_extranjero,
      d.id_pais_extranjero,
      d.documento_extranjero,
      d.pais_extranjero,
      aa2.nombre AS asesor_nombre,
      aa2.apellido AS asesor_apellido,
      LTRIM(RTRIM(
        CONCAT(
          ISNULL(aa2.nombre, ''),
          CASE
            WHEN ISNULL(aa2.nombre, '') <> '' AND ISNULL(aa2.apellido, '') <> '' THEN ' '
            ELSE ''
          END,
          ISNULL(aa2.apellido, '')
        )
      )) AS asesor_nombre_completo,
      CASE
        WHEN aof_ext.regimen IS NOT NULL THEN 1
        WHEN aof_nat.regimen IS NOT NULL THEN 1
        ELSE 0
      END AS asignado_oficio,
      CASE
        WHEN aof_ext.regimen IS NOT NULL THEN aof_ext.regimen
        WHEN aof_nat.regimen IS NOT NULL THEN aof_nat.regimen
        ELSE NULL
      END AS regimen
    FROM DataFinal d
    LEFT JOIN [2023_AFAP_Gestion].[dbo].[ASESORES_ACTUALES] aa2 WITH (NOLOCK)
      ON TRY_CAST(aa2.numeroAsesor AS int) = TRY_CAST(d.ultima_accion_asesor AS int)
    OUTER APPLY (
      SELECT TOP 1
        ao.regimen
      FROM dbo.ASIGNACIONES_OFICIOS ao WITH (NOLOCK)
      WHERE TRY_CAST(ao.documento AS bigint) = TRY_CAST(d.cedula AS bigint)
        AND TRY_CAST(ao.id_pais AS int) = 1
    ) aof_nat
    OUTER APPLY (
      SELECT TOP 1
        ao.regimen
      FROM dbo.ASIGNACIONES_OFICIOS ao WITH (NOLOCK)
      WHERE d.documento_extranjero IS NOT NULL
        AND d.id_pais_extranjero IS NOT NULL
        AND LTRIM(RTRIM(CAST(ao.documento AS varchar(100)))) =
            LTRIM(RTRIM(CAST(d.documento_extranjero AS varchar(100))))
        AND TRY_CAST(ao.id_pais AS int) = TRY_CAST(d.id_pais_extranjero AS int)
    ) aof_ext
    ORDER BY
      TRY_CAST(d.asesor_app AS int) ASC,
      CASE WHEN d.ultima_accion_fecha IS NULL THEN 1 ELSE 0 END ASC,
      d.ultima_accion_fecha DESC,
      TRY_CAST(d.cedula AS bigint) ASC;
  `;

  const startedAt = Date.now();
  const result = await request.query(query);
  const elapsedMs = Date.now() - startedAt;

  console.log(
    `[snapshot] query ok | rows=${result.recordset?.length || 0} | ms=${elapsedMs}`
  );

  return Array.isArray(result.recordset) ? result.recordset : [];
}

async function fetchAccionesRowsFromDb() {
  const pool = await getPool();
  const request = pool.request();
  request.timeout = 120000;

  const query = `
    SELECT
      a.accnum,
      a.perci,
      a.acccuando,
      a.asenum,
      a.resnum,
      a.accobs,
      a.accobs2,
      a.acctelnvo,
      a.accdirnvo,
      a.accext,
      CASE
        WHEN a.accadjunto IS NOT NULL THEN 1
        ELSE 0
      END AS tiene_adjunto,
      r.resnom,
      r.restipo,
      aa.nombre AS asesor_nombre,
      aa.apellido AS asesor_apellido,
      LTRIM(RTRIM(
        CONCAT(
          ISNULL(aa.nombre, ''),
          CASE
            WHEN ISNULL(aa.nombre, '') <> '' AND ISNULL(aa.apellido, '') <> '' THEN ' '
            ELSE ''
          END,
          ISNULL(aa.apellido, '')
        )
      )) AS asesor_nombre_completo
    FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] a WITH (NOLOCK)
    LEFT JOIN [2023_AFAP_Gestion].[dbo].[RESULTADOS] r WITH (NOLOCK)
      ON a.resnum = r.resnum
    LEFT JOIN [2023_AFAP_Gestion].[dbo].[ASESORES_ACTUALES] aa WITH (NOLOCK)
      ON TRY_CAST(aa.numeroAsesor AS int) = TRY_CAST(a.asenum AS int)
    WHERE a.acccuando >= '2018-01-01'
    ORDER BY a.perci ASC, a.acccuando DESC, a.accnum DESC
  `;

  const startedAt = Date.now();
  const result = await request.query(query);
  const elapsedMs = Date.now() - startedAt;

  console.log(
    `[snapshot] acciones query ok | rows=${result.recordset?.length || 0} | ms=${elapsedMs}`
  );

  return Array.isArray(result.recordset) ? result.recordset : [];
}

async function fetchSmsRowsFromDb() {
  const pool = await getPool();
  const request = pool.request();
  request.timeout = 120000;

  const query = `
    ;WITH UltimoSms AS (
      SELECT
        p.perci AS cedula,
        s.smscuando AS fecha_consulta,
        c.coddes AS resultado,
        ROW_NUMBER() OVER (
          PARTITION BY p.perci
          ORDER BY s.smscuando DESC
        ) AS rn
      FROM dbo.PERSONA p WITH (NOLOCK)
      INNER JOIN SOLOACTIVIDAD.dbo.SMSENTRADALEVEL1 s WITH (NOLOCK)
        ON p.perci = s.smscedula
      INNER JOIN SOLOACTIVIDAD.dbo.CODIGOSRESPUESTA c WITH (NOLOCK)
        ON s.smsresultado = c.codnum
      WHERE p.perafap = ''
        AND p.perciudad <> ''
        AND s.smscuando >= '2022-01-01'
    )
    SELECT
      cedula,
      fecha_consulta,
      resultado
    FROM UltimoSms
    WHERE rn = 1
    ORDER BY TRY_CAST(cedula AS bigint) ASC
  `;

  const startedAt = Date.now();
  const result = await request.query(query);
  const elapsedMs = Date.now() - startedAt;

  console.log(
    `[snapshot] sms query ok | rows=${result.recordset?.length || 0} | ms=${elapsedMs}`
  );

  return Array.isArray(result.recordset) ? result.recordset : [];
}

async function buildFreshSnapshot() {
  const [rows, accionesRows, smsRows] = await Promise.all([
    fetchSnapshotRowsFromDb(),
    fetchAccionesRowsFromDb(),
    fetchSmsRowsFromDb(),
  ]);

  const accionesByDocumento = buildAccionesIndex(accionesRows);
  const smsByDocumento = buildSmsIndex(smsRows);

  const items = rows.map((row) => {
    const cedula = cleanText(row.cedula);
    const smsItem = smsByDocumento.get(cedula) || null;
    return mapDbRowToSnapshotItem(row, smsItem);
  });

  const itemsByAsesor = buildSnapshotIndex(items);

  return {
    builtAt: new Date(),
    totalItems: items.length,
    totalAsesores: itemsByAsesor.size,
    globalItems: items,
    itemsByAsesor,
    accionesByDocumento,
    smsByDocumento,
  };
}

async function refreshSnapshot(options = {}) {
  const { reason = "manual" } = options;

  if (snapshotState.isRefreshing && activeRefreshPromise) {
    return activeRefreshPromise;
  }

  snapshotState.isRefreshing = true;
  snapshotState.lastStartedAt = new Date();
  snapshotState.lastError = null;

  activeRefreshPromise = (async () => {
    try {
      const fresh = await buildFreshSnapshot();

      snapshotState = {
        ...snapshotState,
        isReady: true,
        isRefreshing: false,
        lastCompletedAt: fresh.builtAt,
        lastError: null,
        totalItems: fresh.totalItems,
        totalAsesores: fresh.totalAsesores,
        version: snapshotState.version + 1,
        globalItems: fresh.globalItems,
        itemsByAsesor: fresh.itemsByAsesor,
        accionesByDocumento: fresh.accionesByDocumento,
        smsByDocumento: fresh.smsByDocumento,
      };

      console.log(
        `[snapshot] refresh ok | reason=${reason} | version=${snapshotState.version} | items=${snapshotState.totalItems} | asesores=${snapshotState.totalAsesores}`
      );

      return snapshotState;
    } catch (error) {
      snapshotState = {
        ...snapshotState,
        isRefreshing: false,
        lastError: error?.message || String(error),
      };

      console.error(
        `[snapshot] refresh error | reason=${reason} | message=${snapshotState.lastError}`
      );

      throw error;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

async function ensureSnapshotReady() {
  if (snapshotState.isReady) return snapshotState;
  return refreshSnapshot({ reason: "initial-load" });
}

async function refreshAccionesForDocumento(cedula) {
  const pool = await getPool();
  const request = pool.request();

  request.input("cedula", cedula);

  const query = `
    SELECT
      a.accnum,
      a.perci,
      a.acccuando,
      a.asenum,
      a.resnum,
      a.accobs,
      a.accobs2,
      a.acctelnvo,
      a.accdirnvo,
      a.accext,
      CASE
        WHEN a.accadjunto IS NOT NULL THEN 1
        ELSE 0
      END AS tiene_adjunto,
      r.resnom,
      r.restipo,
      aa.nombre AS asesor_nombre,
      aa.apellido AS asesor_apellido,
      LTRIM(RTRIM(
        CONCAT(
          ISNULL(aa.nombre, ''),
          CASE
            WHEN ISNULL(aa.nombre, '') <> '' AND ISNULL(aa.apellido, '') <> '' THEN ' '
            ELSE ''
          END,
          ISNULL(aa.apellido, '')
        )
      )) AS asesor_nombre_completo
    FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] a
    LEFT JOIN [2023_AFAP_Gestion].[dbo].[RESULTADOS] r
      ON a.resnum = r.resnum
    LEFT JOIN [2023_AFAP_Gestion].[dbo].[ASESORES_ACTUALES] aa
      ON TRY_CAST(aa.numeroAsesor AS int) = TRY_CAST(a.asenum AS int)
    WHERE a.perci = @cedula
    ORDER BY a.acccuando DESC, a.accnum DESC
  `;

  const result = await request.query(query);

  const rows = Array.isArray(result.recordset) ? result.recordset : [];
  const accionesMap = buildAccionesIndex(rows);
  const safeCedula = String(cedula).trim();
  const nuevasAcciones = accionesMap.get(safeCedula) || [];

  snapshotState.accionesByDocumento.set(safeCedula, nuevasAcciones);

  return nuevasAcciones;
}

function getSnapshotStatus() {
  return {
    isReady: snapshotState.isReady,
    isRefreshing: snapshotState.isRefreshing,
    lastStartedAt: snapshotState.lastStartedAt,
    lastCompletedAt: snapshotState.lastCompletedAt,
    lastError: snapshotState.lastError,
    totalItems: snapshotState.totalItems,
    totalAsesores: snapshotState.totalAsesores,
    version: snapshotState.version,
    refreshMs: SNAPSHOT_REFRESH_MS,
  };
}

function getItemsByAsesor(asesor) {
  const safeAsesor = cleanText(asesor);
  if (!safeAsesor) return [];
  return snapshotState.itemsByAsesor.get(safeAsesor) || [];
}

function getAccionesByDocumento(cedula) {
  const safeCedula = cleanText(cedula);
  if (!safeCedula) return [];
  return snapshotState.accionesByDocumento.get(safeCedula) || [];
}

function getSmsByDocumento(cedula) {
  const safeCedula = cleanText(cedula);
  if (!safeCedula) return null;
  return snapshotState.smsByDocumento.get(safeCedula) || null;
}

async function getPersonasPage({ asesor, page = 1, pageSize = MAX_PAGE_SIZE }) {
  await ensureSnapshotReady();

  const safeAsesor = cleanText(asesor);
  if (!safeAsesor) {
    throw new Error("El parámetro 'asesor' es obligatorio");
  }

  const currentPage = safePage(page);
  const currentPageSize = safePageSize(pageSize);

  const asesorItems = getItemsByAsesor(safeAsesor);
  const total = asesorItems.length;
  const totalPages = total > 0 ? Math.ceil(total / currentPageSize) : 0;

  const normalizedPage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const start = (normalizedPage - 1) * currentPageSize;
  const end = start + currentPageSize;

  return {
    items: asesorItems.slice(start, end),
    total,
    page: normalizedPage,
    page_size: currentPageSize,
    total_pages: totalPages,
    snapshot_version: snapshotState.version,
    snapshot_last_completed_at: snapshotState.lastCompletedAt,
    snapshot_is_refreshing: snapshotState.isRefreshing,
  };
}

async function getAccionPdfAdjunto(accnum) {
  const accnumNum = Number(accnum);

  if (!Number.isFinite(accnumNum)) {
    const error = new Error("El parámetro 'accnum' es inválido");
    error.statusCode = 400;
    throw error;
  }

  const pool = await getPool();
  const request = pool.request();
  request.input("accnum", accnumNum);

  const query = `
    SELECT
      a.accnum,
      a.perci,
      a.accext,
      a.accadjunto
    FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] a
    WHERE a.accnum = @accnum
      AND a.accadjunto IS NOT NULL
      AND LOWER(LTRIM(RTRIM(ISNULL(a.accext, '')))) IN (
        'pdf', 'jpg', 'jpeg', 'png', 'heif', 'heic',
        'mp3', 'wav', 'ogg', 'amr',
        'mp4', 'mpeg'
      )
  `;

  const result = await request.query(query);
  const row = Array.isArray(result.recordset) ? result.recordset[0] : null;

  if (!row) {
    const error = new Error("La acción no tiene un adjunto compatible disponible");
    error.statusCode = 404;
    throw error;
  }

  const ext = normalizeAdjuntoExt(row.accext);
  const rawAdjunto = row.accadjunto;

  let buffer = null;

  if (Buffer.isBuffer(rawAdjunto)) {
    buffer = rawAdjunto;
  } else {
    const hex = String(rawAdjunto).replace(/^0x/i, "").trim();

    if (!hex) {
      const error = new Error("El adjunto está vacío");
      error.statusCode = 404;
      throw error;
    }

    buffer = Buffer.from(hex, "hex");
  }

  if (!buffer || !buffer.length) {
    const error = new Error("No se pudo construir el adjunto");
    error.statusCode = 500;
    throw error;
  }

  const categoria = getAdjuntoCategoria(ext);
  const filenameBase = `adjunto_${row.perci || accnumNum}`;
  const filename = ext ? `${filenameBase}.${ext}` : filenameBase;

  return {
    filename,
    mimeType: getAdjuntoMimeType(ext),
    disposition: isAdjuntoInline(ext) ? "inline" : "attachment",
    categoria,
    ext,
    buffer,
  };
}

function startAutoRefresh(intervalMs = SNAPSHOT_REFRESH_MS) {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    refreshSnapshot({ reason: "interval" }).catch((err) => {
      console.error("[snapshot] interval refresh failed:", err?.message || err);
    });
  }, intervalMs);

  return refreshTimer;
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

module.exports = {
  SNAPSHOT_REFRESH_MS,
  refreshSnapshot,
  ensureSnapshotReady,
  getSnapshotStatus,
  getItemsByAsesor,
  getAccionesByDocumento,
  getSmsByDocumento,
  refreshAccionesForDocumento,
  getAccionPdfAdjunto,
  getPersonasPage,
  startAutoRefresh,
  stopAutoRefresh,
};