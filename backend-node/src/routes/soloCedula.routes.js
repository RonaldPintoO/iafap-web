const express = require("express");
const router = express.Router();

const controller = require("../controllers/soloCedulaController");

router.get("/:cedula", controller.getPersonaByCedula);

module.exports = router;