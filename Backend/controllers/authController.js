// backend/controllers/authController.js
// Mock authentication — replaces Google OAuth for local development
const { User } = require('../config/db');

// ── POST /auth/login — mock login with email + password ───────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Simple plain-text password check (for local dev only)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Store user ID in session
    req.session.userId = user.id;

    const { id, name, email: userEmail, avatar, role, points } = user;
    res.json({ success: true, user: { id, name, email: userEmail, avatar, role, points } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
};

// ── GET /auth/me — return current session user ───────────────────────────────
exports.getMe = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found.' });
    }

    const { id, name, email, avatar, role, points } = user;
    res.json({ id, name, email, avatar, role, points });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

// ── POST /auth/logout ─────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ success: true, message: 'Logged out.' });
  });
};