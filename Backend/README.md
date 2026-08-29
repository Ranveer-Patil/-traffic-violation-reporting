# CivicAlert Backend

Express-based REST API for authentication, report submission, AI-assisted verification, and admin moderation.

## Stack

- Node.js + Express
- Sequelize ORM
- SQLite (default) or MySQL
- Multer for image uploads
- Session authentication (`express-session`)

## Setup

```bash
npm install
```

Create `Backend/.env`:

```env
PORT=5000
SESSION_SECRET=replace_with_a_strong_secret

# Optional MySQL config (SQLite is used if DB_HOST is empty)
DB_HOST=
DB_PORT=3306
DB_NAME=civicalert
DB_USER=root
DB_PASSWORD=

# Optional AI integrations
HIVE_API_KEY=
GOOGLE_VISION_API_KEY=
```

## Run

```bash
npm run dev
```

## API Routes

### Auth

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

### Reports

- `POST /report/report` (submit standard report)
- `GET /report/reports` (current user reports)
- `GET /report/leaderboard`
- `GET /report/admin/reports` (admin only)
- `GET /report/admin/stats` (admin only)
- `PUT /report/admin/report/:id` (admin only)

### AI Verification

- `POST /verify/submit` (submit + verify)
- `POST /verify/verify-image` (verify only)

## Notes

- The app auto-syncs DB models at startup.
- Demo users are seeded automatically for local development:
  - `admin@civicalert.in / admin123`
  - `user@demo.com / demo123`
