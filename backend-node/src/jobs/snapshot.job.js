const snapshotService = require("../services/snapshotService");

async function initSnapshotJob() {
  console.log("[snapshot.job] inicializando snapshot de personas...");

  try {
    await snapshotService.ensureSnapshotReady();

    const status = snapshotService.getSnapshotStatus();

    console.log(
      `[snapshot.job] snapshot inicial listo | version=${status.version} | items=${status.totalItems} | asesores=${status.totalAsesores}`
    );
  } catch (error) {
    console.error(
      "[snapshot.job] error en carga inicial del snapshot:",
      error?.message || error
    );
  }

  snapshotService.startAutoRefresh();

  console.log(
    `[snapshot.job] auto refresh iniciado cada ${Math.floor(
      snapshotService.SNAPSHOT_REFRESH_MS / 1000
    )} segundos`
  );
}

async function shutdownSnapshotJob() {
  try {
    snapshotService.stopAutoRefresh();
    console.log("[snapshot.job] auto refresh detenido");
  } catch (error) {
    console.error(
      "[snapshot.job] error deteniendo snapshot job:",
      error?.message || error
    );
  }
}

module.exports = {
  initSnapshotJob,
  shutdownSnapshotJob,
};