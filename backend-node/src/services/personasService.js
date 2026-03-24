const snapshotService = require("./snapshotService");

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function safePage(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function safePageSize(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 100;
  return Math.min(Math.floor(n), 100);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function filterItemsByLocalidad(items, localidad) {
  const localidadNorm = normalizeText(localidad);

  if (!localidadNorm || localidadNorm === "TODOS") {
    return items;
  }

  return items.filter((item) => normalizeText(item.ciudad) === localidadNorm);
}

function matchTexto(item, texto) {
  const query = normalizeText(texto);
  if (!query) return true;

  const haystack = [
    item.nombreCompleto,
    item.primerNombre,
    item.segundoNombre,
    item.primerApellido,
    item.segundoApellido,
    item.cedula,
    item.calle,
    item.telefono,
    item.celular,
  ]
    .map(normalizeText)
    .join(" ");

  return haystack.includes(query);
}

function matchTipo(item, tipo) {
  const value = normalizeText(tipo);
  if (!value || value === "TODOS") return true;
  return normalizeText(item.asidetalle) === value;
}

function matchEdad(item, edadDesde, edadHasta) {
  const edad = Number(item.edad);

  if (!Number.isFinite(edad)) return false;

  if (edadDesde !== null && edad < edadDesde) return false;
  if (edadHasta !== null && edad > edadHasta) return false;

  return true;
}

function matchEdadParidad(item, edadParidad) {
  const paridad = normalizeText(edadParidad);

  if (!paridad || paridad === "TODAS") return true;

  const edad = Number(item.edad);
  if (!Number.isFinite(edad)) return false;

  if (paridad === "PAR") return edad % 2 === 0;
  if (paridad === "IMPAR") return edad % 2 !== 0;

  return true;
}

function matchNacionalidad(item, nacionalidad) {
  const value = normalizeText(nacionalidad);

  if (!value || value === "TODOS") return true;
  if (value === "NACIONAL") return !item.tieneDocumentoExtranjero;
  if (value === "EXTRANJERO") return Boolean(item.tieneDocumentoExtranjero);

  return true;
}

function matchEstado(item, estado) {
  const value = normalizeText(estado);

  if (!value || value === "TODOS") return true;
  return normalizeText(item.estadoFiltro) === value;
}

function getDiferenciaDias(ts) {
  if (!ts) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fecha = new Date(ts);
  fecha.setHours(0, 0, 0, 0);

  const diffMs = hoy.getTime() - fecha.getTime();
  return Math.floor(diffMs / 86400000);
}

function matchFechaAccion(item, fechaAccion) {
  const value = cleanText(fechaAccion);

  if (!value || normalizeText(value) === "TODOS") return true;

  const dias = getDiferenciaDias(item.ultimaAccionTs);
  if (dias === null || dias < 0) return false;

  if (value === "0-7") return dias >= 0 && dias <= 7;
  if (value === "8-15") return dias >= 8 && dias <= 15;
  if (value === "16-30") return dias >= 16 && dias <= 30;
  if (value === "31-180") return dias >= 31 && dias <= 180;
  if (value === "181-360") return dias >= 181 && dias <= 360;
  if (value === "+360") return dias > 360;

  return true;
}

function matchAccion(item, accion) {
  const value = normalizeText(accion);

  if (!value || value === "TODOS") return true;
  return normalizeText(item.resnom) === value;
}

function matchLey(item, ley) {
  const value = normalizeText(ley);

  if (!value || value === "TODOS") return true;
  return normalizeText(item.leyLabel) === value;
}

function filterItems(items, filters) {
  const edadDesde = toNumberOrNull(filters.edadDesde);
  const edadHasta = toNumberOrNull(filters.edadHasta);

  return items.filter((item) => {
    if (!matchTexto(item, filters.texto)) return false;
    if (!matchTipo(item, filters.tipo)) return false;
    if (!matchEdad(item, edadDesde, edadHasta)) return false;
    if (!matchEdadParidad(item, filters.edadParidad)) return false;
    if (!matchNacionalidad(item, filters.nacionalidad)) return false;
    if (!matchEstado(item, filters.estado)) return false;
    if (!matchFechaAccion(item, filters.fechaAccion)) return false;
    if (!matchAccion(item, filters.accion)) return false;
    if (!matchLey(item, filters.ley)) return false;

    return true;
  });
}

function sortAndUnique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

async function getPersonas({
  asesor,
  page = 1,
  pageSize = 100,
  localidad = "Todos",
  texto = "",
  tipo = "Todos",
  edadDesde = "",
  edadHasta = "",
  edadParidad = "Todas",
  nacionalidad = "Todos",
  estado = "Todos",
  fechaAccion = "Todos",
  accion = "Todos",
  ley = "Todos",
}) {
  const asesorTxt = cleanText(asesor);

  if (!asesorTxt) {
    const error = new Error("El parámetro 'asesor' es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  const edadDesdeNum = toNumberOrNull(edadDesde);
  const edadHastaNum = toNumberOrNull(edadHasta);

  if (
    edadDesdeNum !== null &&
    edadHastaNum !== null &&
    edadDesdeNum > edadHastaNum
  ) {
    const error = new Error("La edad desde no puede ser mayor que la edad hasta");
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  const currentPage = safePage(page);
  const currentPageSize = safePageSize(pageSize);

  const allItems = snapshotService.getItemsByAsesor(asesorTxt);
  const byLocalidad = filterItemsByLocalidad(allItems, localidad);
  const filteredItems = filterItems(byLocalidad, {
    texto,
    tipo,
    edadDesde,
    edadHasta,
    edadParidad,
    nacionalidad,
    estado,
    fechaAccion,
    accion,
    ley,
  });

  const total = filteredItems.length;
  const totalPages = total > 0 ? Math.ceil(total / currentPageSize) : 0;
  const normalizedPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const start = (normalizedPage - 1) * currentPageSize;
  const end = start + currentPageSize;

  const snapshotStatus = snapshotService.getSnapshotStatus();

  return {
    items: filteredItems.slice(start, end),
    total,
    page: normalizedPage,
    page_size: currentPageSize,
    total_pages: totalPages,
    localidad: cleanText(localidad) || "Todos",
    snapshot_version: snapshotStatus.version,
    snapshot_last_completed_at: snapshotStatus.lastCompletedAt,
    snapshot_is_refreshing: snapshotStatus.isRefreshing,
  };
}

async function getLocalidades({ asesor }) {
  const asesorTxt = cleanText(asesor);

  if (!asesorTxt) {
    const error = new Error("El parámetro 'asesor' es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  const items = snapshotService.getItemsByAsesor(asesorTxt);

  const unique = new Set();

  for (const item of items) {
    const ciudad = cleanText(item.ciudad);
    if (ciudad) {
      unique.add(ciudad);
    }
  }

  const localidades = Array.from(unique).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

  return ["Todos", ...localidades];
}

async function getFiltrosPersonas({ asesor, localidad = "Todos" }) {
  const asesorTxt = cleanText(asesor);

  if (!asesorTxt) {
    const error = new Error("El parámetro 'asesor' es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  await snapshotService.ensureSnapshotReady();

  const items = snapshotService.getItemsByAsesor(asesorTxt);
  const byLocalidad = filterItemsByLocalidad(items, localidad);

  const tipos = sortAndUnique(byLocalidad.map((item) => cleanText(item.asidetalle)));
  const acciones = sortAndUnique(
    byLocalidad
      .map((item) => cleanText(item.resnom))
      .filter((value) => value && value !== "Sin Acción")
  );

  return {
    tipos: ["Todos", ...tipos],
    acciones: ["Todos", ...acciones],
  };
}

async function refreshPersonasSnapshot() {
  return snapshotService.refreshSnapshot({
    reason: "manual-endpoint",
    force: true,
  });
}

async function getAccionesPersona({ cedula }) {
  const cedulaTxt = String(cedula || "").trim();

  if (!cedulaTxt) {
    const error = new Error("Cédula requerida");
    error.statusCode = 400;
    throw error;
  }

  // 🔹 1. asegurar snapshot
  await snapshotService.ensureSnapshotReady();

  // 🔹 2. traer snapshot (instantáneo)
  const snapshotItems =
    snapshotService.getAccionesByDocumento(cedulaTxt) || [];

  // 🔥 3. refresh en background (NO bloquea)
  snapshotService
    .refreshAccionesForDocumento(cedulaTxt)
    .catch((err) => {
      console.error(
        "[acciones] refresh puntual error:",
        err?.message || err
      );
    });

  return {
    total: snapshotItems.length,
    items: snapshotItems,
  };
}

function getPersonasSnapshotStatus() {
  return snapshotService.getSnapshotStatus();
}

module.exports = {
  getPersonas,
  getLocalidades,
  getFiltrosPersonas,
  refreshPersonasSnapshot,
  getAccionesPersona,
  getPersonasSnapshotStatus,
};