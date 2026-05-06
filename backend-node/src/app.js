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

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: "15mb" }));

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

  res.status(err.statusCode || 500).json({
    ok: false,
    detail: err?.message || "Error interno del servidor",
  });
});

module.exports = app;
