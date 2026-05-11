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

function nullableNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function mapProyecto(row) {
  return {
    anio_proyecto: toNumber(row.anio_proyecto),
    nro_proyecto: toNumber(row.nro_proyecto),
    periodo_texto: row.periodo_texto || null,
    fecha_desde: row.fecha_desde || null,
    fecha_hasta: row.fecha_hasta || null,
    dias: nullableNumber(row.dias),
    negocios_planificados: nullableNumber(row.negocios_planificados),
    total_negocios: nullableNumber(row.total_negocios),
    negocios_por_dia: nullableNumber(row.negocios_por_dia),
    fecha_rendicion: row.fecha_rendicion || null,
    cuenta_corriente: nullableNumber(row.cuenta_corriente),
    observaciones: row.observaciones || null,
    estado_autoalquiler: row.estado_autoalquiler || null,
  };
}

function mapDetalleProduccion(row) {
  return {
    regimen: row.regimen,
    mes_anio: row.mes_anio,
    asesor: row.asesor,
    documento: row.documento,
    fecha_movimiento: row.fecha_movimiento,
    anio_num: toNumber(row.anio_num),
    mes_num: toNumber(row.mes_num),
  };
}

function rowsToDetalleDict(rows) {
  return rows.map((row) => ({
    resultado: row.resultado || "Sin resultado",
    cantidad: toNumber(row.cantidad),
  }));
}

