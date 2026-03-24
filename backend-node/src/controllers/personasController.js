const personasService = require("../services/personasService");

async function getPersonas(req, res) {
  try {
    const {
      asesor,
      page = 1,
      page_size = 100,
      localidad = "Todos",
      texto = "",
      tipo = "Todos",
      edad_desde = "",
      edad_hasta = "",
      edad_paridad = "Todas",
      nacionalidad = "Todos",
      estado = "Todos",
      fecha_accion = "Todos",
      accion = "Todos",
      ley = "Todos",
    } = req.query;

    const data = await personasService.getPersonas({
      asesor,
      page,
      pageSize: page_size,
      localidad,
      texto,
      tipo,
      edadDesde: edad_desde,
      edadHasta: edad_hasta,
      edadParidad: edad_paridad,
      nacionalidad,
      estado,
      fechaAccion: fecha_accion,
      accion,
      ley,
    });

    return res.json({
      ok: true,
      asesor: String(asesor).trim(),
      localidad: data.localidad,
      page: data.page,
      page_size: data.page_size,
      total: data.total,
      total_pages: data.total_pages,
      snapshot_version: data.snapshot_version,
      snapshot_last_completed_at: data.snapshot_last_completed_at,
      snapshot_is_refreshing: data.snapshot_is_refreshing,
      items: data.items,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo personas",
    });
  }
}

async function getLocalidades(req, res) {
  try {
    const { asesor } = req.query;

    const items = await personasService.getLocalidades({ asesor });

    return res.json({
      ok: true,
      asesor: String(asesor).trim(),
      items,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo localidades",
    });
  }
}

async function getFiltros(req, res) {
  try {
    const { asesor, localidad = "Todos" } = req.query;

    const data = await personasService.getFiltrosPersonas({
      asesor,
      localidad,
    });

    return res.json({
      ok: true,
      asesor: String(asesor).trim(),
      localidad: String(localidad || "Todos").trim() || "Todos",
      ...data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo filtros de personas",
    });
  }
}

async function getAccionesPersona(req, res) {
  try {
    const { cedula } = req.params;

    const data = await personasService.getAccionesPersona({ cedula });

    return res.json({
      ok: true,
      cedula: String(cedula).trim(),
      total: data.total,
      items: data.items,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo acciones de la persona",
    });
  }
}

async function refreshSnapshot(req, res) {
  try {
    const data = await personasService.refreshPersonasSnapshot();

    return res.json({
      ok: true,
      message: "Snapshot de personas refrescado correctamente",
      snapshot: {
        isReady: data.isReady,
        isRefreshing: data.isRefreshing,
        lastStartedAt: data.lastStartedAt,
        lastCompletedAt: data.lastCompletedAt,
        lastError: data.lastError,
        totalItems: data.totalItems,
        totalAsesores: data.totalAsesores,
        version: data.version,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message || "Error refrescando snapshot de personas",
    });
  }
}

function getSnapshotStatus(req, res) {
  try {
    const status = personasService.getPersonasSnapshotStatus();

    return res.json({
      ok: true,
      snapshot: status,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message || "Error obteniendo estado del snapshot",
    });
  }
}

module.exports = {
  getPersonas,
  getAccionesPersona,
  getLocalidades,
  getFiltros,
  refreshSnapshot,
  getSnapshotStatus,
};