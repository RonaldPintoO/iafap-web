const formulariosCatalogosService = require("../services/formulariosCatalogosService");

async function getCatalogosResumen(req, res) {
  try {
    const data = await formulariosCatalogosService.getCatalogosResumen();
    return res.json({
      ok: true,
      paises: data.paises,
      departamentos: data.departamentos,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message || "Error obteniendo catálogos de formularios",
    });
  }
}

async function getPaises(req, res) {
  try {
    const items = await formulariosCatalogosService.getPaises();
    return res.json({
      ok: true,
      items,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message || "Error obteniendo países",
    });
  }
}

async function getDepartamentos(req, res) {
  try {
    const items = await formulariosCatalogosService.getDepartamentos();
    return res.json({
      ok: true,
      items,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message || "Error obteniendo departamentos",
    });
  }
}

async function getLocalidades(req, res) {
  try {
    const { departamento = "" } = req.query;

    const items =
      await formulariosCatalogosService.getLocalidadesByDepartamento(departamento);

    return res.json({
      ok: true,
      departamento,
      items,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message || "Error obteniendo localidades",
    });
  }
}

module.exports = {
  getCatalogosResumen,
  getPaises,
  getDepartamentos,
  getLocalidades,
};