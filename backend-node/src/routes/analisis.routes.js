const express = require("express");
const analisisController = require("../controllers/analisisController");

const router = express.Router();

router.get("/produccion", analisisController.getProduccion);
router.get("/acciones", analisisController.getAcciones);
router.get("/autoalquiler", analisisController.getAutoAlquiler);

module.exports = router;
