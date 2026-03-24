const configuracionService = require("../services/configuracionService");

async function getAsesores(req, res) {
  try {
    const items = await configuracionService.getConfiguracionAsesores();

    return res.json({
      ok: true,
      items,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: `Error obteniendo asesores: ${error.message || error}`,
    });
  }
}

module.exports = {
  getAsesores,
};