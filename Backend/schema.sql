-- ============================================================
-- CivicAlert v2.0 — MySQL Schema
-- Run: mysql -u root -p < schema.sql
-- Or use the auto-sync via Sequelize (runs on server start)
-- ============================================================

CREATE DATABASE IF NOT EXISTS civicalert CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE civicalert;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  googleId     VARCHAR(100) UNIQUE,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  avatar       VARCHAR(255),
  role         ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  points       INT UNSIGNED NOT NULL DEFAULT 0,
  createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_googleId (googleId),
  INDEX idx_points (points DESC)
) ENGINE=InnoDB;

-- ── Reports ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userId          INT UNSIGNED NOT NULL,
  vehicleNumber   VARCHAR(20) NOT NULL,
  violationType   ENUM(
                    'No Helmet',
                    'No Seatbelt',
                    'Signal Jump',
                    'Wrong Parking',
                    'Triple Riding',
                    'Mobile While Driving'
                  ) NOT NULL,
  imagePath       VARCHAR(255),
  lat             FLOAT(10,6),
  lng             FLOAT(10,6),
  address         VARCHAR(255),
  status          ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  aiVerified      TINYINT(1) NOT NULL DEFAULT 0,
  pointsAwarded   INT UNSIGNED NOT NULL DEFAULT 0,
  adminNote       VARCHAR(255),
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId    (userId),
  INDEX idx_status    (status),
  INDEX idx_vehicle   (vehicleNumber),
  INDEX idx_violation (violationType),
  INDEX idx_created   (createdAt DESC)
) ENGINE=InnoDB;

-- ── Session Store (connect-session-sequelize) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS Sessions (
  sid     VARCHAR(36) NOT NULL,
  expires DATETIME,
  data    TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (sid)
) ENGINE=InnoDB;

-- ── Seed admin user ────────────────────────────────────────────────────────────
INSERT IGNORE INTO users (name, email, role, points)
VALUES ('Admin', 'admin@civicalert.in', 'admin', 0);

-- ── Duplicate detection query (reference) ─────────────────────────────────────
-- Used in reportController.js via Sequelize Op.gte:
-- SELECT COUNT(*) FROM reports
--   WHERE vehicleNumber = ?
--     AND violationType = ?
--     AND createdAt > NOW() - INTERVAL 1 HOUR;

-- ── Award points query (reference) ────────────────────────────────────────────
-- Used in reportController.js via User.increment:
-- UPDATE users SET points = points + 10 WHERE id = ?;