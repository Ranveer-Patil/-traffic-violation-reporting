// backend/routes/verifyRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { requireAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/verifyController');

// POST /report/submit — Full AI-verified submission
router.post('/submit', requireAuth, upload.single('image'), ctrl.submitAndVerify);

// POST /report/verify-image — Pre-check image (no DB save)
router.post('/verify-image', requireAuth, upload.single('image'), ctrl.verifyImageOnly);

module.exports = router;
