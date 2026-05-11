const estadisticasService = require("../services/estadisticasService");

function getPeriodoFromQuery(req) {
  return {
    fechaInicio: req.query.fecha_inicio,
    fechaFin: req.query.fecha_fin,
  };
}

async function getRankingProduccion(req, res, next) {
  try {
    const { fechaInicio, fechaFin } = getPeriodoFromQuery(req);
    const data = await estadisticasService.getRankingProduccion({ fechaInicio, fechaFin });

    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRankingProduccion,
};
