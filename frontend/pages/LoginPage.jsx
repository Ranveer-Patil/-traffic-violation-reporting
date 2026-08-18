// frontend/src/pages/LoginPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle } from '../services/api';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user, loading, navigate]);

  const urlParams = new URLSearchParams(window.location.search);
  const authError = urlParams.get('error');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at 20% 50%, rgba(245,200,66,0.05) 0%, transparent 60%), #0B0D11' }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,200,66,0.1)', borderRadius: 50, padding: '8px 20px', marginBottom: 20, border: '1px solid rgba(245,200,66,0.2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F5C842' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#F5C842', fontFamily: 'Syne, sans-serif', letterSpacing: 1.5 }}>CIVIC ALERT</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, fontFamily: 'Syne, sans-serif', lineHeight: 1.15, marginBottom: 12 }}>
            Traffic Violation<br />
            <span style={{ color: '#F5C842' }}>Reporting System</span>
          </h1>
          <p style={{ color: '#8B93A8', fontSize: 15, lineHeight: 1.6 }}>
            Assist authorities. Earn civic points.<br />Make Indian roads safer — together.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#13161E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '2rem' }}>
          {authError && (
            <div style={{ background: 'rgba(242,92,92,0.1)', border: '1px solid rgba(242,92,92,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#F25C5C' }}>
              Authentication failed. Please try again.
            </div>
          )}

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Sign in to continue</h2>
          <p style={{ color: '#5A6176', fontSize: 13, marginBottom: 24 }}>
            Use your Google account. No password required.
          </p>

          <button onClick={loginWithGoogle}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px 24px', background: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 15, color: '#1a1a1a', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.target.style.opacity = 0.9}
            onMouseLeave={e => e.target.style.opacity = 1}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ marginTop: 24, padding: 16, background: '#1A1E2A', borderRadius: 10, fontSize: 12, color: '#5A6176', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: '#8B93A8', marginBottom: 6 }}>ℹ️ About this system</div>
            <div>• Reports go to traffic authorities — no fines are issued directly</div>
            <div>• Earn +10 civic points per approved report</div>
            <div>• Duplicate reports (same vehicle, 1hr window) are blocked</div>
            <div>• Images are required for AI validation</div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#3A4256', marginTop: 20 }}>
          CivicAlert v2.0 · For demonstration purposes only
        </p>
      </div>
    </div>
  );
}