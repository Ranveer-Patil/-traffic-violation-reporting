# CivicAlert Frontend

React client for the CivicAlert traffic violation reporting platform.

## Features

- Session-based login flow
- User dashboard and report history
- Violation report submission with image upload
- AI-powered pre-verification support
- Admin panel for moderation and stats
- Leaderboard and map views

## Tech Stack

- React
- React Router
- Axios
- Create React App

## Setup

```bash
npm install
```

Create `.env` (optional):

```env
REACT_APP_API_URL=http://localhost:5000
```

For Vercel production, set `REACT_APP_API_URL` in Vercel Project Settings to your Render backend URL:

```env
REACT_APP_API_URL=https://your-service.onrender.com
```

## Run in Development

```bash
# Cross-platform option
npx react-scripts start
```

The app runs at `http://localhost:3000` by default.

## Scripts

- `npm test` — run test suite
- `npm run build` — create production build
- `npm run eject` — eject CRA config (irreversible)

## Deployment

Production build output is generated in `build/`.  
The repository root `vercel.json` uses:

- Install: `npm install --prefix frontend/frontend`
- Build: `npm run build --prefix frontend/frontend`
