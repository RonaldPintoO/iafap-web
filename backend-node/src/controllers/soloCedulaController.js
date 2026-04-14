const { getPersonaDetalleByCedula } = require("../services/snapshotService");

async function getPersonaByCedula(req, res) {
  try {
    const { cedula } = req.params;

    const data = await getPersonaDetalleByCedula(cedula);

    if (!data) {
      return res.status(404).json({
        ok: false,
        error: "No se encontró información para la cédula ingresada.",
      });
    }

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Error al consultar la cédula.",
    });
  }
}

module.exports = {
  getPersonaByCedula,
};
