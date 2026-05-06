const formulariosService = require("../services/formulariosService");

async function getFormularios(req, res) {
  try {
    const asenum = req.auth?.user?.asenum;
    const { periodo_dias = 30, estatus = "Todos" } = req.query;

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

async function getFormulariosPendientes(req, res) {
  try {
    const asenum = req.auth?.user?.asenum;
    const data = await formulariosService.getFormulariosPendientesByAsesor({ asenum });

    return res.json({
      ok: true,
      asesor: data.asesor,
      total: data.total,
      items: data.items,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo formularios pendientes",
    });
  }
}

async function getProyectosFormulario(req, res) {
  try {
    const asenum = req.auth?.user?.asenum;
    const data = await formulariosService.getProyectosFormulario({
      asenum,
      fecha: req.query?.fecha,
    });

    return res.json({
      ok: true,
      fecha: data.fecha,
      total: data.total,
      items: data.items,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo proyectos",
    });
  }
}

async function verificarFormulario(req, res) {
  try {
    const asenum = req.auth?.user?.asenum;
    const data = await formulariosService.verificarFormulario({
      asenum,
      formulario: req.body?.formulario,
      asesorForm: req.body?.asesorForm,
    });

    return res.json({ ok: true, ...data });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error verificando formulario",
    });
  }
}

async function getFormularioDetalle(req, res) {
  try {
    const asenum = req.auth?.user?.asenum;
    const item = await formulariosService.getFormularioDetalle({
      asenum,
      fornum: req.params.fornum,
    });

    return res.json({ ok: true, item });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error obteniendo formulario",
    });
  }
}

async function enviarFormulario(req, res) {
  try {
    const asenum = req.auth?.user?.asenum;
    const data = await formulariosService.enviarFormulario({
      asenum,
      fornum: req.params.fornum,
      payload: req.body || {},
    });

    return res.json({ ok: true, ...data });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      ok: false,
      detail: error.message || "Error enviando formulario",
    });
  }
}

module.exports = {
  getFormularios,
  getFormulariosPendientes,
  getProyectosFormulario,
  verificarFormulario,
  getFormularioDetalle,
  enviarFormulario,
};
