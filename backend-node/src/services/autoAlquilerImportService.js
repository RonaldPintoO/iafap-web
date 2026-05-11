const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");
const { sql, getPool } = require("../config/database");

const TABLE_PROYECTOS =
  "[2023_AFAP_Gestion].[dbo].[WEBAPP_AUTOALQUILER_PROYECTOS]";

const TABLE_BATCHES =
  "[2023_AFAP_Gestion].[dbo].[WEBAPP_AUTOALQUILER_IMPORT_BATCHES]";

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function normalizeRow(row) {
  const out = {};

  for (const [key, value] of Object.entries(row || {})) {
    out[normalizeKey(key)] = value;
  }

  return out;
}

function firstValue(row, keys) {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    const value = row[normalized];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function toInt(value) {
  const number = toNumber(value);
  return number === null ? null : Math.trunc(number);
}

function excelSerialToDate(serial) {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return null;

  return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
}

function toDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    return excelSerialToDate(value);
  }

  const raw = String(value).trim();

  const ddmmyyyy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    let year = Number(ddmmyyyy[3]);

    if (year < 100) year += 2000;

    return new Date(Date.UTC(year, month - 1, day));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRequiredConfig() {
  const excelPath = process.env.AUTOALQUILER_EXCEL_PATH;
  const anioProyecto = Number(process.env.AUTOALQUILER_ANIO_PROYECTO || "");
  const sheetName = process.env.AUTOALQUILER_EXCEL_SHEET || "DATA";

  if (!excelPath) {
    throw new Error("Falta AUTOALQUILER_EXCEL_PATH en .env");
  }

  if (!Number.isInteger(anioProyecto)) {
    throw new Error(
      "AUTOALQUILER_ANIO_PROYECTO debe ser un año válido, por ejemplo 2026",
    );
  }

  return {
    excelPath,
    anioProyecto,
    sheetName,
  };
}

function readExcelRows({ excelPath, sheetName, anioProyecto }) {
  const resolvedPath = path.resolve(excelPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`No existe el archivo Excel: ${resolvedPath}`);
  }

  const workbook = XLSX.readFile(resolvedPath, {
    cellDates: true,
  });

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(
      `No existe la hoja "${sheetName}". Hojas disponibles: ${workbook.SheetNames.join(", ")}`,
    );
  }

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: true,
  });

  const rows = [];
  const errors = [];

  rawRows.forEach((rawRow, index) => {
    const sourceRow = index + 2;
    const row = normalizeRow(rawRow);

    const nroProyecto = toInt(firstValue(row, ["Proyecto"]));

    const asesorNumero = toInt(
      firstValue(row, ["N°", "Nº", "Nro", "Numero", "Número"]),
    );

    const tipoAuto = firstValue(row, ["Auto"]);
    const periodoTexto = firstValue(row, ["Periodo", "Período"]);
    const fechaDesde = toDate(firstValue(row, ["Desde"]));
    const fechaHasta = toDate(firstValue(row, ["Hasta"]));

    const dias =
      toNumber(firstValue(row, ["Dias"])) ??
      toNumber(firstValue(row, ["Días"])) ??
      toNumber(firstValue(row, ["Días Hábiles", "Dias Habiles"]));

    const totalNegocios = toNumber(firstValue(row, ["Total Negocios"]));

    const negociosPlanificados = toNumber(
      firstValue(row, ["Negocios", " Negocios "]),
    );

    const fechaRendicion = toDate(
      firstValue(row, ["Fecha Rendicion", "Fecha Rendición"]),
    );

    const cuentaCorriente = toNumber(
      firstValue(row, ["Cuenta Corriente", " Cuenta Corriente "]),
    );

    const observaciones = firstValue(row, [
      "Observaciones de T y F",
      "Observaciones de T y F ",
      "Observaciones",
      "Observacion",
      "Observación",
    ]);

    const isBlank =
      nroProyecto === null &&
      asesorNumero === null &&
      tipoAuto === null &&
      periodoTexto === null &&
      fechaDesde === null &&
      fechaHasta === null &&
      dias === null &&
      totalNegocios === null &&
      negociosPlanificados === null &&
      fechaRendicion === null &&
      cuentaCorriente === null &&
      observaciones === null;

    if (isBlank) return;

    if (nroProyecto === null) {
      errors.push({ sourceRow, error: "Fila sin Proyecto" });
      return;
    }

    if (asesorNumero === null) {
      errors.push({ sourceRow, error: "Fila sin número de asesor" });
      return;
    }

    rows.push({
      anioProyecto,
      nroProyecto,
      asesorNumero,
      tipoAuto: tipoAuto ? String(tipoAuto).trim() : null,
      periodoTexto: periodoTexto ? String(periodoTexto).trim() : null,
      fechaDesde,
      fechaHasta,
      dias,
      totalNegocios,
      negociosPlanificados,
      fechaRendicion,
      cuentaCorriente,
      observaciones: observaciones ? String(observaciones).trim() : null,
      sourceFile: path.basename(resolvedPath),
      sourceSheet: sheetName,
      sourceRow,
    });
  });

  return {
    rows,
    errors,
    sourceFile: path.basename(resolvedPath),
  };
}

