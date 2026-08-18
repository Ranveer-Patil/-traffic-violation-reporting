// backend/middleware/authMiddleware.js
const { User } = require('../config/db');

// Ensure user is logged in (session-based)
async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication check failed.' });
  }
}

// Ensure user has admin role
async function requireAdmin(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authorization check failed.' });
  }
}

module.exports = { requireAuth, requireAdmin };