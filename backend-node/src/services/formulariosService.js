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

function safePeriodoDias(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 30;
  if (n <= 0) return 30;
  return Math.min(Math.floor(n), 365);
}

function buildStatusFilter(estatus) {
  const value = normalizeText(estatus);

  if (!value || value === "TODOS") {
    return "";
  }

  if (value === "ACTIVOS") {
    return `
      AND (
        UPPER(LTRIM(RTRIM(COALESCE(u.foraccion, '')))) = 'OK'
      )
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

async function getFormulariosByAsesor({
  asenum,
  periodoDias = 30,
  estatus = "Todos",
}) {
  const asesor = cleanText(asenum);

  if (!asesor) {
    const error = new Error("Asesor autenticado no válido");
    error.statusCode = 400;
    throw error;
  }

  const dias = safePeriodoDias(periodoDias);
  const pool = await getPool();
  const statusFilter = buildStatusFilter(estatus);

  const query = `
    WITH PeriodoActual AS (
      SELECT TOP 1
            c.[ciefec]
          , c.[ciehas]
      FROM [afapformularios].[dbo].[CIERRES] c
      WHERE c.[ciefec] <= CAST(GETDATE() AS date)
        AND c.[ciefec] >= '2026-01-01'
      ORDER BY c.[ciefec] DESC
    ),
    FormulariosBase AS (
      SELECT DISTINCT f1.[fornum]
      FROM [afapformularios].[dbo].[FORMULA1] f1
      INNER JOIN [afapformularios].[dbo].[FORMULAR] fr
        ON fr.[fornum] = f1.[fornum]
      CROSS JOIN PeriodoActual p
      WHERE fr.[forpromoto] = @asenum
        AND f1.[forcuando] >= p.[ciefec]
        AND f1.[forcuando] < DATEADD(DAY, 1, p.[ciehas])

      UNION

      SELECT fr.[fornum]
      FROM [afapformularios].[dbo].[FORMULAR] fr
      WHERE fr.[forestado] = 1
        AND fr.[forpromoto] = @asenum
    ),
    UltimaAccion AS (
      SELECT
            f1.[fornum]
          , f1.[forcuando]
          , f1.[foraccion]
          , f1.[fordetalle]
          , f1.[forrechnum]
          , ROW_NUMBER() OVER (
              PARTITION BY f1.[fornum]
              ORDER BY f1.[forcuando] DESC
            ) AS rn
      FROM [afapformularios].[dbo].[FORMULA1] f1
      WHERE f1.[fornum] IN (SELECT [fornum] FROM FormulariosBase)
    ),
    DetalleEnv AS (
      SELECT
            f1.[fornum]
          , f1.[fordetalle]
          , ROW_NUMBER() OVER (
              PARTITION BY f1.[fornum]
              ORDER BY f1.[forcuando] DESC
            ) AS rn
      FROM [afapformularios].[dbo].[FORMULA1] f1
      WHERE f1.[foraccion] = 'ENV'
        AND NULLIF(LTRIM(RTRIM(f1.[fordetalle])), '') IS NOT NULL
        AND f1.[fornum] IN (SELECT [fornum] FROM FormulariosBase)
    )
    SELECT
          fb.[fornum]
        , u.[forcuando]
        , u.[foraccion]
        , u.[forrechnum]
        , fr.[forpromoto] AS [forquien_env]
        , NULLIF(LTRIM(RTRIM(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    COALESCE(de.[fordetalle], u.[fordetalle]),
                  ':', ''),
                ',', ''),
              '.', ''),
            ';', '')
          )), '') AS [fordetalle]
    FROM FormulariosBase fb
    LEFT JOIN UltimaAccion u
      ON fb.[fornum] = u.[fornum]
     AND u.rn = 1
    LEFT JOIN [afapformularios].[dbo].[FORMULAR] fr
      ON fb.[fornum] = fr.[fornum]
    LEFT JOIN DetalleEnv de
      ON fb.[fornum] = de.[fornum]
     AND de.rn = 1
    WHERE fr.[forpromoto] = @asenum
      AND (
        (
          u.[forcuando] IS NOT NULL
          AND u.[forcuando] >= DATEADD(DAY, -@periodoDias, CAST(GETDATE() AS date))
        )
        OR (
          u.[forcuando] IS NULL
          AND u.[foraccion] IS NULL
          AND COALESCE(de.[fordetalle], u.[fordetalle]) IS NULL
        )
      )
      ${statusFilter}
    ORDER BY
      CASE
        WHEN u.[forcuando] IS NULL
         AND u.[foraccion] IS NULL
         AND COALESCE(de.[fordetalle], u.[fordetalle]) IS NULL
        THEN 0
        ELSE 1
      END,
      u.[forcuando] DESC,
      fb.[fornum] DESC;
  `;

  const result = await pool
    .request()
    .input("asenum", sql.VarChar(20), asesor)
    .input("periodoDias", sql.Int, dias)
    .query(query);
  const items = (result.recordset || []).map((row) => ({
    fornum: row.fornum != null ? String(row.fornum).trim() : "",
    forcuando: row.forcuando || null,
    foraccion: cleanText(row.foraccion),
    forquien_env: cleanText(row.forquien_env),
    fordetalle: cleanText(row.fordetalle),
    forrechnum: row.forrechnum != null ? String(row.forrechnum).trim() : "",
  }));

  return {
    asesor,
    periodo_dias: dias,
    estatus: cleanText(estatus) || "Todos",
    total: items.length,
    items,
  };
}

module.exports = {
  getFormulariosByAsesor,
};