async function getAutoAlquilerAnalisis({ asesorNumero, fechaInicio, fechaFin }) {
  if (!asesorNumero) throw new Error("No se pudo determinar el asesor logueado.");

  const fechaInicioOk = normalizeDateParam(fechaInicio, "fecha_inicio");
  const fechaFinOk = normalizeDateParam(fechaFin, "fecha_fin");
  const pool = await getPool();

  const result = await pool
    .request()
    .input("asesor_numero", sql.Int, Number(asesorNumero))
    .input("fecha_inicio", sql.Date, fechaInicioOk)
    .input("fecha_fin", sql.Date, fechaFinOk)
    .query(`
      ;WITH Base AS (
        SELECT
          id,
          anio_proyecto,
          nro_proyecto,
          asesor_numero,
          tipo_auto,
          periodo_texto,
          fecha_desde,
          fecha_hasta,
          dias,
          negocios_planificados,
          total_negocios,
          fecha_rendicion,
          cuenta_corriente,
          observaciones,
          CASE
            WHEN LOWER(ISNULL(observaciones, '')) LIKE '%descontar%' THEN 'DESCONTAR'
            WHEN fecha_desde > @fecha_fin THEN 'FUTURO'
            WHEN total_negocios IS NULL AND fecha_hasta <= @fecha_fin THEN 'PENDIENTE_RENDICION'
            WHEN total_negocios IS NOT NULL THEN 'RENDIDO'
            ELSE 'EN_CURSO'
          END AS estado_autoalquiler,
          CASE
            WHEN dias > 0 AND total_negocios IS NOT NULL
              THEN CAST(total_negocios AS DECIMAL(18, 2)) / NULLIF(dias, 0)
            ELSE NULL
          END AS negocios_por_dia
        FROM [2023_AFAP_Gestion].[dbo].[WEBAPP_AUTOALQUILER_PROYECTOS]
        WHERE activo = 1
          AND tipo_auto = 'Alquiler'
          AND asesor_numero = @asesor_numero
          AND fecha_desde <= @fecha_fin
          AND fecha_hasta >= @fecha_inicio
      )
      SELECT
        COUNT(CASE WHEN estado_autoalquiler = 'RENDIDO' AND total_negocios > 0 THEN 1 END) AS proyectos_rendidos,
        SUM(CASE WHEN estado_autoalquiler = 'RENDIDO' AND total_negocios > 0 THEN total_negocios ELSE 0 END) AS total_negocios_rendidos,
        SUM(CASE WHEN estado_autoalquiler = 'RENDIDO' AND total_negocios > 0 THEN dias ELSE 0 END) AS total_dias_rendidos,
        COUNT(CASE WHEN estado_autoalquiler <> 'RENDIDO' OR total_negocios IS NULL THEN 1 END) AS proyectos_no_rendidos,
        COUNT(CASE WHEN estado_autoalquiler = 'DESCONTAR' THEN 1 END) AS proyectos_descontar,
        COUNT(CASE WHEN estado_autoalquiler = 'PENDIENTE_RENDICION' THEN 1 END) AS proyectos_pendientes,
        COUNT(CASE WHEN estado_autoalquiler = 'FUTURO' THEN 1 END) AS proyectos_futuros,
        COUNT(CASE WHEN estado_autoalquiler = 'EN_CURSO' THEN 1 END) AS proyectos_en_curso
      FROM Base;

      ;WITH Base AS (
        SELECT
          anio_proyecto,
          nro_proyecto,
          periodo_texto,
          fecha_desde,
          fecha_hasta,
          dias,
          negocios_planificados,
          total_negocios,
          fecha_rendicion,
          cuenta_corriente,
          observaciones,
          CASE
            WHEN LOWER(ISNULL(observaciones, '')) LIKE '%descontar%' THEN 'DESCONTAR'
            WHEN fecha_desde > @fecha_fin THEN 'FUTURO'
            WHEN total_negocios IS NULL AND fecha_hasta <= @fecha_fin THEN 'PENDIENTE_RENDICION'
            WHEN total_negocios IS NOT NULL THEN 'RENDIDO'
            ELSE 'EN_CURSO'
          END AS estado_autoalquiler,
          CASE
            WHEN dias > 0 AND total_negocios IS NOT NULL
              THEN CAST(total_negocios AS DECIMAL(18, 2)) / NULLIF(dias, 0)
            ELSE NULL
          END AS negocios_por_dia
        FROM [2023_AFAP_Gestion].[dbo].[WEBAPP_AUTOALQUILER_PROYECTOS]
        WHERE activo = 1
          AND tipo_auto = 'Alquiler'
          AND asesor_numero = @asesor_numero
          AND fecha_desde <= @fecha_fin
          AND fecha_hasta >= @fecha_inicio
      )
      SELECT *
      FROM Base
      ORDER BY fecha_desde, nro_proyecto;
    `);

  const resumenRow = result.recordsets?.[0]?.[0] || {};
  const proyectos = (result.recordsets?.[1] || []).map(mapProyecto);

  const totalNegociosRendidos = toNumber(resumenRow.total_negocios_rendidos);
  const totalDiasRendidos = toNumber(resumenRow.total_dias_rendidos);
  const promedioNegociosDia = totalDiasRendidos > 0 ? totalNegociosRendidos / totalDiasRendidos : 0;
  const metaNegociosDia = 5;
  const diferenciaVsMeta = promedioNegociosDia - metaNegociosDia;

  return {
    asesor_numero: Number(asesorNumero),
    periodo: { fecha_inicio: fechaInicioOk, fecha_fin: fechaFinOk },
    resumen: {
      proyectos_rendidos: toNumber(resumenRow.proyectos_rendidos),
      total_negocios_rendidos: totalNegociosRendidos,
      total_dias_rendidos: totalDiasRendidos,
      promedio_negocios_dia: Number(promedioNegociosDia.toFixed(2)),
      meta_negocios_dia: metaNegociosDia,
      diferencia_vs_meta: Number(diferenciaVsMeta.toFixed(2)),
      proyectos_no_rendidos: toNumber(resumenRow.proyectos_no_rendidos),
      proyectos_descontar: toNumber(resumenRow.proyectos_descontar),
      proyectos_pendientes: toNumber(resumenRow.proyectos_pendientes),
      proyectos_futuros: toNumber(resumenRow.proyectos_futuros),
      proyectos_en_curso: toNumber(resumenRow.proyectos_en_curso),
    },
    rendidos: proyectos.filter((p) => p.estado_autoalquiler === "RENDIDO" && p.total_negocios !== null),
    no_rendidos: proyectos.filter((p) => p.estado_autoalquiler !== "RENDIDO" || p.total_negocios === null),
  };
}

