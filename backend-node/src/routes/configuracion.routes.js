const express = require("express");
const configuracionController = require("../controllers/configuracionController");

const router = express.Router();

router.get("/", configuracionController.getAsesores);

module.exports = router;