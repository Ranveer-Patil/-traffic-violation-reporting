// src/components/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';

const NAV_USER = [
  { path: '/dashboard',   label: 'Dashboard',        icon: '◎' },
  { path: '/report',      label: 'AI Report',         icon: '⚡' },
  { path: '/submit',      label: 'Quick Report',      icon: '+' },
  { path: '/map',         label: 'Violation Map',     icon: '◉' },
  { path: '/leaderboard', label: 'Leaderboard',       icon: '◈' },
];
const NAV_ADMIN = [
  { path: '/admin',       label: 'All Reports',       icon: '⚑' },
  { path: '/admin/stats', label: 'Statistics',        icon: '◉' },
  { path: '/map',         label: 'Violation Map',     icon: '🗺' },
  { path: '/leaderboard', label: 'Leaderboard',       icon: '◈' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = user?.role === 'admin' ? NAV_ADMIN : NAV_USER;

  return (
    <aside style={{ width: 240, background: '#13161E', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#F5C842' }} />
          <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#F5C842', letterSpacing: 1.5 }}>CIVIC ALERT</span>
        </div>
        {user?.role === 'admin' && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#5B8AF5', background: 'rgba(91,138,245,0.1)', borderRadius: 4, padding: '2px 8px', display: 'inline-block' }}>Administrator</div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {nav.map(item => {
          const active = pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: 'none', background: active ? 'rgba(245,200,66,0.12)' : 'transparent', color: active ? '#F5C842' : '#8B93A8', fontSize: 14, fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', borderLeft: `2px solid ${active ? '#F5C842' : 'transparent'}`, width: '100%' }}>
              <span style={{ fontSize: 15, fontFamily: 'monospace' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User + Points */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {user?.role !== 'admin' && (
          <div style={{ background: 'rgba(245,200,66,0.1)', borderRadius: 10, padding: '12px', marginBottom: 12, textAlign: 'center', border: '1px solid rgba(245,200,66,0.2)' }}>
            <div style={{ fontSize: 11, color: '#F5C842', fontWeight: 700, letterSpacing: 0.8, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>CIVIC POINTS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F5C842', fontFamily: 'Syne, sans-serif' }}>{user?.points ?? 0}</div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar name={user?.name || ''} avatar={user?.avatar} size={34} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: '#5A6176', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '8px', background: '#1A1E2A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#8B93A8', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.15s' }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
