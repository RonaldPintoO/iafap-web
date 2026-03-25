const { getPool } = require("../config/database");
const { toTitleCase } = require("../utils/text");

const GRUPOS_CANELONES = {
  770: "Canelones Grupo 1 - 770",
  771: "Canelones Grupo 2 - 771",
  772: "Canelones Grupo 3 - 772",
  773: "Canelones Grupo 4 - 773",
};

function buildAsesorLabel(caAsesor, caCiudad) {
  const asesorNum = Number(caAsesor);

  if (GRUPOS_CANELONES[asesorNum]) {
    return GRUPOS_CANELONES[asesorNum];
  }

  if (asesorNum >= 11000) {
    return `Montevideo ${asesorNum}`;
  }

  const ciudad = toTitleCase(caCiudad);
  return `${ciudad} - ${asesorNum}`;
}

async function getConfiguracionAsesores() {
  const pool = await getPool();

  const query = `
    SELECT
      CAST([asenum] AS int) AS ca_asesor,
      CAST([asenom] AS varchar(200)) AS ca_ciudad
    FROM [2023_AFAP_Gestion].[dbo].[ASESORES]
    WHERE TRY_CAST([asenum] AS int) IS NOT NULL
    AND [asedatos] = 1
    ORDER BY CAST([asenum] AS int)
  `;

  const result = await pool.request().query(query);
  const rows = Array.isArray(result.recordset) ? result.recordset : [];

  return rows.map((row) => ({
    value: String(row.ca_asesor),
    label: buildAsesorLabel(row.ca_asesor, row.ca_ciudad),
  }));
}

module.exports = {
  getConfiguracionAsesores,
  buildAsesorLabel,
};