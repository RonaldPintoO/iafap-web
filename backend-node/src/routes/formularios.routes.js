const express = require("express");
const formulariosController = require("../controllers/formulariosController");
const formulariosCatalogosController = require("../controllers/formulariosCatalogosController");

const router = express.Router();

router.get("/", formulariosController.getFormularios);

router.get("/catalogos", formulariosCatalogosController.getCatalogosResumen);
router.get("/catalogos/paises", formulariosCatalogosController.getPaises);
router.get("/catalogos/departamentos", formulariosCatalogosController.getDepartamentos);
router.get("/catalogos/localidades", formulariosCatalogosController.getLocalidades);

module.exports = router;