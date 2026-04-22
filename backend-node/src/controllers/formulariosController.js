const formulariosService = require("../services/formulariosService");

async function getFormularios(req, res) {
  try {
    const asenum = req.auth?.user?.asenum;
    const {
      periodo_dias = 30,
      estatus = "Todos",
    } = req.query;

    const data = await formulariosService.getFormulariosByAsesor({
      asenum,
      periodoDias: periodo_dias,
      estatus,
    });

    return res.json({
      ok: true,
      asesor: data.asesor,
      periodo_dias: data.periodo_dias,
      estatus: data.estatus,
      total: data.total,
      items: data.items,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo formularios",
    });
  }
}

module.exports = {
  getFormularios,
};