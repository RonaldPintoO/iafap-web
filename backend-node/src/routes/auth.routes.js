const express = require('express');
const controller = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/login', controller.login);
router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);

module.exports = router;
