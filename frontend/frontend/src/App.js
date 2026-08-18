// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SubmitPage from './pages/SubmitPage';
import AdminPage from './pages/AdminPage';
import StatsPage from './pages/StatsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';

// ── Route Guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenSpinner />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function FullscreenSpinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0D11' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F5C842', borderRadius: '50%' }} />
        <div style={{ fontSize: 14, color: '#5A6176', fontFamily: 'DM Sans, sans-serif' }}>Loading CivicAlert...</div>
      </div>
    </div>
  );
}

// ── Layout (sidebar + main content) ──────────────────────────────────────────
function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullscreenSpinner />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <LoginPage />} />

      {/* User routes */}
      <Route path="/dashboard" element={<RequireAuth><AppLayout><DashboardPage /></AppLayout></RequireAuth>} />
      <Route path="/report" element={<RequireAuth><ReportPage /></RequireAuth>} />
      <Route path="/submit" element={<RequireAuth><AppLayout><SubmitPage /></AppLayout></RequireAuth>} />
      <Route path="/leaderboard" element={<RequireAuth><AppLayout><LeaderboardPage /></AppLayout></RequireAuth>} />
      <Route path="/map" element={<RequireAuth><AppLayout><MapPage /></AppLayout></RequireAuth>} />

      {/* Admin routes */}
      <Route path="/admin" element={<RequireAdmin><AppLayout><AdminPage /></AppLayout></RequireAdmin>} />
      <Route path="/admin/stats" element={<RequireAdmin><AppLayout><StatsPage /></AppLayout></RequireAdmin>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
