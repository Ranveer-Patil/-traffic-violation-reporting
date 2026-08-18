// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ── POST /auth/login — mock login
router.post('/login', authController.login);

// ── GET /auth/me — return current session user
router.get('/me', authController.getMe);

// ── POST /auth/logout
router.post('/logout', authController.logout);

module.exports = router;