async function getProduccionAnalisis({ asesorNumero, fechaInicio, fechaFin }) {
  if (!asesorNumero) throw new Error("No se pudo determinar el asesor logueado.");

  const fechaInicioOk = normalizeDateParam(fechaInicio, "fecha_inicio");
  const fechaFinOk = normalizeDateParam(fechaFin, "fecha_fin");
  const pool = await getPool();

  const result = await pool
    .request()
    .input("asesor", sql.VarChar(50), String(asesorNumero))
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
            AND CAST(r.asesor AS VARCHAR(50)) = @asesor

          UNION ALL

          SELECT
            CAST(b.bpsprom AS VARCHAR(50)) AS asesor,
            'Voluntarias' AS regimen,
            b.bpsfbps AS fecha_movimiento,
            CAST(b.bpsdocu AS VARCHAR(50)) AS documento
          FROM [afapformularios].[dbo].[DATBPS] b
          WHERE b.bpsfbps >= @fecha_inicio
            AND b.bpsfbps < DATEADD(DAY, 1, @fecha_fin)
            AND CAST(b.bpsprom AS VARCHAR(50)) = @asesor

          UNION ALL

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
            AND CAST(f1.forpromoto AS VARCHAR(50)) = @asesor

          UNION ALL

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
            AND CAST(f1.forpromoto AS VARCHAR(50)) = @asesor
        ) X
        WHERE regimen IS NOT NULL
          AND asesor IS NOT NULL
          AND documento IS NOT NULL
      ),
      Detalle AS (
        SELECT
          regimen,
          mes_anio,
          asesor,
          documento,
          MIN(fecha_movimiento) AS fecha_movimiento,
          anio_num,
          mes_num
        FROM DatosBase
        GROUP BY regimen, mes_anio, asesor, documento, anio_num, mes_num
      )
      SELECT
        SUM(CASE WHEN regimen = '20130' THEN 1 ELSE 0 END) AS total_20130,
        SUM(CASE WHEN regimen = '16713' THEN 1 ELSE 0 END) AS total_16713,
        SUM(CASE WHEN regimen = 'Voluntarias' THEN 1 ELSE 0 END) AS total_voluntarias,
        SUM(CASE WHEN regimen = 'Traspasos' THEN 1 ELSE 0 END) AS total_traspasos,
        SUM(CASE WHEN regimen = 'Firma Art 8' THEN 1 ELSE 0 END) AS total_firma_art8,
        COUNT(*) AS total_produccion
      FROM Detalle;

      ;WITH DatosBase AS (
        SELECT asesor, regimen, fecha_movimiento, documento, YEAR(fecha_movimiento) AS anio_num, MONTH(fecha_movimiento) AS mes_num, DATENAME(MONTH, fecha_movimiento) + ' ' + CAST(YEAR(fecha_movimiento) AS VARCHAR(4)) AS mes_anio
        FROM (
          SELECT CAST(r.asesor AS VARCHAR(50)) AS asesor, CASE WHEN LTRIM(RTRIM(a.regimen)) IN ('20130', '20.130') THEN '20130' WHEN LTRIM(RTRIM(a.regimen)) IN ('16713', '16.713') THEN '16713' ELSE NULL END AS regimen, r.fecha_ratificado AS fecha_movimiento, CAST(r.documento AS VARCHAR(50)) AS documento
          FROM [2023_AFAP_Gestion].[dbo].[RATIFICACIONES] r LEFT JOIN [2023_AFAP_Gestion].[dbo].[ASIGNACIONES_OFICIOS] a ON r.documento = a.documento
          WHERE r.fecha_ratificado >= @fecha_inicio AND r.fecha_ratificado < DATEADD(DAY, 1, @fecha_fin) AND CAST(r.asesor AS VARCHAR(50)) = @asesor
          UNION ALL
          SELECT CAST(b.bpsprom AS VARCHAR(50)) AS asesor, 'Voluntarias' AS regimen, b.bpsfbps AS fecha_movimiento, CAST(b.bpsdocu AS VARCHAR(50)) AS documento
          FROM [afapformularios].[dbo].[DATBPS] b WHERE b.bpsfbps >= @fecha_inicio AND b.bpsfbps < DATEADD(DAY, 1, @fecha_fin) AND CAST(b.bpsprom AS VARCHAR(50)) = @asesor
          UNION ALL
          SELECT CAST(f1.forpromoto AS VARCHAR(50)) AS asesor, 'Traspasos' AS regimen, f.forcuando AS fecha_movimiento, CAST(f1.forci AS VARCHAR(50)) AS documento
          FROM [afapformularios].[dbo].[FORMULA1] f JOIN [afapformularios].[dbo].[FORMULAR] f1 ON f.fornum = f1.fornum
          WHERE f.fordetalle LIKE '%TRAS%' AND f.forcuando >= @fecha_inicio AND f.forcuando < DATEADD(DAY, 1, @fecha_fin) AND f1.forpromoto IS NOT NULL AND f1.forci IS NOT NULL AND CAST(f1.forpromoto AS VARCHAR(50)) NOT IN ('1400','3069','3076','2030','3093') AND CAST(f1.forpromoto AS VARCHAR(50)) = @asesor
          UNION ALL
          SELECT CAST(f1.forpromoto AS VARCHAR(50)) AS asesor, 'Firma Art 8' AS regimen, f.forcuando AS fecha_movimiento, CAST(f1.forci AS VARCHAR(50)) AS documento
          FROM [afapformularios].[dbo].[FORMULA1] f JOIN [afapformularios].[dbo].[FORMULAR] f1 ON f.fornum = f1.fornum
          WHERE f.fordetalle LIKE 'Firma%' AND f.forcuando >= @fecha_inicio AND f.forcuando < DATEADD(DAY, 1, @fecha_fin) AND f1.forpromoto IS NOT NULL AND f1.forci IS NOT NULL AND CAST(f1.forpromoto AS VARCHAR(50)) NOT IN ('1400','3069','3076','2030','3093') AND CAST(f1.forpromoto AS VARCHAR(50)) = @asesor
        ) X
        WHERE regimen IS NOT NULL AND asesor IS NOT NULL AND documento IS NOT NULL
      ),
      Detalle AS (
        SELECT regimen, mes_anio, asesor, documento, MIN(fecha_movimiento) AS fecha_movimiento, anio_num, mes_num
        FROM DatosBase GROUP BY regimen, mes_anio, asesor, documento, anio_num, mes_num
      )
      SELECT regimen, mes_anio, asesor, documento, fecha_movimiento, anio_num, mes_num
      FROM Detalle
      ORDER BY anio_num, mes_num,
        CASE regimen WHEN '20130' THEN 1 WHEN '16713' THEN 2 WHEN 'Firma Art 8' THEN 3 WHEN 'Traspasos' THEN 4 WHEN 'Voluntarias' THEN 5 ELSE 99 END,
        fecha_movimiento, documento;
    `);

  const resumenRow = result.recordsets?.[0]?.[0] || {};
  const detalle = (result.recordsets?.[1] || []).map(mapDetalleProduccion);

  return {
    asesor_numero: Number(asesorNumero),
    periodo: { fecha_inicio: fechaInicioOk, fecha_fin: fechaFinOk },
    resumen: {
      total_20130: toNumber(resumenRow.total_20130),
      total_16713: toNumber(resumenRow.total_16713),
      total_voluntarias: toNumber(resumenRow.total_voluntarias),
      total_traspasos: toNumber(resumenRow.total_traspasos),
      total_firma_art8: toNumber(resumenRow.total_firma_art8),
      total_produccion: toNumber(resumenRow.total_produccion),
    },
    detalle,
  };
}

async function getAccionesAnalisis({ asesorNumero, fechaInicio, fechaFin }) {
  if (!asesorNumero) throw new Error("No se pudo determinar el asesor logueado.");

  const fechaInicioOk = normalizeDateParam(fechaInicio, "fecha_inicio");
  const fechaFinOk = normalizeDateParam(fechaFin, "fecha_fin");
  const pool = await getPool();

  const result = await pool
    .request()
    .input("asesor_numero", sql.Int, Number(asesorNumero))
    .input("fecha_inicio", sql.Date, fechaInicioOk)
    .input("fecha_fin", sql.Date, fechaFinOk)
    .query(`
      ;WITH UltimaAccion AS (
        SELECT perci, asenum, MAX(acccuando) AS ultima_fecha
        FROM [2023_AFAP_Gestion].[dbo].[ACCIONES]
        WHERE acccuando >= @fecha_inicio
          AND acccuando < DATEADD(DAY, 1, @fecha_fin)
          AND asenum = @asesor_numero
        GROUP BY perci, asenum
      ),
      BaseDocs AS (
        SELECT
          A.asenum,
          A.perci,
          A.resnum,
          A.acccuando,
          (
            SELECT COUNT(*)
            FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] B
            WHERE B.asenum = A.asenum
              AND B.perci = A.perci
              AND B.acccuando >= @fecha_inicio
              AND B.acccuando < DATEADD(DAY, 1, @fecha_fin)
          ) AS cantidad_acciones
        FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] A
        JOIN UltimaAccion UA
          ON UA.perci = A.perci
         AND UA.asenum = A.asenum
         AND UA.ultima_fecha = A.acccuando
        WHERE A.acccuando >= @fecha_inicio
          AND A.acccuando < DATEADD(DAY, 1, @fecha_fin)
          AND A.asenum = @asesor_numero
      ),
      Clasificado AS (
        SELECT
          D.asenum,
          D.perci,
          D.cantidad_acciones,
          D.acccuando AS ultima_accion,
          ISNULL(R.resnom, 'Sin resultado') AS resultado,
          CASE
            WHEN R.restipo = 1 THEN 'Finalizado'
            WHEN R.restipo = 0 THEN 'Pendiente'
            ELSE 'Otro'
          END AS estado
        FROM BaseDocs D
        LEFT JOIN [2023_AFAP_Gestion].[dbo].[RESULTADOS] R
          ON D.resnum = R.resnum
      )
      SELECT
        COUNT(DISTINCT perci) AS documentos,
        SUM(cantidad_acciones) AS acciones,
        COUNT(DISTINCT CASE WHEN estado = 'Finalizado' THEN perci END) AS finalizados,
        COUNT(DISTINCT CASE WHEN estado = 'Pendiente' THEN perci END) AS pendientes,
        COUNT(DISTINCT CASE WHEN estado = 'Otro' THEN perci END) AS otros
      FROM Clasificado;

      ;WITH UltimaAccion AS (
        SELECT perci, asenum, MAX(acccuando) AS ultima_fecha
        FROM [2023_AFAP_Gestion].[dbo].[ACCIONES]
        WHERE acccuando >= @fecha_inicio AND acccuando < DATEADD(DAY, 1, @fecha_fin) AND asenum = @asesor_numero
        GROUP BY perci, asenum
      ), BaseDocs AS (
        SELECT A.asenum, A.perci, A.resnum, A.acccuando,
          (SELECT COUNT(*) FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] B WHERE B.asenum = A.asenum AND B.perci = A.perci AND B.acccuando >= @fecha_inicio AND B.acccuando < DATEADD(DAY, 1, @fecha_fin)) AS cantidad_acciones
        FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] A JOIN UltimaAccion UA ON UA.perci = A.perci AND UA.asenum = A.asenum AND UA.ultima_fecha = A.acccuando
        WHERE A.acccuando >= @fecha_inicio AND A.acccuando < DATEADD(DAY, 1, @fecha_fin) AND A.asenum = @asesor_numero
      ), Clasificado AS (
        SELECT D.asenum, D.perci, D.cantidad_acciones, D.acccuando AS ultima_accion, ISNULL(R.resnom, 'Sin resultado') AS resultado,
          CASE WHEN R.restipo = 1 THEN 'Finalizado' WHEN R.restipo = 0 THEN 'Pendiente' ELSE 'Otro' END AS estado
        FROM BaseDocs D LEFT JOIN [2023_AFAP_Gestion].[dbo].[RESULTADOS] R ON D.resnum = R.resnum
      )
      SELECT estado, resultado, COUNT(DISTINCT perci) AS cantidad
      FROM Clasificado
      WHERE estado IN ('Finalizado', 'Pendiente')
      GROUP BY estado, resultado
      ORDER BY estado, cantidad DESC, resultado;

      ;WITH UltimaAccion AS (
        SELECT perci, asenum, MAX(acccuando) AS ultima_fecha
        FROM [2023_AFAP_Gestion].[dbo].[ACCIONES]
        WHERE acccuando >= @fecha_inicio AND acccuando < DATEADD(DAY, 1, @fecha_fin) AND asenum = @asesor_numero
        GROUP BY perci, asenum
      ), BaseDocs AS (
        SELECT A.asenum, A.perci, A.resnum, A.acccuando,
          (SELECT COUNT(*) FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] B WHERE B.asenum = A.asenum AND B.perci = A.perci AND B.acccuando >= @fecha_inicio AND B.acccuando < DATEADD(DAY, 1, @fecha_fin)) AS cantidad_acciones
        FROM [2023_AFAP_Gestion].[dbo].[ACCIONES] A JOIN UltimaAccion UA ON UA.perci = A.perci AND UA.asenum = A.asenum AND UA.ultima_fecha = A.acccuando
        WHERE A.acccuando >= @fecha_inicio AND A.acccuando < DATEADD(DAY, 1, @fecha_fin) AND A.asenum = @asesor_numero
      ), Clasificado AS (
        SELECT D.asenum, D.perci, D.cantidad_acciones, D.acccuando AS ultima_accion, ISNULL(R.resnom, 'Sin resultado') AS resultado,
          CASE WHEN R.restipo = 1 THEN 'Finalizado' WHEN R.restipo = 0 THEN 'Pendiente' ELSE 'Otro' END AS estado
        FROM BaseDocs D LEFT JOIN [2023_AFAP_Gestion].[dbo].[RESULTADOS] R ON D.resnum = R.resnum
      )
      SELECT TOP 200 perci, cantidad_acciones, ultima_accion, resultado, estado
      FROM Clasificado
      ORDER BY ultima_accion DESC, perci;
    `);

  const resumenRow = result.recordsets?.[0]?.[0] || {};
  const detalleRows = result.recordsets?.[1] || [];
  const documentos = toNumber(resumenRow.documentos);
  const acciones = toNumber(resumenRow.acciones);
  const finalizados = toNumber(resumenRow.finalizados);
  const pendientes = toNumber(resumenRow.pendientes);
  const otros = toNumber(resumenRow.otros);
  const denom = finalizados + pendientes;
  const eficiencia = denom > 0 ? (finalizados / denom) * 100 : 0;

  return {
    asesor_numero: Number(asesorNumero),
    periodo: { fecha_inicio: fechaInicioOk, fecha_fin: fechaFinOk },
    resumen: {
      documentos,
      acciones,
      finalizados,
      pendientes,
      otros,
      eficiencia: Number(eficiencia.toFixed(1)),
    },
    detalle_finalizados: rowsToDetalleDict(detalleRows.filter((row) => row.estado === "Finalizado")),
    detalle_pendientes: rowsToDetalleDict(detalleRows.filter((row) => row.estado === "Pendiente")),
    detalle: (result.recordsets?.[2] || []).map((row) => ({
      documento: String(row.perci || ""),
      acciones: toNumber(row.cantidad_acciones),
      ultima_accion: row.ultima_accion || null,
      resultado: row.resultado || "Sin resultado",
      estado: row.estado || "Otro",
    })),
  };
}

module.exports = {
  getAutoAlquilerAnalisis,
  getProduccionAnalisis,
  getAccionesAnalisis,
};
