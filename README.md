# CivicAlert — Traffic Violation Reporting Platform

CivicAlert is a full-stack web platform for reporting, reviewing, and tracking traffic violations.  
It combines citizen reporting, admin moderation, AI-assisted image checks, and a points-based leaderboard.

## Project Structure

```text
.
├── Backend/                  # Express + Sequelize API
├── frontend/frontend/        # React web application
└── vercel.json               # Frontend deployment configuration
```

## Key Features

- Citizen login and session-based authentication
- Traffic violation report submission (with image upload)
- AI-assisted verification pipeline (image authenticity + plate extraction)
- Admin moderation workflow (approve/reject + notes)
- User points and public leaderboard
- Dashboard, map, reports, and analytics pages

## Tech Stack

- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express, Sequelize
- **Database:** SQLite (default local) or MySQL (via environment configuration)
- **AI Integrations:** Hive API, Google Vision API

## Quick Start

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd -traffic-violation-reporting
npm install --prefix Backend
npm install --prefix frontend/frontend
```

### 2) Configure environment

Create `/home/runner/work/-traffic-violation-reporting/-traffic-violation-reporting/Backend/.env`:

```env
PORT=5000
SESSION_SECRET=replace_with_a_strong_secret

# Optional DB (if omitted, SQLite is used)
DB_HOST=
DB_PORT=3306
DB_NAME=civicalert
DB_USER=root
DB_PASSWORD=

# Optional AI integrations
HIVE_API_KEY=
GOOGLE_VISION_API_KEY=
```

### 3) Run backend

```bash
npm run dev --prefix Backend
```

### 4) Run frontend

```bash
cd frontend/frontend
PORT=3000 npx react-scripts start
```

## Deployment

- Frontend build is configured via `vercel.json`.
- Build command: `npm run build --prefix frontend/frontend`
- Build output: `frontend/frontend/build`

## Additional Documentation

- Backend details: `/home/runner/work/-traffic-violation-reporting/-traffic-violation-reporting/Backend/README.md`
- Frontend details: `/home/runner/work/-traffic-violation-reporting/-traffic-violation-reporting/frontend/frontend/README.md`