async function createBatch(pool, batch) {
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, batch.id)
    .input("anio_proyecto", sql.SmallInt, batch.anioProyecto)
    .input("source_file", sql.VarChar(255), batch.sourceFile)
    .input("source_sheet", sql.VarChar(100), batch.sourceSheet)
    .input("status", sql.VarChar(30), "RUNNING").query(`
      INSERT INTO ${TABLE_BATCHES}
        (id, anio_proyecto, source_file, source_sheet, status)
      VALUES
        (@id, @anio_proyecto, @source_file, @source_sheet, @status)
    `);
}

async function finishBatch(pool, batchId, stats, status = "OK", errorMessage = null) {
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, batchId)
    .input("filas_leidas", sql.Int, stats.filasLeidas)
    .input("filas_insertadas", sql.Int, stats.filasInsertadas)
    .input("filas_actualizadas", sql.Int, stats.filasActualizadas)
    .input("filas_inactivadas", sql.Int, stats.filasInactivadas)
    .input("filas_error", sql.Int, stats.filasError)
    .input("status", sql.VarChar(30), status)
    .input("error_message", sql.VarChar(sql.MAX), errorMessage).query(`
      UPDATE ${TABLE_BATCHES}
      SET
        filas_leidas = @filas_leidas,
        filas_insertadas = @filas_insertadas,
        filas_actualizadas = @filas_actualizadas,
        filas_inactivadas = @filas_inactivadas,
        filas_error = @filas_error,
        status = @status,
        error_message = @error_message,
        finished_at = SYSDATETIME()
      WHERE id = @id
    `);
}

