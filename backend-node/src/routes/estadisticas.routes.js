const express = require("express");
const estadisticasController = require("../controllers/estadisticasController");

const router = express.Router();

router.get("/ranking-produccion", estadisticasController.getRankingProduccion);

module.exports = router;
