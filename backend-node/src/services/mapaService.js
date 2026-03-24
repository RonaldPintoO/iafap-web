const snapshotService = require("./snapshotService");
const { cleanText } = require("../utils/text");

function formatFecha(value) {
  if (!value) return null;

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString();
  } catch (error) {
    return String(value);
  }
}

function buildDireccion(calle, nroPuerta) {
  const calleTxt = cleanText(calle);
  const puertaTxt = cleanText(nroPuerta);

  if (calleTxt && puertaTxt) return `${calleTxt} ${puertaTxt}`;
  if (calleTxt) return calleTxt;
  if (puertaTxt) return puertaTxt;

  return "";
}

function normalizeText(value) {
  return cleanText(value).toUpperCase();
}

function filtrarItemsMapa(
  items,
  {
    edadMin = null,
    edadMax = null,
    tipoPersona = null,
    localidad = "Todos",
  }
) {
  const tipo = tipoPersona ? String(tipoPersona).trim().toLowerCase() : "";
  const localidadNorm = normalizeText(localidad);

  return items.filter((item) => {
    const lat = item.latitud;
    const lng = item.longitud;

    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return false;
    }

    if (Number(lat) === 0 && Number(lng) === 0) {
      return false;
    }

    if (localidadNorm && localidadNorm !== "TODOS") {
      if (normalizeText(item.ciudad) !== localidadNorm) {
        return false;
      }
    }

    const edad = item.edad;

    if (edadMin !== null && edadMin !== "" && edad !== null && edad !== undefined) {
      if (Number(edad) < Number(edadMin)) return false;
    }

    if (edadMax !== null && edadMax !== "" && edad !== null && edad !== undefined) {
      if (Number(edad) > Number(edadMax)) return false;
    }

    if (tipo === "nacional" && item.tieneDocumentoExtranjero) {
      return false;
    }

    if (tipo === "extranjero" && !item.tieneDocumentoExtranjero) {
      return false;
    }

    return true;
  });
}

function agruparPorCoordenadas(items) {
  const grouped = new Map();

  for (const item of items) {
    const lat = item.latitud;
    const lng = item.longitud;

    if (lat === null || lng === null || lat === undefined || lng === undefined) {
      continue;
    }

    // Se mantiene esta inversión porque es la que ya venías usando
    // y hace que el frontend pinte correctamente.
    const key = `${Number(lng)}__${Number(lat)}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        lat: Number(lng),
        lng: Number(lat),
        count: 0,
        items: [],
      });
    }

    const group = grouped.get(key);

    group.items.push({
      cedula: cleanText(item.cedula),
      primerNombre: cleanText(item.primerNombre),
      primerApellido: cleanText(item.primerApellido),
      fechaNac: formatFecha(item.fechaNac),
      edad: item.edad,
      asidetalle: cleanText(item.asidetalle),
      telefono: cleanText(item.telefono),
      celular: cleanText(item.celular),
      direccion: buildDireccion(item.calle, item.nroPuerta),
      tipoDocumentoExtranjero: cleanText(item.tipoDocumentoExtranjero),
      documentoExtranjero: cleanText(item.documentoExtranjero),
      paisExtranjero: cleanText(item.paisExtranjero),
      idPaisExtranjero: item.idPaisExtranjero,
    });

    group.count += 1;
  }

  return Array.from(grouped.values());
}

async function getMapaData({
  asesor = null,
  edadMin = null,
  edadMax = null,
  tipoPersona = null,
  localidad = "Todos",
}) {
  await snapshotService.ensureSnapshotReady();

  const rows = snapshotService.getItemsByAsesor(asesor);
  const filteredRows = filtrarItemsMapa(rows, {
    edadMin,
    edadMax,
    tipoPersona,
    localidad,
  });

  const points = agruparPorCoordenadas(filteredRows);

  return {
    asesor,
    edadMin,
    edadMax,
    tipoPersona,
    localidad,
    total_rows: filteredRows.length,
    total_points: points.length,
    points,
  };
}

module.exports = {
  agruparPorCoordenadas,
  getMapaData,
};