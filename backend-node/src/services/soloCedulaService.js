const db = require("../config/database");

function clean(value) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  return v === "" ? null : v;
}

function formatFecha(fecha) {
  if (!fecha) return null;

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

function calcularEdad(fecha) {
  if (!fecha) return null;

  const hoy = new Date();
  const nac = new Date(fecha);

  if (Number.isNaN(nac.getTime())) return null;

  let edad = hoy.getFullYear() - nac.getFullYear();
  const mesDiff = hoy.getMonth() - nac.getMonth();

  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nac.getDate())) {
    edad -= 1;
  }

  return edad;
}

function normalizeSexo(value) {
  const v = clean(value)?.toUpperCase();

  if (v === "M" || v === "1") return "Masculino";
  if (v === "F" || v === "2") return "Femenino";

  return v || null;
}

function buildDireccion(row) {
  const calle = clean(row.percalle);
  const numero = clean(row.perpuerta);
  const entre1 = clean(row.perentre1);
  const entre2 = clean(row.perentre2);
  const manzana = clean(row.permanzana);
  const solar = clean(row.persolar);
  const ruta = clean(row.perruta);

  let km = clean(row.perkm);
  if (km === "0") km = null;

  return {
    calle: calle || "N/D",
    numero: numero || "N/D",
    esquinas: [entre1, entre2].filter(Boolean).join(" y ") || null,
    manzana: manzana || null,
    solar: solar || null,
    ruta: ruta || null,
    km: km || null,
  };
}

async function getPersonaByCedula(cedula) {
  const pool = await db.getPool();

  const request = pool.request();
  request.input("ci", db.sql.VarChar, String(cedula).trim());

  const result = await request.query(`
    SELECT TOP 1
      perci,
      perfecnac,
      perprinom,
      persegnom,
      perpriape,
      persegape,
      persexo,
      perdepto,
      perciudad,
      percalle,
      perpuerta,
      perentre1,
      perentre2,
      pertel,
      percel,
      permanzana,
      persolar,
      perruta,
      perkm
    FROM [2023_AFAP_Gestion].[dbo].[PERSONA]
    WHERE perci = @ci
  `);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    cedula: clean(row.perci),
    nombre: [clean(row.perprinom), clean(row.persegnom)].filter(Boolean).join(" "),
    apellido: [clean(row.perpriape), clean(row.persegape)].filter(Boolean).join(" "),
    nombreCompleto: [
      clean(row.perprinom),
      clean(row.persegnom),
      clean(row.perpriape),
      clean(row.persegape),
    ]
      .filter(Boolean)
      .join(" "),
    fechaNacimiento: formatFecha(row.perfecnac),
    edad: calcularEdad(row.perfecnac),
    sexo: normalizeSexo(row.persexo),
    departamento: clean(row.perdepto),
    ciudad: clean(row.perciudad),
    direccion: buildDireccion(row),
    telefonos: {
      telefono: clean(row.pertel),
      celular: clean(row.percel),
    },
  };
}

module.exports = {
  getPersonaByCedula,
};