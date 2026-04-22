const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const configuracionRoutes = require("./routes/configuracion.routes");
const mapaRoutes = require("./routes/mapa.routes");
const personasRoutes = require("./routes/personas.routes");
const soloCedulaRoutes = require("./routes/soloCedula.routes");
const authRoutes = require("./routes/auth.routes");
const requireAuth = require("./middleware/requireAuth");
const formulariosRoutes = require("./routes/formularios.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/configuracion/asesores", requireAuth, configuracionRoutes);
app.use("/mapa", requireAuth, mapaRoutes);
app.use("/personas", requireAuth, personasRoutes);
app.use("/solo-cedula", requireAuth, soloCedulaRoutes);
app.use("/formularios", requireAuth, formulariosRoutes);

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
