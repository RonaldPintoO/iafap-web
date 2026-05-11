const express = require('express');
const controller = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');
const {
  loginRateLimiter,
  loginAsesorRateLimiter,
} = require('../middleware/authRateLimit');

const router = express.Router();

router.get('/status', controller.status);
router.post('/login', loginRateLimiter, loginAsesorRateLimiter, controller.login);
router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);

module.exports = router;
