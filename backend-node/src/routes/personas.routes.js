const express = require("express");
const personasController = require("../controllers/personasController");

const router = express.Router();

router.get("/", personasController.getPersonas);
router.get("/localidades", personasController.getLocalidades);
router.get("/filtros", personasController.getFiltros);
router.get("/snapshot/status", personasController.getSnapshotStatus);
router.post("/snapshot/refresh", personasController.refreshSnapshot);
router.get("/acciones/catalogos", personasController.getAccionesCatalogos);
router.get("/agendados", personasController.getAgendados);
router.get("/acciones/:accnum/adjunto", personasController.getAccionAdjuntoPdf);
router.put("/acciones/:accnum", personasController.actualizarAccionPersona);
router.get("/:cedula/acciones", personasController.getAccionesPersona);
router.post("/:cedula/acciones", personasController.crearAccionPersona);
router.post("/telefono-bps", personasController.getTelefonoBps);
router.get("/:cedula/vinculos", personasController.getVinculosPersona);
router.get("/:cedula/formulario", personasController.getFormularioFoto);
module.exports = router;
