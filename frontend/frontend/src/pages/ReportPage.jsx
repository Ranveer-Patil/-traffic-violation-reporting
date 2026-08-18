// src/pages/ReportPage.jsx — Mobile-first AI-powered violation reporting
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitReportAI, verifyImageAI } from '../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const VIOLATIONS = [
  { value: 'No Helmet',            icon: '⛑',  label: 'No Helmet' },
  { value: 'No Seatbelt',          icon: '🔒', label: 'No Seatbelt' },
  { value: 'Signal Jump',          icon: '🚦', label: 'Signal Jump' },
  { value: 'Wrong Parking',        icon: '🚫', label: 'Wrong Parking' },
  { value: 'Triple Riding',        icon: '🛵', label: 'Triple Riding' },
  { value: 'Mobile While Driving', icon: '📵', label: 'Phone Use' },
];

const S = {
  bg: '#FAFBFC', surface: '#FFFFFF', surfaceAlt: '#F5F7FA',
  primary: '#1A73E8', primaryDark: '#1557B0', primaryLight: '#E8F0FE',
  danger: '#DC3545', dangerLight: '#FFF0F1',
  success: '#0D9F6C', successLight: '#E8F8F0',
  warn: '#F59E0B', warnLight: '#FFFBEB',
  textPrimary: '#1A1D26', textSecondary: '#5F6775', textMuted: '#9DA5B4',
  border: '#E5E7EB', borderFocus: '#1A73E8',
  radius: 14, radiusSm: 10,
};

