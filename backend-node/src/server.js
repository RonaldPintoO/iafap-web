const app = require("./app");
const env = require("./config/env");
const { closePool } = require("./config/database");
const { initSnapshotJob, shutdownSnapshotJob } = require("./jobs/snapshot.job");

let server = null;

async function startServer() {
  try {
    await initSnapshotJob();

    server = app.listen(env.PORT, () => {
      console.log(`[server] backend-node escuchando en puerto ${env.PORT}`);
    });
  } catch (error) {
    console.error("[server] error iniciando servidor:", error?.message || error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`[server] señal recibida: ${signal}. Cerrando...`);

  try {
    await shutdownSnapshotJob();
    await closePool();

    if (server) {
      server.close(() => {
        console.log("[server] servidor HTTP detenido");
        process.exit(0);
      });

      setTimeout(() => {
        console.error("[server] cierre forzado por timeout");
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error("[server] error durante cierre:", error?.message || error);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer();