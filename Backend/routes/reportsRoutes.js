// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/reportController');

// ── User routes ───────────────────────────────────────────────────────────────

// POST /report — submit a violation report (with optional image)
router.post('/report', requireAuth, upload.single('image'), ctrl.submitReport);

// GET /reports — get logged-in user's reports
router.get('/reports', requireAuth, ctrl.getUserReports);

// GET /leaderboard — public leaderboard
router.get('/leaderboard', ctrl.getLeaderboard);

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET /admin/reports — all reports with filters
router.get('/admin/reports', requireAdmin, ctrl.getAllReports);

// GET /admin/stats — summary counts
router.get('/admin/stats', requireAdmin, ctrl.getStats);

// PUT /admin/report/:id — approve or reject
router.put('/admin/report/:id', requireAdmin, ctrl.actionReport);

module.exports = router;