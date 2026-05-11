const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { login, changePassword, getCurrentUser } = require('../controllers/authController');

router.post('/login', login);
router.post('/change-password', changePassword);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;