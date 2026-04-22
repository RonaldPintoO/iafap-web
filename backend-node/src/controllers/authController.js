const authService = require('../services/authService');

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

function getRequestMeta(req) {
  return {
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '',
    userAgent: req.headers['user-agent'] || '',
  };
}

async function login(req, res, next) {
  try {
    const result = await authService.login({
      asenum: req.body?.asenum,
      reqMeta: getRequestMeta(req),
    });

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        code: result.code,
        detail: result.message,
        remainingSeconds: result.remainingSeconds || 0,
        attempts: result.attempts || 0,
      });
    }

    return res.json({
      ok: true,
      token: result.session.token,
      user: authService.getPublicSession(result.session),
    });
  } catch (error) {
    return next(error);
  }
}

async function status(req, res, next) {
  try {
    const state = await authService.getClientLockStatus(getRequestMeta(req));
    return res.json({
      ok: true,
      blocked: state.blocked,
      remainingSeconds: state.remainingSeconds || 0,
      attempts: state.attempts || 0,
      detail: state.message || '',
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const token = readBearerToken(req);
    const session = await authService.getSession(token);

    if (!session) {
      return res.status(401).json({
        ok: false,
        code: 'UNAUTHORIZED',
        detail: 'Sesión no válida o expirada.',
      });
    }

    return res.json({
      ok: true,
      user: authService.getPublicSession(session),
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = readBearerToken(req);
    await authService.logout(token, getRequestMeta(req));
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  status,
  me,
  logout,
  readBearerToken,
};