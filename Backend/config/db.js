// backend/config/db.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Support both MySQL and SQLite (SQLite as fallback for local dev)
let sequelize;
if (process.env.DB_HOST) {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'civicalert',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
} else {
  // SQLite fallback — zero config, great for local dev
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'civicalert.sqlite'),
    logging: false,
  });
}

// ── User Model ────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  googleId: { type: DataTypes.STRING, unique: true, allowNull: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: true }, // for mock auth
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  points: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'users', timestamps: true });

// ── Report Model ──────────────────────────────────────────────────────────────
const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  vehicleNumber: { type: DataTypes.STRING(20), allowNull: false },
  violationType: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  imagePath: { type: DataTypes.STRING(255), allowNull: true },
  lat: { type: DataTypes.FLOAT, allowNull: true },
  lng: { type: DataTypes.FLOAT, allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.STRING(20), defaultValue: 'Pending' },
  aiVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  fakeScore: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
  violationScore: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
  plateValid: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: null },
  detectedPlate: { type: DataTypes.STRING(20), allowNull: true },
  aiMeta: { type: DataTypes.TEXT, allowNull: true },
  pointsAwarded: { type: DataTypes.INTEGER, defaultValue: 0 },
  adminNote: { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'reports', timestamps: true });

// ── Associations ──────────────────────────────────────────────────────────────
User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Sync DB ───────────────────────────────────────────────────────────────────
async function syncDb() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database connected and synced.');

    // Seed a demo admin if none exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@civicalert.in',
        password: 'admin123',
        role: 'admin',
        points: 0,
      });
      console.log('✅ Demo admin seeded: admin@civicalert.in / admin123');
    }

    // Seed a demo regular user if none exists
    const userExists = await User.findOne({ where: { email: 'user@demo.com' } });
    if (!userExists) {
      await User.create({
        name: 'Demo User',
        email: 'user@demo.com',
        password: 'demo123',
        role: 'user',
        points: 0,
      });
      console.log('✅ Demo user seeded: user@demo.com / demo123');
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, User, Report, syncDb };