async function upsertProyecto(pool, item, batchId) {
  const existsResult = await pool
    .request()
    .input("anio_proyecto", sql.SmallInt, item.anioProyecto)
    .input("nro_proyecto", sql.Int, item.nroProyecto).query(`
      SELECT TOP 1 id
      FROM ${TABLE_PROYECTOS}
      WHERE anio_proyecto = @anio_proyecto
        AND nro_proyecto = @nro_proyecto
    `);

  const exists = existsResult.recordset.length > 0;

  const request = pool
    .request()
    .input("anio_proyecto", sql.SmallInt, item.anioProyecto)
    .input("nro_proyecto", sql.Int, item.nroProyecto)
    .input("asesor_numero", sql.Int, item.asesorNumero)
    .input("tipo_auto", sql.VarChar(50), item.tipoAuto)
    .input("periodo_texto", sql.VarChar(100), item.periodoTexto)
    .input("fecha_desde", sql.Date, item.fechaDesde)
    .input("fecha_hasta", sql.Date, item.fechaHasta)
    .input("dias", sql.Decimal(10, 2), item.dias)
    .input("total_negocios", sql.Decimal(18, 2), item.totalNegocios)
    .input("negocios_planificados", sql.Decimal(18, 2), item.negociosPlanificados)
    .input("fecha_rendicion", sql.Date, item.fechaRendicion)
    .input("cuenta_corriente", sql.Decimal(18, 2), item.cuentaCorriente)
    .input("observaciones", sql.VarChar(500), item.observaciones)
    .input("source_file", sql.VarChar(255), item.sourceFile)
    .input("source_sheet", sql.VarChar(100), item.sourceSheet)
    .input("source_row", sql.Int, item.sourceRow)
    .input("import_batch_id", sql.UniqueIdentifier, batchId);

  if (exists) {
    await request.query(`
      UPDATE ${TABLE_PROYECTOS}
      SET
        asesor_numero = @asesor_numero,
        tipo_auto = @tipo_auto,
        periodo_texto = @periodo_texto,
        fecha_desde = @fecha_desde,
        fecha_hasta = @fecha_hasta,
        dias = @dias,
        total_negocios = @total_negocios,
        negocios_planificados = @negocios_planificados,
        fecha_rendicion = @fecha_rendicion,
        cuenta_corriente = @cuenta_corriente,
        observaciones = @observaciones,
        source_file = @source_file,
        source_sheet = @source_sheet,
        source_row = @source_row,
        import_batch_id = @import_batch_id,
        updated_at = SYSDATETIME(),
        activo = 1
      WHERE anio_proyecto = @anio_proyecto
        AND nro_proyecto = @nro_proyecto
    `);

    return "updated";
  }

  await request.query(`
    INSERT INTO ${TABLE_PROYECTOS}
      (
        anio_proyecto,
        nro_proyecto,
        asesor_numero,
        tipo_auto,
        periodo_texto,
        fecha_desde,
        fecha_hasta,
        dias,
        total_negocios,
        negocios_planificados,
        fecha_rendicion,
        cuenta_corriente,
        observaciones,
        source_file,
        source_sheet,
        source_row,
        import_batch_id,
        activo
      )
    VALUES
      (
        @anio_proyecto,
        @nro_proyecto,
        @asesor_numero,
        @tipo_auto,
        @periodo_texto,
        @fecha_desde,
        @fecha_hasta,
        @dias,
        @total_negocios,
        @negocios_planificados,
        @fecha_rendicion,
        @cuenta_corriente,
        @observaciones,
        @source_file,
        @source_sheet,
        @source_row,
        @import_batch_id,
        1
      )
  `);

  return "inserted";
}

async function importAutoAlquiler() {
  const config = getRequiredConfig();
  const batchId = crypto.randomUUID();

  const stats = {
    filasLeidas: 0,
    filasInsertadas: 0,
    filasActualizadas: 0,
    filasInactivadas: 0,
    filasError: 0,
  };

  const pool = await getPool();
  let sourceFile = path.basename(config.excelPath);

  try {
    const readResult = readExcelRows(config);
    const rows = readResult.rows;
    sourceFile = readResult.sourceFile;

    stats.filasLeidas = rows.length + readResult.errors.length;
    stats.filasError = readResult.errors.length;

    await createBatch(pool, {
      id: batchId,
      anioProyecto: config.anioProyecto,
      sourceFile,
      sourceSheet: config.sheetName,
    });

    for (const item of rows) {
      const result = await upsertProyecto(pool, item, batchId);

      if (result === "inserted") stats.filasInsertadas += 1;
      if (result === "updated") stats.filasActualizadas += 1;
    }

    const finalStatus = stats.filasError > 0 ? "OK_WITH_WARNINGS" : "OK";

    const errorMessage =
      readResult.errors.length > 0
        ? JSON.stringify(readResult.errors.slice(0, 20))
        : null;

    await finishBatch(pool, batchId, stats, finalStatus, errorMessage);

    return {
      ok: true,
      batchId,
      sourceFile,
      sheetName: config.sheetName,
      anioProyecto: config.anioProyecto,
      stats,
      warnings: readResult.errors,
    };
  } catch (error) {
    try {
      const batchExists = await pool
        .request()
        .input("id", sql.UniqueIdentifier, batchId)
        .query(`SELECT TOP 1 id FROM ${TABLE_BATCHES} WHERE id = @id`);

      if (batchExists.recordset.length === 0) {
        await createBatch(pool, {
          id: batchId,
          anioProyecto: config.anioProyecto,
          sourceFile,
          sourceSheet: config.sheetName,
        });
      }

      await finishBatch(pool, batchId, stats, "ERROR", error.message);
    } catch (_) {
      // No pisamos el error original si falla el log del batch.
    }

    throw error;
  }
}

module.exports = {
  importAutoAlquiler,
};