const sql = require("mssql");
const { getPool } = require("../config/database");

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function truncateText(value, maxLength) {
  const text = cleanText(value);
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function optionalText(value, maxLength) {
  const text = truncateText(value, maxLength);
  if (!text) return "";
  const upper = normalizeText(text);
  if (upper === "SELECCIONAR" || upper === "SIN SELECCION" || upper === "SIN SELECCIONAR") return "";
  return text;
}

function normalizeText(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function safePeriodoDias(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 30;
  if (n <= 0) return 30;
  return Math.min(Math.floor(n), 365);
}

function parseIntOrNull(value) {
  const text = cleanText(value).replace(/\D/g, "");
  if (!text) return null;
  const n = Number(text);
  if (!Number.isInteger(n)) return null;
  if (n > 2147483647) return null;
  return n;
}

function parseSmallIntOrNull(value) {
  const n = parseIntOrNull(value);
  if (n === null) return null;
  if (n < -32768 || n > 32767) return null;
  return n;
}

function parseDecimalOrNull(value) {
  const text = cleanText(value).replace(/,/g, ".");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function distanciaToFlag(value) {
  const text = normalizeText(value);
  return text.includes("+100") ? 1 : 0;
}

function parseMoneyOrNull(value) {
  const text = cleanText(value).replace(/\./g, "").replace(/,/g, ".");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function parseDateOrNull(value) {
  const text = cleanText(value);
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T00:00:00`);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [dd, mm, yyyy] = text.split("/");
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  }

  return null;
}

function dateToInput(rowValue) {
  if (!rowValue) return "";

  if (typeof rowValue === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(rowValue)) {
    const [dd, mm, yyyy] = rowValue.split("/");
    const year = Number(yyyy);
    if (!Number.isFinite(year) || year < 1900) return "";
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(rowValue);
  if (Number.isNaN(d.getTime())) return "";
  if (d.getFullYear() < 1900) return "";
  return d.toISOString().slice(0, 10);
}

function base64ToBuffer(value) {
  const text = cleanText(value);
  if (!text) return null;

  const commaIndex = text.indexOf(",");
  const base64 = commaIndex >= 0 ? text.slice(commaIndex + 1) : text;

  try {
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

function bufferToDataUrl(value) {
  if (!value) return "";
  if (Buffer.isBuffer(value)) return `data:image/jpeg;base64,${value.toString("base64")}`;
  return "";
}

function buildStatusFilter(estatus) {
  const value = normalizeText(estatus);

  if (!value || value === "TODOS") return "";

  if (value === "ACTIVOS") {
    return `
      AND UPPER(LTRIM(RTRIM(COALESCE(u.foraccion, '')))) = 'OK'
    `;
  }

  if (value === "EN PROCESO") {
    return `
      AND (
        (
          u.forcuando IS NULL
          AND u.foraccion IS NULL
          AND COALESCE(de.fordetalle, u.fordetalle) IS NULL
        )
        OR (
          UPPER(LTRIM(RTRIM(COALESCE(de.fordetalle, u.fordetalle, '')))) NOT LIKE '%SIN ACTIVIDAD%'
          AND UPPER(LTRIM(RTRIM(COALESCE(u.foraccion, '')))) <> 'OK'
          AND NOT (
            UPPER(LTRIM(RTRIM(COALESCE(u.foraccion, '')))) = 'REC'
            AND UPPER(LTRIM(RTRIM(COALESCE(de.fordetalle, u.fordetalle, '')))) LIKE '%ANULAR%'
          )
          AND UPPER(LTRIM(RTRIM(COALESCE(u.foraccion, '')))) <> 'REC'
        )
      )
    `;
  }

  if (value === "INACTIVOS") {
    return `
      AND (
        UPPER(LTRIM(RTRIM(COALESCE(de.fordetalle, u.fordetalle, '')))) LIKE '%SIN ACTIVIDAD%'
        OR UPPER(LTRIM(RTRIM(COALESCE(u.foraccion, '')))) = 'REC'
      )
    `;
  }

  return "";
}


function sameNormalizedText(a, b) {
  return normalizeText(a) === normalizeText(b);
}

function apkFormularioColor(forestado) {
  const estado = Number(forestado);
  switch (estado) {
    case 2:
      return { estadoColor: "#e8eaf6", estadoBorde: "", estadoFiltro: "En Proceso" };
    case 3:
      return { estadoColor: "#c8e6c9", estadoBorde: "", estadoFiltro: "Inactivos" };
    case 4:
    case 5:
      return { estadoColor: "#d32f2f", estadoBorde: "", estadoFiltro: "Inactivos" };
    case 6:
      return { estadoColor: "#303f9f", estadoBorde: "", estadoFiltro: "Inactivos" };
    case 7:
      return { estadoColor: "#43a047", estadoBorde: "", estadoFiltro: "Inactivos" };
    case 8:
    case 9:
    case 10:
    case 11:
      return { estadoColor: "#ffa000", estadoBorde: "", estadoFiltro: "En Proceso" };
    case 12:
      return { estadoColor: "#000000", estadoBorde: "", estadoFiltro: "Inactivos" };
    default:
      return { estadoColor: "#ffffff", estadoBorde: "#000000", estadoFiltro: "En Proceso" };
  }
}

function buildEstadoDetalle(row) {
  const forrechnum = Number(row.forrechnum || 0);
  const rechnom = cleanText(row.rechnom);
  const fordetalle = cleanText(row.fordetalle_accion);
  const detalles = [];

  if (forrechnum > 0 && rechnom) {
    detalles.push(rechnom);
  }

  if (fordetalle && !detalles.some((item) => sameNormalizedText(item, fordetalle))) {
    detalles.push(fordetalle);
  }

  if (Number(row.forpec || 0) === 1 && cleanText(row.forpecobs)) {
    const pec = `PIERDE PEC ${cleanText(row.forpecobs)}`;
    if (!detalles.some((item) => sameNormalizedText(item, pec))) detalles.push(pec);
  }

  return detalles.join("\n");
}

function buildFormularioListItem(row) {
  const accion = cleanText(row.foraccion);
  const visual = apkFormularioColor(row.forestado);
  const pendiente = Number(row.forestado) === 1 && !accion;
  const forauto = Number(row.forauto || 0);
  const proyectoVisible = cleanText(row.forproyase) || cleanText(row.forproy);
  const estadoTexto = pendiente ? "Pendiente" : accion;
  const estadoDetalle = buildEstadoDetalle(row);

  return {
    fornum: row.fornum != null ? String(row.fornum).trim() : "",
    forcuando: row.forcuando || null,
    foraccion: accion,
    forquien_env: cleanText(row.forquien_env),
    forpromoto: cleanText(row.forpromoto),
    fordetalle: cleanText(row.fordetalle),
    forrechnum: row.forrechnum != null ? String(row.forrechnum).trim() : "",
    rechnom: cleanText(row.rechnom),
    rechdev: row.rechdev != null ? Number(row.rechdev) : null,
    fordias: row.fordias != null ? Number(row.fordias) : 0,
    forpec: row.forpec != null ? Number(row.forpec) : 0,
    forpecobs: cleanText(row.forpecobs),
    forvisto: row.forvisto || null,
    forestado: row.forestado != null ? Number(row.forestado) : null,
    forauto,
    forproy: row.forproy != null ? String(row.forproy).trim() : "",
    forproyase: row.forproyase != null ? String(row.forproyase).trim() : "",
    estadoTexto,
    estadoDetalle,
    estadoColor: visual.estadoColor,
    estadoBorde: visual.estadoBorde,
    estadoFiltro: pendiente ? "En Proceso" : visual.estadoFiltro,
    permiteEditar: Number(row.forestado) === 4 || Number(row.forestado) === 5,
    permiteAnular: [1, 4, 5, 8, 9, 10, 11].includes(Number(row.forestado)),
    proyectoTexto: proyectoVisible ? `Proy.${proyectoVisible} ${forauto === 1 ? ">100km" : "<100km"}` : "",
    asesorTexto: cleanText(row.forquien_env) ? `Asesor: ${cleanText(row.forquien_env)}` : "",
  };
}

function firstUsefulText(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text && normalizeText(text) !== "0") return text;
  }
  return "";
}

function firstUsefulDate(...values) {
  for (const value of values) {
    const input = dateToInput(value);
    if (input) return input;
  }
  return "";
}

function validarAsesor(asenum) {
  const asesor = parseIntOrNull(asenum);
  if (!asesor) {
    const error = new Error("Asesor autenticado no válido");
    error.statusCode = 400;
    throw error;
  }
  return asesor;
}

function validarFormularioNumero(value) {
  const fornum = parseIntOrNull(value);
  if (!fornum) {
    const error = new Error("Número de formulario no válido");
    error.statusCode = 400;
    throw error;
  }
  return fornum;
}

async function getFormulariosByAsesor({ asenum, periodoDias = 30, estatus = "Todos" }) {
  const asesor = validarAsesor(asenum);
  const dias = safePeriodoDias(periodoDias);
  const pool = await getPool();

  const query = `
    WITH PeriodoActual AS (
      SELECT TOP 1 c.[ciefec], c.[ciehas]
      FROM [afapformularios].[dbo].[CIERRES] c WITH (NOLOCK)
      WHERE c.[ciefec] <= CAST(GETDATE() AS date)
        AND c.[ciefec] >= '2026-01-01'
      ORDER BY c.[ciefec] DESC
    ),
    FormulariosBase AS (
      SELECT f.[fornum]
      FROM [afapformularios].[dbo].[FORMULAR] f WITH (NOLOCK)
      CROSS JOIN PeriodoActual p
      OUTER APPLY (
        SELECT TOP 1 f1.[forcuando]
        FROM [afapformularios].[dbo].[FORMULA1] f1 WITH (NOLOCK)
        WHERE f1.[fornum] = f.[fornum]
        ORDER BY f1.[forcuando] DESC
      ) ult
      WHERE f.[forpromoto] = @asenum
        AND YEAR(f.[forentrega]) > YEAR(GETDATE()) - 2
        AND (
          f.[forestado] IN (1,2,3,4,5,6,8,9,10,11)
          OR ult.[forcuando] > p.[ciefec]
        )
    ),
    UltimaAccion AS (
      SELECT
            f1.[fornum]
          , f1.[forcuando]
          , LTRIM(RTRIM(f1.[foraccion])) AS [foraccion]
          , LTRIM(RTRIM(f1.[fordetalle])) AS [fordetalle]
          , f1.[forrechnum]
          , r.[rechnom]
          , r.[rechdev]
          , f1.[fordias]
          , f1.[forpec]
          , LTRIM(RTRIM(f1.[forpecobs])) AS [forpecobs]
          , f1.[forvisto]
          , ROW_NUMBER() OVER (PARTITION BY f1.[fornum] ORDER BY f1.[forcuando] DESC) AS rn
      FROM [afapformularios].[dbo].[FORMULA1] f1 WITH (NOLOCK)
      LEFT JOIN [afapformularios].[dbo].[RECHAZOS] r WITH (NOLOCK)
        ON r.[rechnum] = f1.[forrechnum]
      WHERE f1.[fornum] IN (SELECT [fornum] FROM FormulariosBase)
    ),
    UltimoEnvio AS (
      SELECT
            f1.[fornum]
          , NULLIF(f1.[forquien], 0) AS [forquien_env]
          , ROW_NUMBER() OVER (PARTITION BY f1.[fornum] ORDER BY f1.[forcuando] DESC) AS rn
      FROM [afapformularios].[dbo].[FORMULA1] f1 WITH (NOLOCK)
      WHERE f1.[fornum] IN (SELECT [fornum] FROM FormulariosBase)
        AND LTRIM(RTRIM(f1.[foraccion])) = 'ENV'
        AND NULLIF(f1.[forquien], 0) IS NOT NULL
    )
    SELECT
          f.[fornum]
        , CASE
            WHEN f.[forestado] = 1 THEN f.[forentrega]
            ELSE u.[forcuando]
          END AS [forcuando]
        , CASE
            WHEN COALESCE(f.[forci], 0) > 0 THEN 'CI:' + RTRIM(CAST(f.[forci] AS char))
            ELSE ''
          END AS [fordetalle]
        , COALESCE(u.[foraccion], '') AS [foraccion]
        , COALESCE(u.[fordetalle], '') AS [fordetalle_accion]
        , u.[forrechnum]
        , LTRIM(RTRIM(COALESCE(u.[rechnom], ''))) AS [rechnom]
        , u.[rechdev]
        , COALESCE(u.[fordias], 0) AS [fordias]
        , COALESCE(u.[forpec], 0) AS [forpec]
        , COALESCE(u.[forpecobs], '') AS [forpecobs]
        , u.[forvisto]
        , f.[forestado]
        , COALESCE(f.[forauto], 0) AS [forauto]
        , COALESCE(f.[forproy], 0) AS [forproy]
        , COALESCE(pa.[asenum], 0) AS [forproyase]
        , f.[forpromoto] AS [forpromoto]
        , COALESCE(ue.[forquien_env], NULLIF(f.[forase], 0), f.[forpromoto]) AS [forquien_env]
    FROM FormulariosBase fb
    INNER JOIN [afapformularios].[dbo].[FORMULAR] f WITH (NOLOCK)
      ON f.[fornum] = fb.[fornum]
    LEFT JOIN UltimaAccion u
      ON u.[fornum] = f.[fornum]
     AND u.rn = 1
    LEFT JOIN UltimoEnvio ue
      ON ue.[fornum] = f.[fornum]
     AND ue.rn = 1
    LEFT JOIN [Avisos].[dbo].[ProyAnual] pa WITH (NOLOCK)
      ON pa.[ProyAnualInt] = f.[forproy]
    WHERE f.[forpromoto] = @asenum
      AND (
        u.[forcuando] IS NULL
        OR u.[forcuando] >= DATEADD(DAY, -@periodoDias, CAST(GETDATE() AS date))
        OR f.[forestado] = 1
      )
    ORDER BY
      CASE WHEN u.[forcuando] IS NULL THEN 0 ELSE 1 END,
      u.[forcuando] DESC,
      f.[fornum] DESC;
  `;

  const result = await pool
    .request()
    .input("asenum", sql.Int, asesor)
    .input("periodoDias", sql.Int, dias)
    .query(query);

  let items = (result.recordset || []).map(buildFormularioListItem);

  const filtro = normalizeText(estatus);
  if (filtro && filtro !== "TODOS") {
    items = items.filter((item) => {
      const estadoFiltro = normalizeText(item.estadoFiltro);
      const accion = normalizeText(item.estadoTexto);
      if (filtro === "ACTIVOS") return accion === "OK" || accion === "BPS";
      if (filtro === "INACTIVOS") return estadoFiltro === "INACTIVOS";
      if (filtro === "EN PROCESO") return estadoFiltro === "EN PROCESO";
      return true;
    });
  }

  return {
    asesor: String(asesor),
    periodo_dias: dias,
    estatus: cleanText(estatus) || "Todos",
    total: items.length,
    items,
  };
}

async function getFormulariosPendientesByAsesor({ asenum }) {
  const asesor = validarAsesor(asenum);
  const pool = await getPool();

  const result = await pool
    .request()
    .input("asenum", sql.Int, asesor)
    .query(`
      SELECT
            [fornum]
          , [forpromoto]
          , [forestado]
          , [forproy]
          , [fordonde]
      FROM [afapformularios].[dbo].[FORMULAR]
      WHERE [forpromoto] = @asenum
        AND [forestado] IN (1, 8, 9, 10, 11)
      ORDER BY [fornum] DESC;
    `);

  const items = (result.recordset || []).map((row) => ({
    fornum: row.fornum != null ? String(row.fornum).trim() : "",
    forpromoto: row.forpromoto != null ? String(row.forpromoto).trim() : "",
    forestado: row.forestado != null ? Number(row.forestado) : null,
    forproy: row.forproy != null ? String(row.forproy).trim() : "",
    fordonde: cleanText(row.fordonde),
  }));

  return {
    asesor: String(asesor),
    total: items.length,
    items,
  };
}

async function getProyectosFormulario({ asenum, fecha }) {
  const asesor = validarAsesor(asenum);
  const fechaProyecto = parseDateOrNull(fecha) || new Date();
  const pool = await getPool();

  const result = await pool
    .request()
    .input("fecha", sql.Date, fechaProyecto)
    .input("asenum", sql.Int, asesor)
    .query(`
      WITH PeriodoLiquidacion AS (
        SELECT TOP 1
              CAST(c.[ciefec] AS date) AS [PeriodoDesde]
            , CAST(c.[ciehas] AS date) AS [PeriodoHasta]
        FROM [afapformularios].[dbo].[CIERRES] c WITH (NOLOCK)
        WHERE @fecha BETWEEN CAST(c.[ciefec] AS date)
                         AND CAST(c.[ciehas] AS date)
        ORDER BY c.[ciefec] DESC, c.[ciehas] DESC
      ),
      ProyectosPeriodo AS (
        SELECT
              PA.[ProyAnualInt] AS [ProyectoId]
            , PA.[asenum]
            , LTRIM(RTRIM(PA.[ProyAnualTipo])) AS [ProyAnualTipo]
            , LTRIM(RTRIM(PA.[ProyAnualMatriculas])) AS [ProyectoMatricula]
            , CONCAT(
                PA.[asenum],
                '-',
                LTRIM(RTRIM(SUBSTRING(PA.[ProyAnualTipo], 1, 3))),
                '-',
                LTRIM(RTRIM(PA.[ProyAnualMatriculas]))
              ) AS [ProyectoNombre]
            , 'S' AS [ProyectoEstado]
            , CASE WHEN LTRIM(RTRIM(PA.[ProyAnualTipo])) = 'ALQUILER' THEN 1 ELSE 0 END AS [ProyAlquiler]
            , PA.[ProyAnualHasta]
            , PA.[ProyAnualDesde]
            , PL.[PeriodoDesde]
            , PL.[PeriodoHasta]
            , ROW_NUMBER() OVER (
                PARTITION BY
                  PA.[asenum],
                  LTRIM(RTRIM(PA.[ProyAnualTipo])),
                  LTRIM(RTRIM(PA.[ProyAnualMatriculas])),
                  CAST(PA.[ProyAnualDesde] AS date),
                  CAST(PA.[ProyAnualHasta] AS date)
                ORDER BY PA.[ProyAnualInt] DESC
              ) AS rn
        FROM [Avisos].[dbo].[ProyAnual] PA WITH (NOLOCK)
        CROSS JOIN PeriodoLiquidacion PL
        WHERE PA.[asenum] = @asenum
          AND CAST(PA.[ProyAnualDesde] AS date) >= PL.[PeriodoDesde]
          AND CAST(PA.[ProyAnualHasta] AS date) <= PL.[PeriodoHasta]
      )
      SELECT
            PP.[ProyectoId]
          , PP.[asenum]
          , PP.[ProyectoNombre]
          , PP.[ProyectoMatricula]
          , PP.[ProyectoEstado]
          , PP.[ProyAlquiler]
          , CONVERT(varchar(10), PP.[ProyAnualHasta], 103) AS [ProyectoHasta]
          , CONVERT(varchar(10), PP.[ProyAnualDesde], 103) AS [ProyectoDesde]
          , CONVERT(varchar(10), PP.[PeriodoDesde], 103) AS [PeriodoDesde]
          , CONVERT(varchar(10), PP.[PeriodoHasta], 103) AS [PeriodoHasta]
          , 0 AS [ProyectoFichas]
          , 0 AS [ProyectoImporte]
          , CONVERT(varchar(500), STUFF((
              SELECT ', ' + RTRIM(PD.[ProyAnualDepto])
              FROM [Avisos].[dbo].[ProyAnualDeptos] PD WITH (NOLOCK)
              WHERE PD.[ProyAnualInt] = PP.[ProyectoId]
              FOR XML PATH('')
            ), 1, 1, '')) AS [Deptos]
      FROM ProyectosPeriodo PP
      WHERE PP.rn = 1
      ORDER BY PP.[asenum], PP.[ProyectoId] DESC;
    `);

  const items = (result.recordset || []).map((row) => ({
    ProyectoId: row.ProyectoId != null ? String(row.ProyectoId).trim() : "",
    asenum: row.asenum != null ? String(row.asenum).trim() : "",
    ProyectoNombre: cleanText(row.ProyectoNombre),
    ProyectoMatricula: cleanText(row.ProyectoMatricula),
    ProyectoEstado: cleanText(row.ProyectoEstado),
    ProyAlquiler: row.ProyAlquiler != null ? Number(row.ProyAlquiler) : 0,
    ProyectoHasta: cleanText(row.ProyectoHasta),
    ProyectoDesde: cleanText(row.ProyectoDesde),
    PeriodoDesde: cleanText(row.PeriodoDesde),
    PeriodoHasta: cleanText(row.PeriodoHasta),
    ProyectoFichas: row.ProyectoFichas != null ? Number(row.ProyectoFichas) : 0,
    ProyectoImporte: row.ProyectoImporte != null ? Number(row.ProyectoImporte) : 0,
    Deptos: cleanText(row.Deptos),
  }));

  return {
    fecha: dateToInput(fechaProyecto),
    periodoDesde: items[0]?.PeriodoDesde || "",
    periodoHasta: items[0]?.PeriodoHasta || "",
    total: items.length,
    items,
  };
}

async function verificarFormulario({ asenum, formulario, asesorForm }) {
  const asesor = validarAsesor(asenum);
  const fornum = validarFormularioNumero(formulario);
  const asesor2 = parseIntOrNull(asesorForm) || asesor;
  const pool = await getPool();

  const result = await pool
    .request()
    .input("fornum", sql.Int, fornum)
    .input("asenum", sql.Int, asesor)
    .input("asesor2", sql.Int, asesor2)
    .query(`
      SELECT CASE
        WHEN EXISTS (
          SELECT 1
          FROM [afapformularios].[dbo].[FORMULAR] WITH (NOLOCK)
          WHERE [forpromoto] IN (@asenum, @asesor2)
            AND [forestado] IN (1,4,5,8,9,10,11)
            AND [fornum] = @fornum
        ) THEN 'correcto'
        ELSE 'mal'
      END AS resultado;
    `);

  const resultado = cleanText(result.recordset?.[0]?.resultado) || "mal";
  return { formulario: String(fornum), resultado };
}

async function getFormularioDetalle({ asenum, fornum }) {
  const asesor = validarAsesor(asenum);
  const formulario = validarFormularioNumero(fornum);
  const pool = await getPool();

  const result = await pool
    .request()
    .input("fornum", sql.Int, formulario)
    .input("asenum", sql.Int, asesor)
    .query(`
      SELECT TOP 1
          f.[fornum]
        , f.[forci]
        , CONVERT(varchar(10), f.[forfec], 103) AS [forfec]
        , f.[fortel]
        , f.[forcel]
        , f.[fordire]
        , f.[forpuerta]
        , f.[forapto]
        , f.[forbis]
        , f.[forciu]
        , f.[fordepto]
        , f.[formail]
        , f.[forproy]
        , f.[fordonde]
        , f.[forfoto]
        , f.[forcifoto]
        , f.[for35d]
        , f.[for35f]
        , f.[forcifoto2]
        , f.[forauto]
        , f.[forx]
        , f.[fory]
        , f.[forase]
        , f.[forori]
        , CONVERT(varchar(10), f.[forfecnac], 103) AS [forfecnac]
        , f.[forempresa]
        , f.[forsueldo]
        , f.[fortipdoc]
        , f.[forcodci]
        , f.[forcodciser]
        , f.[forcitipo]
        , p.[perfecnac] AS [persona_fecnac]
        , p.[pertel] AS [persona_tel]
        , p.[percel] AS [persona_cel]
        , p.[permail] AS [persona_mail]
        , p.[percalle] AS [persona_calle]
        , p.[perpuerta] AS [persona_puerta]
        , p.[perapto] AS [persona_apto]
        , p.[perbis] AS [persona_bis]
        , ld.[locdeploc] AS [persona_localidad]
        , ld.[locdepdep] AS [persona_departamento]
      FROM [afapformularios].[dbo].[FORMULAR] f WITH (NOLOCK)
      LEFT JOIN [2023_AFAP_Gestion].[dbo].[PERSONA] p WITH (NOLOCK)
        ON p.[perci] = f.[forci]
      LEFT JOIN [2023_AFAP_Gestion].[dbo].[LOCDEP] ld WITH (NOLOCK)
        ON ld.[locdepciu] = p.[perlocnum]
      WHERE f.[fornum] = @fornum
        AND f.[forpromoto] = @asenum;
    `);

  const row = result.recordset?.[0];
  if (!row) {
    const error = new Error("Formulario no encontrado para el asesor autenticado");
    error.statusCode = 404;
    throw error;
  }

  return {
    fornum: row.fornum != null ? String(row.fornum) : "",
    forci: row.forci != null ? String(row.forci) : "",
    forfec: dateToInput(row.forfec),
    fortel: firstUsefulText(row.fortel, row.persona_tel),
    forcel: firstUsefulText(row.forcel, row.persona_cel),
    fordire: firstUsefulText(row.fordire, row.persona_calle),
    forpuerta: firstUsefulText(row.forpuerta, row.persona_puerta),
    forapto: firstUsefulText(row.forapto, row.persona_apto),
    forbis: firstUsefulText(row.forbis, row.persona_bis),
    forciu: firstUsefulText(row.forciu, row.persona_localidad),
    fordepto: firstUsefulText(row.fordepto, row.persona_departamento),
    formail: firstUsefulText(row.formail, row.persona_mail),
    forproy: row.forproy != null ? String(row.forproy) : "",
    fordonde: Number(row.forauto || 0) === 1 ? "+100 Km" : "-100 Km",
    forfoto: bufferToDataUrl(row.forfoto),
    forcifoto: bufferToDataUrl(row.forcifoto),
    for35d: bufferToDataUrl(row.for35d),
    for35f: bufferToDataUrl(row.for35f),
    forcifoto2: bufferToDataUrl(row.forcifoto2),
    forauto: row.forauto != null ? String(row.forauto) : "",
    forx: row.forx != null ? String(row.forx) : "",
    fory: row.fory != null ? String(row.fory) : "",
    forase: row.forase != null ? String(row.forase) : "",
    forori: row.forori != null ? String(row.forori) : "",
    forfecnac: firstUsefulDate(row.forfecnac, row.persona_fecnac),
    forempresa: cleanText(row.forempresa),
    forsueldo: row.forsueldo != null ? String(row.forsueldo) : "",
    fortipdoc: cleanText(row.fortipdoc),
    forcodci: cleanText(row.forcodci),
    forcodciser: cleanText(row.forcodciser),
    forcitipo: cleanText(row.forcitipo),
  };
}

async function enviarFormulario({ asenum, fornum, payload }) {
  const asesor = validarAsesor(asenum);
  const formulario = validarFormularioNumero(fornum);

  const documentoTexto = cleanText(payload.documento);
  const documentoNumerico = parseIntOrNull(documentoTexto);
  const tipoDocumento = optionalText(payload.tipoDocumento || "CI", 2) || "CI";
  const distanciaFlag = distanciaToFlag(payload.distancia);

  if (!documentoTexto) {
    const error = new Error("Debe ingresar el documento");
    error.statusCode = 400;
    throw error;
  }

  if (documentoNumerico === null || !/^\d+$/.test(documentoTexto)) {
    const error = new Error("El documento debe ser numérico. Para pasaporte o documento extranjero, ingrese la CI ficticia asignada, por ejemplo 100000000.");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.fotos?.formulario) {
    const error = new Error("Debe tomar foto del formulario");
    error.statusCode = 400;
    throw error;
  }

  const verificacion = await verificarFormulario({
    asenum: asesor,
    formulario,
    asesorForm: payload.asesorForm || payload.autorizacion,
  });

  if (verificacion.resultado !== "correcto") {
    const error = new Error("Verifique el número de formulario");
    error.statusCode = 400;
    throw error;
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const request = new sql.Request(transaction);

    await request
      .input("ASE", sql.Int, asesor)
      .input("FORNUM", sql.Int, formulario)
      .input("CED", sql.Int, documentoNumerico)
      .input("forfoto", sql.VarBinary(sql.MAX), base64ToBuffer(payload.fotos?.formulario))
      .input("forcifoto", sql.VarBinary(sql.MAX), base64ToBuffer(payload.fotos?.ciFrente))
      .input("forfec", sql.Date, parseDateOrNull(payload.fechaForm) || new Date())
      .input("fortel", sql.VarChar(25), truncateText(payload.telefono, 25))
      .input("forcel", sql.VarChar(25), truncateText(payload.celular, 25))
      .input("fordire", sql.VarChar(120), truncateText(payload.calle, 120))
      .input("forpuerta", sql.VarChar(5), truncateText(payload.puerta, 5))
      .input("forapto", sql.VarChar(5), truncateText(payload.apto, 5))
      .input("forbis", sql.VarChar(3), truncateText(payload.bis, 3))
      .input("forciu", sql.VarChar(25), truncateText(payload.localidad, 25))
      .input("fordepto", sql.VarChar(25), truncateText(payload.departamento, 25))
      .input("formail", sql.VarChar(50), truncateText(payload.mail, 50))
      .input("forproy", sql.Int, parseIntOrNull(payload.proyecto))
      .input("forauto", sql.Int, distanciaFlag)
      .input("fordonde", sql.SmallInt, distanciaFlag)
      .input("forx", sql.Decimal(18, 12), parseDecimalOrNull(payload.x))
      .input("fory", sql.Decimal(18, 12), parseDecimalOrNull(payload.y))
      .input("forori", sql.Int, parseIntOrNull(payload.asesorForm || payload.autorizacion) || asesor)
      .input("forfecnac", sql.Date, parseDateOrNull(payload.fechaNac))
      .input("for35d", sql.VarBinary(sql.MAX), base64ToBuffer(payload.fotos?.form35Dorso))
      .input("for35f", sql.VarBinary(sql.MAX), base64ToBuffer(payload.fotos?.form35Frente))
      .input("forcifoto2", sql.VarBinary(sql.MAX), base64ToBuffer(payload.fotos?.ciDorso))
      .input("forempresa", sql.VarChar(40), truncateText(payload.empresa, 40))
      .input("forsueldo", sql.Decimal(19, 4), parseMoneyOrNull(payload.sueldo))
      .input("fortipdoc", sql.VarChar(2), tipoDocumento)
      .input("forcodci", sql.VarChar(10), optionalText(payload.codigoCI, 10))
      .input("forcodciser", sql.VarChar(10), optionalText(payload.serieCodCI, 10))
      .input("forcitipo", sql.SmallInt, parseSmallIntOrNull(payload.tipoImpresionCI) || 0)
      .query(`
        UPDATE [afapformularios].[dbo].[FORMULAR]
        SET
            [forfoto] = @forfoto
          , [forci] = @CED
          , [forcifoto] = @forcifoto
          , [forfec] = @forfec
          , [fortel] = @fortel
          , [forcel] = @forcel
          , [fordire] = @fordire
          , [forpuerta] = @forpuerta
          , [forapto] = @forapto
          , [forbis] = @forbis
          , [forciu] = @forciu
          , [fordepto] = @fordepto
          , [formail] = @formail
          , [forproy] = @forproy
          , [forauto] = @forauto
          , [fordonde] = @fordonde
          , [forx] = @forx
          , [fory] = @fory
          , [forase] = @ASE
          , [forori] = @forori
          , [forfecnac] = @forfecnac
          , [for35d] = @for35d
          , [for35f] = @for35f
          , [forcifoto2] = @forcifoto2
          , [forestado] = 2
          , [forproc] = 0
          , [forempresa] = @forempresa
          , [forsueldo] = @forsueldo
          , [fortipdoc] = @fortipdoc
          , [forcodci] = @forcodci
          , [forcodciser] = @forcodciser
          , [forcitipo] = @forcitipo
        WHERE [fornum] = @FORNUM
          AND [forpromoto] = @ASE;

        IF @@ROWCOUNT = 0
        BEGIN
          THROW 51000, 'No se pudo actualizar el formulario para el asesor autenticado.', 1;
        END;

        INSERT INTO [afapformularios].[dbo].[FORMULA1]
          ([fornum], [forcuando], [foraccion], [forquien], [fordetalle], [fordias], [forvisto], [forpecobs], [forusu], [forrechnum], [forpec])
        VALUES
          (@FORNUM, GETDATE(), 'ENV', @ASE, '', 0, '1753-01-01', '', '', 0, 0);

        IF NOT EXISTS (
          SELECT 1
          FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] WITH (NOLOCK)
          WHERE [perci] = @CED
            AND [resnum] = 1
        )
        BEGIN
          INSERT INTO [2023_AFAP_Gestion].[dbo].[ACCIONES]
            ([acccuando], [acctipo], [resnum], [accobs], [acccontacto], [accmedio], [accvaluacion], [perci], [asenum], [accobs2], [acctelnvo], [accdirnvo], [accext], [accadjunto])
          VALUES
            (SYSDATETIME(), 4, 1, '', CONVERT(datetime, '17530101', 112), 0, 0, @CED, @ASE, '', NULL, NULL, NULL, NULL);
        END;
      `);

    await transaction.commit();
    return { formulario: String(formulario), enviado: true };
  } catch (error) {
    try {
      if (transaction._aborted !== true) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error("[formularios] rollback fallido:", rollbackError);
    }
    throw error;
  }
}


async function anularFormulario({ asenum, fornum, payload }) {
  const asesor = validarAsesor(asenum);
  const formulario = validarFormularioNumero(fornum);
  const detalle = truncateText(payload?.detalle, 250);
  const foto = base64ToBuffer(payload?.foto);

  if (!detalle) {
    const error = new Error("Debe ingresar el motivo de anulación");
    error.statusCode = 400;
    throw error;
  }

  if (!foto) {
    const error = new Error("Debe cargar una foto o comprobante para la anulación");
    error.statusCode = 400;
    throw error;
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const request = new sql.Request(transaction);

    await request
      .input("ASE", sql.Int, asesor)
      .input("FORNUM", sql.Int, formulario)
      .input("DETALLE", sql.VarChar(250), `ANULAR: ${detalle}`)
      .input("forfoto", sql.VarBinary(sql.MAX), foto)
      .query(`
        UPDATE [afapformularios].[dbo].[FORMULAR]
        SET
            [forestado] = 2
          , [forfoto] = @forfoto
          , [forproc] = 0
        WHERE [fornum] = @FORNUM
          AND [forpromoto] = @ASE
          AND [forestado] IN (1,4,5,8,9,10,11);

        IF @@ROWCOUNT = 0
        BEGIN
          THROW 51001, 'No se pudo anular el formulario para el asesor autenticado o el estado actual no permite anulación.', 1;
        END;

        INSERT INTO [afapformularios].[dbo].[FORMULA1]
          ([fornum], [forcuando], [foraccion], [forquien], [fordetalle], [fordias], [forvisto], [forpecobs], [forusu], [forrechnum], [forpec])
        VALUES
          (@FORNUM, GETDATE(), 'ENV', @ASE, @DETALLE, 0, '1753-01-01', '', '', 0, 0);
      `);

    await transaction.commit();
    return { formulario: String(formulario), anulado: true };
  } catch (error) {
    try {
      if (transaction._aborted !== true) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error("[formularios] rollback anulación fallido:", rollbackError);
    }
    throw error;
  }
}

module.exports = {
  getFormulariosByAsesor,
  getFormulariosPendientesByAsesor,
  getProyectosFormulario,
  verificarFormulario,
  getFormularioDetalle,
  enviarFormulario,
  anularFormulario,
};
