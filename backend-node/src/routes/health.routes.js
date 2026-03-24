const express = require("express");
const { testConnection } = require("../config/database");

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({
    ok: true,
    message: "Backend funcionando",
  });
});

router.get("/db-test", async (req, res) => {
  try {
    const dbOk = await testConnection();

    return res.json({
      ok: true,
      db_ok: dbOk,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: `Error conectando a la base: ${error.message || error}`,
    });
  }
});

module.exports = router;