const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(process.cwd(), ".env");

dotenv.config({ path: envPath });

function getEnv(name, fallback = "") {
  const value = process.env[name];
  return value !== undefined ? String(value).trim() : fallback;
}

function getRequiredEnv(name) {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

module.exports = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: Number(getEnv("PORT", "8000")),

  DB_DRIVER: getEnv("DB_DRIVER", "ODBC Driver 18 for SQL Server"),
  DB_SERVER: getRequiredEnv("DB_SERVER"),
  DB_DATABASE: getRequiredEnv("DB_DATABASE"),
  DB_USER: getEnv("DB_USER", ""),
  DB_PASSWORD: getEnv("DB_PASSWORD", ""),
  DB_TRUSTED_CONNECTION: getEnv("DB_TRUSTED_CONNECTION", "false").toLowerCase() === "true",
  DB_TRUST_SERVER_CERTIFICATE:
    getEnv("DB_TRUST_SERVER_CERTIFICATE", "true").toLowerCase() === "true",

  SNAPSHOT_REFRESH_MINUTES: Number(getEnv("SNAPSHOT_REFRESH_MINUTES", "5")),
};