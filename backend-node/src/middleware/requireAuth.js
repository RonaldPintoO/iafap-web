const authService = require('../services/authService');
const { readBearerToken } = require('../controllers/authController');

async function requireAuth(req, res, next) {
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

    req.auth = {
      token,
      user: authService.getPublicSession(session),
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = requireAuth;
