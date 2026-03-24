const sql = require("mssql");
const env = require("./env");

let pool = null;

function buildSqlConfig() {
  const baseConfig = {
    server: env.DB_SERVER,
    database: env.DB_DATABASE,
    user: env.DB_USER,
    password: env.DB_PASSWORD,

    options: {
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
      encrypt: false,
    },

    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },

    connectionTimeout: 30000,
    requestTimeout: 120000,
  };

  if (env.DB_TRUSTED_CONNECTION) {
    return {
      ...baseConfig,
      user: undefined,
      password: undefined,
      options: {
        ...baseConfig.options,
        trustedConnection: true,
      },
    };
  }

  return baseConfig;
}

async function getPool() {
  if (pool) return pool;

  pool = await sql.connect(buildSqlConfig());
  return pool;
}

async function closePool() {
  if (!pool) return;

  await pool.close();
  pool = null;
}

async function testConnection() {
  const currentPool = await getPool();
  const request = currentPool.request();
  request.timeout = 30000;

  const result = await request.query("SELECT TOP 1 1 AS ok");
  const row = Array.isArray(result.recordset) ? result.recordset[0] : null;

  return Boolean(row && row.ok === 1);
}

module.exports = {
  sql,
  getPool,
  closePool,
  testConnection,
};
