const express = require("express");
const personasController = require("../controllers/personasController");

const router = express.Router();

router.get("/", personasController.getPersonas);
router.get("/localidades", personasController.getLocalidades);
router.get("/filtros", personasController.getFiltros);
router.get("/:cedula/acciones", personasController.getAccionesPersona);
router.get("/snapshot/status", personasController.getSnapshotStatus);
router.post("/snapshot/refresh", personasController.refreshSnapshot);

module.exports = router;