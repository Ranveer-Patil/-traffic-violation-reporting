// backend/controllers/verifyController.js
const path = require('path');
const { Report, User } = require('../config/db');
const { verifyImage } = require('../services/aiService');
const { evaluate } = require('../services/ruleEngine');

// ── POST /report/submit — Full AI-powered submission ──────────────────────────
exports.submitAndVerify = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required.', finalDecision: 'REJECTED' });
    }

    const { violationType, lat, lng, address, consent } = req.body;
    if (!violationType) {
      return res.status(400).json({ error: 'Violation type is required.' });
    }
    if (consent !== 'true' && consent !== true) {
      return res.status(400).json({ error: 'You must consent to the terms before submitting.' });
    }

    // ── AI Verification Pipeline ──────────────────────────────────────────────
    const absolutePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const aiResult = await verifyImage(absolutePath);

    // ── Rule Engine ───────────────────────────────────────────────────────────
    const decision = evaluate(aiResult);

    // ── Store Report ──────────────────────────────────────────────────────────
    const report = await Report.create({
      userId: req.user.id,
      vehicleNumber: decision.plateNumber || req.body.vehicleNumber || 'UNDETECTED',
      violationType,
      imagePath: req.file.filename,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      address: address || null,
      status: decision.status,
      aiVerified: decision.finalDecision === 'ACCEPTED',
      fakeScore: decision.fakeScore,
      violationScore: decision.violationScore,
      plateValid: decision.plateValid,
      detectedPlate: decision.plateNumber || null,
      pointsAwarded: 0,
      aiMeta: JSON.stringify({
        labels: decision.labels,
        objects: decision.objects,
        rejections: decision.rejections,
        providers: decision.providers,
      }),
    });

    res.status(201).json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        imageUrl: `/uploads/${req.file.filename}`,
      },
      verification: {
        fakeScore: decision.fakeScore,
        vehicleDetected: decision.vehicleDetected,
        plateNumber: decision.plateNumber,
        plateValid: decision.plateValid,
        violationScore: decision.violationScore,
        finalDecision: decision.finalDecision,
      },
      message: decision.finalDecision === 'REJECTED'
        ? `Report rejected: ${decision.rejections.join('; ')}`
        : decision.finalDecision === 'NEEDS_REVIEW'
          ? 'Report flagged for manual review.'
          : 'Report accepted. Pending admin approval.',
    });
  } catch (err) {
    console.error('submitAndVerify error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// ── POST /report/verify-image — Image-only verification (no DB save) ──────────
exports.verifyImageOnly = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required.' });
    }

    const absolutePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const aiResult = await verifyImage(absolutePath);
    const decision = evaluate(aiResult);

    // Clean up — don't persist verify-only images
    const fs = require('fs');
    fs.unlink(absolutePath, () => {});

    res.json({
      fakeScore: decision.fakeScore,
      vehicleDetected: decision.vehicleDetected,
      plateNumber: decision.plateNumber,
      plateValid: decision.plateValid,
      violationScore: decision.violationScore,
      finalDecision: decision.finalDecision,
      rejections: decision.rejections,
      labels: decision.labels.slice(0, 8),
      objects: decision.objects.slice(0, 5),
    });
  } catch (err) {
    console.error('verifyImageOnly error:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
};
