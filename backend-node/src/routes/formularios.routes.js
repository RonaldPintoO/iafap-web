const express = require("express");
const formulariosController = require("../controllers/formulariosController");
const formulariosCatalogosController = require("../controllers/formulariosCatalogosController");

const router = express.Router();

router.get("/", formulariosController.getFormularios);
router.get("/pendientes", formulariosController.getFormulariosPendientes);
router.get("/proyectos", formulariosController.getProyectosFormulario);
router.post("/verificar", formulariosController.verificarFormulario);

router.get("/catalogos", formulariosCatalogosController.getCatalogosResumen);
router.get("/catalogos/paises", formulariosCatalogosController.getPaises);
router.get("/catalogos/departamentos", formulariosCatalogosController.getDepartamentos);
router.get("/catalogos/localidades", formulariosCatalogosController.getLocalidades);

router.get("/:fornum", formulariosController.getFormularioDetalle);
router.put("/:fornum", formulariosController.enviarFormulario);

module.exports = router;
