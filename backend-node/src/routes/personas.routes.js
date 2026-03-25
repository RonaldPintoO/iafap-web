const express = require("express");
const personasController = require("../controllers/personasController");

const router = express.Router();

router.get("/", personasController.getPersonas);
router.get("/localidades", personasController.getLocalidades);
router.get("/filtros", personasController.getFiltros);
router.get("/snapshot/status", personasController.getSnapshotStatus);
router.post("/snapshot/refresh", personasController.refreshSnapshot);
router.get("/acciones/:accnum/adjunto", personasController.getAccionAdjuntoPdf);
router.get("/:cedula/acciones", personasController.getAccionesPersona);

module.exports = router;