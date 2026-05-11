const rateLimitModule = require("express-rate-limit");

const rateLimit =
  rateLimitModule.rateLimit ||
  rateLimitModule.default ||
  rateLimitModule;

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return String(forwardedFor).split(",")[0].trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown-ip"
  );
}

function getAsesorFromBody(req) {
  return (
    req.body?.asenum ||
    req.body?.asesor ||
    req.body?.asesor_numero ||
    req.body?.numeroAsesor ||
    req.body?.codigo ||
    "unknown-asesor"
  );
}

const loginIpRateLimit = rateLimit({
  windowMs: Number(process.env.AUTH_LOGIN_RATE_WINDOW_MS || 5 * 60 * 1000),
  max: Number(process.env.AUTH_LOGIN_RATE_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      code: "RATE_LIMITED",
      detail: "Demasiados intentos de ingreso. Espere unos minutos y vuelva a intentar.",
      retryAfterSeconds: Math.ceil(
        Number(process.env.AUTH_LOGIN_RATE_WINDOW_MS || 5 * 60 * 1000) / 1000,
      ),
    });
  },
});

const loginAsesorRateLimit = rateLimit({
  windowMs: Number(process.env.AUTH_LOGIN_RATE_WINDOW_MS || 5 * 60 * 1000),
  max: Number(process.env.AUTH_LOGIN_ASESOR_RATE_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${getClientIp(req)}:${getAsesorFromBody(req)}`,
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      code: "RATE_LIMITED",
      detail: "Demasiados intentos para este asesor. Espere unos minutos y vuelva a intentar.",
      retryAfterSeconds: Math.ceil(
        Number(process.env.AUTH_LOGIN_RATE_WINDOW_MS || 5 * 60 * 1000) / 1000,
      ),
    });
  },
});

module.exports = {
  loginRateLimiter: loginIpRateLimit,
  loginAsesorRateLimiter: loginAsesorRateLimit,
};