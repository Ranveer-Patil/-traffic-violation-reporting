// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockLogin } from '../services/api';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user, loading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }

    setSubmitting(true);
    try {
      const res = await mockLogin(email, password);
      login(res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

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

        {/* Login Card */}
        <div style={{ background: '#13161E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '2rem' }}>
          {error && (
            <div style={{ background: 'rgba(242,92,92,0.1)', border: '1px solid rgba(242,92,92,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#F25C5C' }}>
              {error}
            </div>
          )}

          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Sign in to continue</h2>
          <p style={{ color: '#5A6176', fontSize: 13, marginBottom: 24 }}>
            Use the demo credentials below or enter your own.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@demo.com"
                style={{ width: '100%', background: '#1A1E2A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: '#F0F2F8', padding: '12px 16px', fontSize: 15, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="demo123"
                style={{ width: '100%', background: '#1A1E2A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: '#F0F2F8', padding: '12px 16px', fontSize: 15, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '14px 24px',
                background: 'linear-gradient(135deg, #F5C842, #E8A020)',
                borderRadius: 10, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
                color: '#0B0D11', transition: 'opacity 0.15s',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, padding: 16, background: '#1A1E2A', borderRadius: 10, fontSize: 12, color: '#5A6176', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: '#8B93A8', marginBottom: 6 }}>🔑 Demo Credentials</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <button onClick={() => { setEmail('user@demo.com'); setPassword('demo123'); }}
                style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: 6, padding: '4px 10px', color: '#F5C842', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                👤 Regular User
              </button>
              <button onClick={() => { setEmail('admin@civicalert.in'); setPassword('admin123'); }}
                style={{ background: 'rgba(91,138,245,0.1)', border: '1px solid rgba(91,138,245,0.2)', borderRadius: 6, padding: '4px 10px', color: '#5B8AF5', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                🛡 Admin
              </button>
            </div>
            <div>• Reports go to traffic authorities — no fines are issued directly</div>
            <div>• Earn +10 civic points per approved report</div>
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
