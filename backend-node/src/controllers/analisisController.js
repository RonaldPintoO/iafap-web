const analisisService = require("../services/analisisService");

function getAsesorFromAuth(req) {
  return (
    req.auth?.user?.asenum ||
    req.auth?.user?.asesor ||
    req.auth?.asenum ||
    req.user?.asenum ||
    req.user?.asesor ||
    null
  );
}

function getPeriodoFromQuery(req) {
  return {
    fechaInicio: req.query.fecha_inicio,
    fechaFin: req.query.fecha_fin,
  };
}

async function getProduccion(req, res, next) {
  try {
    const asesorNumero = getAsesorFromAuth(req);
    const { fechaInicio, fechaFin } = getPeriodoFromQuery(req);
    const data = await analisisService.getProduccionAnalisis({ asesorNumero, fechaInicio, fechaFin });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAcciones(req, res, next) {
  try {
    const asesorNumero = getAsesorFromAuth(req);
    const { fechaInicio, fechaFin } = getPeriodoFromQuery(req);
    const data = await analisisService.getAccionesAnalisis({ asesorNumero, fechaInicio, fechaFin });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAutoAlquiler(req, res, next) {
  try {
    const asesorNumero = getAsesorFromAuth(req);
    const { fechaInicio, fechaFin } = getPeriodoFromQuery(req);
    const data = await analisisService.getAutoAlquilerAnalisis({ asesorNumero, fechaInicio, fechaFin });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProduccion,
  getAcciones,
  getAutoAlquiler,
};
