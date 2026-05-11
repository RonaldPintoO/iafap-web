const { sql, getPool } = require("../config/database");

function normalizeDateParam(value, fieldName) {
  if (!value) throw new Error(`Falta parámetro requerido: ${fieldName}`);

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Parámetro inválido: ${fieldName}. Formato esperado: YYYY-MM-DD`);
  }

  return value;
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toFixedNumber(value, decimals = 2) {
  const num = toNumber(value);
  return Number(num.toFixed(decimals));
}

function nombreAsesor(row) {
  const nombre = String(row.nombre || "").trim();
  const apellido = String(row.apellido || "").trim();
  const fullName = `${nombre} ${apellido}`.trim();

  if (fullName) return fullName;
  return `Asesor ${row.asesor}`;
}

async function getRankingProduccion({ fechaInicio, fechaFin }) {
  const fechaInicioOk = normalizeDateParam(fechaInicio, "fecha_inicio");
  const fechaFinOk = normalizeDateParam(fechaFin, "fecha_fin");
  const pool = await getPool();

  const result = await pool
    .request()
    .input("fecha_inicio", sql.Date, fechaInicioOk)
    .input("fecha_fin", sql.Date, fechaFinOk)
    .query(`
      SET LANGUAGE Spanish;

      ;WITH DatosBase AS (
        SELECT
          asesor,
          regimen,
          fecha_movimiento,
          documento,
          YEAR(fecha_movimiento) AS anio_num,
          MONTH(fecha_movimiento) AS mes_num,
          DATENAME(MONTH, fecha_movimiento) + ' ' + CAST(YEAR(fecha_movimiento) AS VARCHAR(4)) AS mes_anio
        FROM (
          /* RATIFICACIONES */
          SELECT
            CAST(r.asesor AS VARCHAR(50)) AS asesor,
            CASE
              WHEN LTRIM(RTRIM(a.regimen)) IN ('20130', '20.130') THEN '20130'
              WHEN LTRIM(RTRIM(a.regimen)) IN ('16713', '16.713') THEN '16713'
              ELSE NULL
            END AS regimen,
            r.fecha_ratificado AS fecha_movimiento,
            CAST(r.documento AS VARCHAR(50)) AS documento
          FROM [2023_AFAP_Gestion].[dbo].[RATIFICACIONES] r
          LEFT JOIN [2023_AFAP_Gestion].[dbo].[ASIGNACIONES_OFICIOS] a
            ON r.documento = a.documento
          WHERE r.fecha_ratificado >= @fecha_inicio
            AND r.fecha_ratificado < DATEADD(DAY, 1, @fecha_fin)

          UNION ALL

          /* VOLUNTARIAS */
          SELECT
            CAST(b.bpsprom AS VARCHAR(50)) AS asesor,
            'Voluntarias' AS regimen,
            b.bpsfbps AS fecha_movimiento,
            CAST(b.bpsdocu AS VARCHAR(50)) AS documento
          FROM [afapformularios].[dbo].[DATBPS] b
          WHERE b.bpsfbps >= @fecha_inicio
            AND b.bpsfbps < DATEADD(DAY, 1, @fecha_fin)

          UNION ALL

          /* TRASPASOS */
          SELECT
            CAST(f1.forpromoto AS VARCHAR(50)) AS asesor,
            'Traspasos' AS regimen,
            f.forcuando AS fecha_movimiento,
            CAST(f1.forci AS VARCHAR(50)) AS documento
          FROM [afapformularios].[dbo].[FORMULA1] f
          JOIN [afapformularios].[dbo].[FORMULAR] f1
            ON f.fornum = f1.fornum
          WHERE f.fordetalle LIKE '%TRAS%'
            AND f.forcuando >= @fecha_inicio
            AND f.forcuando < DATEADD(DAY, 1, @fecha_fin)
            AND f1.forpromoto IS NOT NULL
            AND f1.forci IS NOT NULL
            AND CAST(f1.forpromoto AS VARCHAR(50)) NOT IN ('1400','3069','3076','2030','3093')

          UNION ALL

          /* FIRMAS ART. 8 */
          SELECT
            CAST(f1.forpromoto AS VARCHAR(50)) AS asesor,
            'Firma Art 8' AS regimen,
            f.forcuando AS fecha_movimiento,
            CAST(f1.forci AS VARCHAR(50)) AS documento
          FROM [afapformularios].[dbo].[FORMULA1] f
          JOIN [afapformularios].[dbo].[FORMULAR] f1
            ON f.fornum = f1.fornum
          WHERE f.fordetalle LIKE 'Firma%'
            AND f.forcuando >= @fecha_inicio
            AND f.forcuando < DATEADD(DAY, 1, @fecha_fin)
            AND f1.forpromoto IS NOT NULL
            AND f1.forci IS NOT NULL
            AND CAST(f1.forpromoto AS VARCHAR(50)) NOT IN ('1400','3069','3076','2030','3093')
        ) X
        WHERE regimen IS NOT NULL
          AND asesor IS NOT NULL
          AND documento IS NOT NULL
      ),
      Detalle AS (
        SELECT
          regimen,
          asesor,
          documento,
          MIN(fecha_movimiento) AS fecha_movimiento
        FROM DatosBase
        GROUP BY regimen, asesor, documento
      ),
      PorAsesor AS (
        SELECT
          asesor,
          SUM(CASE WHEN regimen = '20130' THEN 1 ELSE 0 END) AS total_20130,
          SUM(CASE WHEN regimen = '16713' THEN 1 ELSE 0 END) AS total_16713,
          SUM(CASE WHEN regimen = 'Voluntarias' THEN 1 ELSE 0 END) AS total_voluntarias,
          SUM(CASE WHEN regimen = 'Traspasos' THEN 1 ELSE 0 END) AS total_traspasos,
          SUM(CASE WHEN regimen = 'Firma Art 8' THEN 1 ELSE 0 END) AS total_firma_art8,
          COUNT(*) AS total_produccion
        FROM Detalle
        GROUP BY asesor
      )
      SELECT
        p.asesor,
        TRY_CAST(p.asesor AS INT) AS asesor_numero,
        aa.nombre,
        aa.apellido,
        p.total_20130,
        p.total_16713,
        p.total_voluntarias,
        p.total_traspasos,
        p.total_firma_art8,
        p.total_produccion
      FROM PorAsesor p
      LEFT JOIN [2023_AFAP_Gestion].[dbo].[ASESORES_ACTUALES] aa
        ON TRY_CAST(p.asesor AS INT) = TRY_CAST(aa.numeroAsesor AS INT)
      ORDER BY p.total_produccion DESC, p.total_20130 DESC, p.total_16713 DESC, asesor_numero;
    `);

  const rows = result.recordset || [];

  const resumen = rows.reduce(
    (acc, row) => {
      acc.total_20130 += toNumber(row.total_20130);
      acc.total_16713 += toNumber(row.total_16713);
      acc.total_voluntarias += toNumber(row.total_voluntarias);
      acc.total_traspasos += toNumber(row.total_traspasos);
      acc.total_firma_art8 += toNumber(row.total_firma_art8);
      acc.total_produccion += toNumber(row.total_produccion);
      return acc;
    },
    {
      total_20130: 0,
      total_16713: 0,
      total_voluntarias: 0,
      total_traspasos: 0,
      total_firma_art8: 0,
      total_produccion: 0,
    },
  );

  const ranking = rows.map((row, index) => {
    const totalProduccion = toNumber(row.total_produccion);

    return {
      posicion: index + 1,
      asesor: String(row.asesor || ""),
      asesor_numero: toNumber(row.asesor_numero),
      asesor_nombre: nombreAsesor(row),
      total_20130: toNumber(row.total_20130),
      total_16713: toNumber(row.total_16713),
      total_voluntarias: toNumber(row.total_voluntarias),
      total_traspasos: toNumber(row.total_traspasos),
      total_firma_art8: toNumber(row.total_firma_art8),
      total_produccion: totalProduccion,
      participacion_total_pct:
        resumen.total_produccion > 0 ? toFixedNumber((totalProduccion / resumen.total_produccion) * 100, 2) : 0,
    };
  });

  return {
    periodo: {
      fecha_inicio: fechaInicioOk,
      fecha_fin: fechaFinOk,
    },
    resumen,
    ranking,
  };
}

module.exports = {
  getRankingProduccion,
};
