const mapaService = require("../services/mapaService");

async function getMapa(req, res) {
  try {
    const {
      asesor = null,
      edad_min = null,
      edad_max = null,
      tipo_persona = null,
      localidad = "Todos",
    } = req.query;

    const data = await mapaService.getMapaData({
      asesor,
      edadMin: edad_min,
      edadMax: edad_max,
      tipoPersona: tipo_persona,
      localidad,
    });

    return res.json({
      ok: true,
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: `Error obteniendo mapa: ${error.message || error}`,
    });
  }
}

module.exports = {
  getMapa,
};