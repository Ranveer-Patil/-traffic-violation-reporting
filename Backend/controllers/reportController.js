// backend/controllers/reportController.js
const { Op } = require('sequelize');
const path = require('path');
const { User, Report } = require('../config/db');

const VIOLATION_TYPES = ['No Helmet', 'No Seatbelt', 'Signal Jump', 'Wrong Parking', 'Triple Riding', 'Mobile While Driving'];
const POINTS_PER_APPROVAL = 10;

// ── AI Validation ─────────────────────────────────────────────────────────────
function aiValidate(imagePath) {
  return !!imagePath;
}

// ── Duplicate Detection ───────────────────────────────────────────────────────
async function isDuplicate(vehicleNumber, violationType) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await Report.count({
    where: {
      vehicleNumber: vehicleNumber.toUpperCase(),
      violationType,
      createdAt: { [Op.gte]: oneHourAgo },
    },
  });
  return count > 0;
}

// ── POST /report ──────────────────────────────────────────────────────────────
exports.submitReport = async (req, res) => {
  try {
    const { vehicleNumber, violationType, lat, lng, address } = req.body;

    if (!vehicleNumber || !violationType) {
      if (req.file) require('fs').unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Vehicle number and violation type are required.' });
    }
    if (!VIOLATION_TYPES.includes(violationType)) {
      return res.status(400).json({ error: 'Invalid violation type.' });
    }
    const cleanVehicle = vehicleNumber.trim().toUpperCase();
    if (!/^[A-Z0-9\s\-]{3,15}$/.test(cleanVehicle)) {
      return res.status(400).json({ error: 'Invalid vehicle number format.' });
    }

    if (await isDuplicate(cleanVehicle, violationType)) {
      if (req.file) require('fs').unlinkSync(req.file.path);
      return res.status(409).json({ error: 'Duplicate report: same vehicle and violation already reported within 1 hour.' });
    }

    const imagePath = req.file ? req.file.filename : null;
    const aiVerified = aiValidate(imagePath);
    const status = aiVerified ? 'Pending' : 'Rejected';

    const report = await Report.create({
      userId: req.user.id,
      vehicleNumber: cleanVehicle,
      violationType,
      imagePath,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      address: address || null,
      status,
      aiVerified,
      pointsAwarded: 0,
    });

    res.status(201).json({
      success: true,
      report,
      message: aiVerified
        ? 'Report submitted successfully. Pending admin review.'
        : 'Report rejected: no image uploaded. AI validation failed.',
    });
  } catch (err) {
    console.error('submitReport error:', err);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
};

// ── GET /reports (user's own) ─────────────────────────────────────────────────
exports.getUserReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

// ── GET /admin/reports ────────────────────────────────────────────────────────
exports.getAllReports = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.violationType) where.violationType = req.query.violationType;
    if (req.query.date) {
      const d = new Date(req.query.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.createdAt = { [Op.between]: [d, next] };
    }

    const reports = await Report.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'points'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ reports });
  } catch (err) {
    console.error('getAllReports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

// ── PUT /admin/report/:id ─────────────────────────────────────────────────────
exports.actionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be Approved or Rejected.' });
    }

    const report = await Report.findByPk(id, { include: [{ model: User, as: 'user' }] });
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    if (report.status !== 'Pending') {
      return res.status(400).json({ error: `Report already ${report.status.toLowerCase()}.` });
    }

    let pointsAwarded = 0;
    if (action === 'Approved') {
      pointsAwarded = POINTS_PER_APPROVAL;
      await User.increment('points', { by: POINTS_PER_APPROVAL, where: { id: report.userId } });
    }

    await report.update({ status: action, pointsAwarded, adminNote: adminNote || null });

    res.json({
      success: true,
      message: `Report ${action.toLowerCase()}.${action === 'Approved' ? ` +${POINTS_PER_APPROVAL} points awarded to ${report.user?.name}.` : ''}`,
      report,
    });
  } catch (err) {
    console.error('actionReport error:', err);
    res.status(500).json({ error: 'Failed to update report.' });
  }
};

// ── GET /admin/stats ──────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, users] = await Promise.all([
      Report.count(),
      Report.count({ where: { status: 'Pending' } }),
      Report.count({ where: { status: 'Approved' } }),
      Report.count({ where: { status: 'Rejected' } }),
      User.count({ where: { role: 'user' } }),
    ]);
    res.json({ total, pending, approved, rejected, users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// ── GET /leaderboard ──────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'name', 'email', 'avatar', 'points'],
      order: [['points', 'DESC']],
      limit: 10,
    });
    res.json({ leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
};