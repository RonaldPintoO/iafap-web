const sql = require("mssql");
const { getPool } = require("../config/database");

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

async function getPaises() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
        CAST([idpais] AS int) AS idpais,
        LTRIM(RTRIM([nombre])) AS nombre
    FROM [2023_AFAP_Gestion].[dbo].[PAISES_BPS]
    WHERE NULLIF(LTRIM(RTRIM([nombre])), '') IS NOT NULL
    ORDER BY [nombre];
  `);

  return (result.recordset || []).map((row) => ({
    idpais: Number(row.idpais),
    nombre: cleanText(row.nombre),
  }));
}

async function getDepartamentos() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT DISTINCT
        LTRIM(RTRIM([locdepdep])) AS departamento
    FROM [2023_AFAP_Gestion].[dbo].[LOCDEP]
    WHERE NULLIF(LTRIM(RTRIM([locdepdep])), '') IS NOT NULL
      AND UPPER(LTRIM(RTRIM([locdepdep]))) NOT IN ('S/D', 'N/A')
    ORDER BY departamento;
  `);

  return (result.recordset || []).map((row) => cleanText(row.departamento));
}

async function getLocalidadesByDepartamento(departamento) {
  const dep = cleanText(departamento);
  if (!dep) return [];

  const pool = await getPool();

  const result = await pool
    .request()
    .input("departamento", sql.VarChar(100), dep)
    .query(`
      SELECT
          CAST([locdepciu] AS int) AS idlocalidad,
          LTRIM(RTRIM([locdepdep])) AS departamento,
          LTRIM(RTRIM([locdeploc])) AS localidad
      FROM [2023_AFAP_Gestion].[dbo].[LOCDEP]
      WHERE LTRIM(RTRIM([locdepdep])) = @departamento
        AND NULLIF(LTRIM(RTRIM([locdeploc])), '') IS NOT NULL
        AND UPPER(LTRIM(RTRIM([locdeploc]))) NOT IN ('S/D', 'N/A')
      ORDER BY localidad;
    `);

  return (result.recordset || []).map((row) => ({
    idlocalidad: Number(row.idlocalidad),
    departamento: cleanText(row.departamento),
    localidad: cleanText(row.localidad),
  }));
}

async function getCatalogosResumen() {
  const [paises, departamentos] = await Promise.all([
    getPaises(),
    getDepartamentos(),
  ]);

  return { paises, departamentos };
}

module.exports = {
  getPaises,
  getDepartamentos,
  getLocalidadesByDepartamento,
  getCatalogosResumen,
};