const express = require("express");
const mapaController = require("../controllers/mapaController");

const router = express.Router();

router.get("/", mapaController.getMapa);

module.exports = router;