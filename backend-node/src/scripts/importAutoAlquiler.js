const { importAutoAlquiler } = require("../services/autoAlquilerImportService");
const { closePool } = require("../config/database");

async function main() {
  try {
    console.log("[AUTOALQUILER] Iniciando importación...");

    const result = await importAutoAlquiler();

    console.log("[AUTOALQUILER] Importación finalizada.");
    console.log(JSON.stringify(result, null, 2));

    process.exitCode = 0;
  } catch (error) {
    console.error("[AUTOALQUILER] Error en importación:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();