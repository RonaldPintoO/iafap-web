const soloCedulaService = require("../services/soloCedulaService");

async function getPersonaByCedula(req, res) {
  try {
    const { cedula } = req.params;

    if (!cedula) {
      return res.status(400).json({
        ok: false,
        error: "Cédula requerida",
      });
    }

    const persona = await soloCedulaService.getPersonaByCedula(cedula);

    if (!persona) {
      return res.json({
        ok: true,
        data: null,
      });
    }

    return res.json({
      ok: true,
      data: persona,
    });
  } catch (error) {
    console.error("Error solo cédula:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno",
    });
  }
}

module.exports = {
  getPersonaByCedula,
};