// ── Styles (mobile-first) ─────────────────────────────────────────────────────
const css = {
  page: {
    minHeight: '100vh', background: S.bg, fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
    display: 'flex', flexDirection: 'column',
  },
  header: {
    padding: '16px 20px', background: S.surface, borderBottom: `1px solid ${S.border}`,
    position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)',
  },
  body: { flex: 1, padding: '0 16px 120px', maxWidth: 540, margin: '0 auto', width: '100%' },
  section: {
    background: S.surface, borderRadius: S.radius, border: `1px solid ${S.border}`,
    padding: '20px', marginTop: 16,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: S.textMuted, letterSpacing: 1,
    marginBottom: 14, textTransform: 'uppercase',
  },
  btn: (variant = 'primary', full = false) => ({
    width: full ? '100%' : 'auto', padding: '14px 24px',
    background: variant === 'primary' ? S.primary : variant === 'danger' ? S.danger : S.surface,
    color: variant === 'primary' || variant === 'danger' ? '#FFF' : S.textPrimary,
    border: variant === 'outline' ? `1.5px solid ${S.border}` : 'none',
    borderRadius: S.radiusSm, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.15s', opacity: 1,
  }),
  input: {
    width: '100%', padding: '12px 16px', background: S.surfaceAlt, border: `1.5px solid ${S.border}`,
    borderRadius: S.radiusSm, fontSize: 15, color: S.textPrimary, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
  },
  chip: (active) => ({
    padding: '10px 16px', borderRadius: 12,
    background: active ? S.primaryLight : S.surfaceAlt,
    border: `1.5px solid ${active ? S.primary : S.border}`,
    color: active ? S.primary : S.textSecondary,
    fontSize: 14, fontWeight: active ? 600 : 500,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ScoreBadge({ score, label, color }) {
  const pct = Math.round(score * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke={`${color}30`} strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct * 0.82} 100`} strokeLinecap="round"
            transform="rotate(-90 16 16)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          <text x="16" y="17" textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize="9" fontWeight="700" fontFamily="inherit">{pct}</text>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 12, color: S.textMuted, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color }}>{pct}%</div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    ACCEPTED: { bg: S.successLight, color: S.success, label: 'ACCEPTED', icon: '✓' },
    REJECTED: { bg: S.dangerLight, color: S.danger, label: 'REJECTED', icon: '✗' },
    NEEDS_REVIEW: { bg: S.warnLight, color: S.warn, label: 'UNDER REVIEW', icon: '◷' },
  };
  const s = map[status] || map.NEEDS_REVIEW;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
      <span>{s.icon}</span> {s.label}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ReportPage() {
  const navigate = useNavigate();
  useAuth();
  const cameraRef = useRef();

  // ── State ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1=capture, 2=details, 3=result
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [violationType, setViolationType] = useState('');
  const [consent, setConsent] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ── Auto GPS on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        } catch {}
        setLocation({ lat, lng, address });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 15000, enableHighAccuracy: true }
    );
  }, []);

  // ── Camera capture (rear only, no gallery) ────────────────────────────────
  function handleCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only images allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Max 10MB.'); return; }
    setImage(file);
    setError('');
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  // ── AI Pre-verify ─────────────────────────────────────────────────────────
  const runVerification = useCallback(async () => {
    if (!image) return;
    setVerifying(true);
    setVerification(null);
    try {
      const fd = new FormData();
      fd.append('image', image);
      const res = await verifyImageAI(fd);
      setVerification(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  }, [image]);

  useEffect(() => {
    if (image && step === 1) runVerification();
  }, [image, step, runVerification]);

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!image || !violationType || !consent) {
      setError('Complete all fields and accept consent.'); return;
    }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', image);
      fd.append('violationType', violationType);
      fd.append('consent', 'true');
      if (location) {
        fd.append('lat', location.lat);
        fd.append('lng', location.lng);
        fd.append('address', location.address);
      }
      const res = await submitReportAI(fd);
      setResult(res.data);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={css.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={css.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4, color: S.textPrimary }}>←</button>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: S.textPrimary }}>Report Violation</div>
              <div style={{ fontSize: 12, color: S.textMuted }}>AI-verified · Secure submission</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.textMuted }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: location ? S.success : S.textMuted }} />
            {locating ? 'Locating...' : location ? 'GPS Active' : 'No GPS'}
          </div>
        </div>
        {/* step progress */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {['Capture', 'Details', 'Result'].map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <div style={{ width: '100%', height: 3, borderRadius: 2, background: step > i ? S.primary : `${S.primary}20`, transition: 'background 0.3s' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: step === i + 1 ? S.primary : S.textMuted }}>{s.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={css.body}>
        {error && (
          <div style={{ ...css.section, background: S.dangerLight, borderColor: '#F5C6CB', display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
            <span style={{ color: S.danger, fontSize: 18 }}>⚠</span>
            <span style={{ fontSize: 14, color: S.danger, flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: S.danger, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )}

        {/* ═══ STEP 1: CAPTURE ═════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            {/* Camera capture zone */}
            <div style={css.section}>
              <div style={css.sectionLabel}>📸 Capture Evidence</div>
              {!preview ? (
                <div
                  onClick={() => cameraRef.current?.click()}
                  style={{ border: `2px dashed ${S.border}`, borderRadius: S.radiusSm, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: S.surfaceAlt, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = S.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: S.textPrimary, marginBottom: 4 }}>Tap to open camera</div>
                  <div style={{ fontSize: 13, color: S.textMuted }}>Rear camera only · No gallery uploads</div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img src={preview} alt="Evidence" style={{ width: '100%', borderRadius: S.radiusSm, maxHeight: 280, objectFit: 'cover' }}/>
                  <button onClick={() => { setImage(null); setPreview(null); setVerification(null); }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              )}
              {/* Hidden camera input — capture="environment" forces rear camera, accept forces images-only */}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
            </div>

            {/* AI Verification Results */}
            {(verifying || verification) && (
              <div style={css.section}>
                <div style={css.sectionLabel}>🤖 AI Analysis</div>
                {verifying ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                    <div className="spinner" style={{ width: 22, height: 22, border: '2.5px solid #E5E7EB', borderTopColor: S.primary, borderRadius: '50%' }} />
                    <span style={{ fontSize: 14, color: S.textSecondary }}>Analyzing image with AI...</span>
                  </div>
                ) : verification && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Decision badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusPill status={verification.finalDecision} />
                      {verification.plateNumber && (
                        <div style={{ padding: '6px 12px', background: verification.plateValid ? S.successLight : S.warnLight, borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, color: verification.plateValid ? S.success : S.warn }}>
                          {verification.plateNumber}
                        </div>
                      )}
                    </div>

                    {/* Score gauges */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <ScoreBadge score={1 - verification.fakeScore} label="Authenticity" color={verification.fakeScore < 0.5 ? S.success : S.danger} />
                      <ScoreBadge score={verification.violationScore} label="Violation Conf." color={verification.violationScore > 0.5 ? S.success : S.warn} />
                    </div>

                    {/* Detection tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: verification.vehicleDetected ? S.successLight : S.dangerLight, color: verification.vehicleDetected ? S.success : S.danger }}>
                        {verification.vehicleDetected ? '✓ Vehicle' : '✗ No Vehicle'}
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: verification.plateValid ? S.successLight : S.warnLight, color: verification.plateValid ? S.success : S.warn }}>
                        {verification.plateValid ? '✓ Valid Plate' : verification.plateNumber ? '⚠ Invalid Plate' : '— No Plate'}
                      </span>
                      {(verification.labels || []).slice(0, 4).map((l, i) => (
                        <span key={i} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: S.surfaceAlt, color: S.textSecondary, border: `1px solid ${S.border}` }}>{l}</span>
                      ))}
                    </div>

                    {/* Rejections */}
                    {verification.rejections?.length > 0 && (
                      <div style={{ background: S.dangerLight, borderRadius: S.radiusSm, padding: '12px 14px', fontSize: 13, color: S.danger }}>
                        {verification.rejections.map((r, i) => <div key={i}>• {r}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GPS info */}
            {location && (
              <div style={css.section}>
                <div style={css.sectionLabel}>📍 GPS Location</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: S.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📍</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary, marginBottom: 2 }}>{location.address.split(',').slice(0, 2).join(',')}</div>
                    <div style={{ fontSize: 12, color: S.textMuted, fontFamily: 'monospace' }}>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Next button */}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => { if (!image) { setError('Please capture an image first.'); return; } setStep(2); }}
                disabled={!image || (verification?.finalDecision === 'REJECTED')}
                style={{ ...css.btn('primary', true), opacity: !image || verification?.finalDecision === 'REJECTED' ? 0.5 : 1 }}>
                Continue to Details →
              </button>
              {verification?.finalDecision === 'REJECTED' && (
                <div style={{ textAlign: 'center', fontSize: 13, color: S.danger, marginTop: 8 }}>Image was rejected by AI. Please capture a new photo.</div>
              )}
            </div>
          </>
        )}

        {/* ═══ STEP 2: DETAILS & SUBMISSION ════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* Mini preview */}
            <div style={{ ...css.section, display: 'flex', gap: 14, alignItems: 'center' }}>
              <img src={preview} alt="thumb" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: `1px solid ${S.border}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary }}>Evidence captured</div>
                <div style={{ fontSize: 12, color: S.textMuted }}>{verification?.plateNumber ? `Plate: ${verification.plateNumber}` : 'Plate: pending detection'}</div>
              </div>
              {verification && <StatusPill status={verification.finalDecision} />}
            </div>

            {/* Violation type */}
            <div style={css.section}>
              <div style={css.sectionLabel}>🚨 Violation Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {VIOLATIONS.map(v => (
                  <button key={v.value} onClick={() => setViolationType(v.value)} style={css.chip(violationType === v.value)}>
                    <span>{v.icon}</span> {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consent */}
            <div style={css.section}>
              <div style={css.sectionLabel}>📋 Declaration</div>
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: S.primary, marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.6 }}>
                  I hereby declare that this report is genuine and made in good faith. I understand that filing false reports is a punishable offence under applicable laws. I consent to sharing my location data for verification purposes.
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setStep(1)} style={{ ...css.btn('outline'), flex: 1 }}>← Back</button>
              <button
                onClick={handleSubmit}
                disabled={!violationType || !consent || submitting}
                style={{ ...css.btn('primary'), flex: 2, opacity: !violationType || !consent || submitting ? 0.5 : 1 }}>
                {submitting ? (
                  <><div className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%' }} /> Submitting...</>
                ) : 'Submit Report'}
              </button>
            </div>
          </>
        )}

        {/* ═══ STEP 3: RESULT ══════════════════════════════════════════════ */}
        {step === 3 && result && (
          <>
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>
                {result.verification?.finalDecision === 'ACCEPTED' ? '✅' : result.verification?.finalDecision === 'REJECTED' ? '❌' : '⏳'}
              </div>
              <StatusPill status={result.verification?.finalDecision || 'NEEDS_REVIEW'} />
              <h2 style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginTop: 16, marginBottom: 4 }}>
                {result.verification?.finalDecision === 'ACCEPTED' ? 'Report Submitted' : result.verification?.finalDecision === 'REJECTED' ? 'Report Rejected' : 'Under Review'}
              </h2>
              <p style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>{result.message}</p>
            </div>

            {/* Verification card */}
            <div style={css.section}>
              <div style={css.sectionLabel}>AI Verification Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <ScoreBadge score={1 - (result.verification?.fakeScore || 0)} label="Authenticity" color={result.verification?.fakeScore < 0.5 ? S.success : S.danger} />
                <ScoreBadge score={result.verification?.violationScore || 0} label="Confidence" color={result.verification?.violationScore > 0.5 ? S.success : S.warn} />
              </div>
              <div style={{ borderTop: `1px solid ${S.border}`, marginTop: 14, paddingTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  ['Vehicle', result.verification?.vehicleDetected],
                  ['Plate', result.verification?.plateValid],
                ].map(([label, ok]) => (
                  <span key={label} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: ok ? S.successLight : S.dangerLight, color: ok ? S.success : S.danger }}>
                    {ok ? '✓' : '✗'} {label}
                  </span>
                ))}
                {result.verification?.plateNumber && (
                  <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'monospace', background: S.primaryLight, color: S.primary }}>
                    {result.verification.plateNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Report details */}
            <div style={css.section}>
              <div style={css.sectionLabel}>Report #{result.report?.id}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Status', result.report?.status],
                  ['Type', violationType],
                  ['Fake Score', `${Math.round((result.verification?.fakeScore || 0) * 100)}%`],
                  ['Violation Score', `${Math.round((result.verification?.violationScore || 0) * 100)}%`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: S.textMuted, fontWeight: 600, letterSpacing: 0.5, marginBottom: 3 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setStep(1); setImage(null); setPreview(null); setVerification(null); setResult(null); setViolationType(''); setConsent(false); setError(''); }} style={{ ...css.btn('outline'), flex: 1 }}>
                New Report
              </button>
              <button onClick={() => navigate('/dashboard')} style={{ ...css.btn('primary'), flex: 1 }}>
                Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
