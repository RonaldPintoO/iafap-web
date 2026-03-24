const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const configuracionRoutes = require("./routes/configuracion.routes");
const mapaRoutes = require("./routes/mapa.routes");
const personasRoutes = require("./routes/personas.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/configuracion/asesores", configuracionRoutes);
app.use("/mapa", mapaRoutes);
app.use("/personas", personasRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    detail: "Ruta no encontrada",
  });
});

app.use((err, req, res, next) => {
  console.error("[app] error no controlado:", err);

  res.status(500).json({
    ok: false,
    detail: "Error interno del servidor",
  });
});

module.exports = app;