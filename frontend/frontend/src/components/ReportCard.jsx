// src/components/ReportCard.jsx
import React, { useState } from 'react';
import { Badge, Btn } from './ui';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VIOLATION_ICONS = {
  'No Helmet': '⛑',
  'No Seatbelt': '🔒',
  'Signal Jump': '🚦',
  'Wrong Parking': '🚫',
  'Triple Riding': '🛵',
  'Mobile While Driving': '📵',
};

export default function ReportCard({ report, isAdmin, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [note, setNote] = useState('');

  const ts = new Date(report.createdAt);
  const dateStr = ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const icon = VIOLATION_ICONS[report.violationType] || '🚗';

  async function handleAction(action) {
    setActioning(true);
    await onAction(report.id, action, note);
    setActioning(false);
    setExpanded(false);
  }

  return (
    <div style={{ background: '#13161E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#1A1E2A', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{report.violationType}</span>
            <Badge status={report.status} />
            {report.aiVerified && (
              <span style={{ fontSize: 11, background: 'rgba(91,138,245,0.15)', color: '#5B8AF5', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>AI ✓</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#5A6176' }}>
            <span style={{ color: '#F5C842', fontWeight: 600 }}>{report.vehicleNumber}</span>
            {report.address && <> · {report.address.split(',')[0]}</>}
            {isAdmin && report.user && <> · {report.user.name}</>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: '#5A6176' }}>{dateStr}</div>
          <div style={{ fontSize: 11, color: '#3A4256' }}>{timeStr}</div>
        </div>
        <span style={{ color: '#5A6176', fontSize: 11, transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }}>▼</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem', background: '#0F1219' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Image */}
            {report.imagePath && (
              <div style={{ width: 180, height: 120, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <img src={`${API}/uploads/${report.imagePath}`} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {/* Details grid */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['VEHICLE', report.vehicleNumber],
                  ['VIOLATION', report.violationType],
                  ['STATUS', <Badge status={report.status} />],
                  ['POINTS', report.pointsAwarded > 0 ? `+${report.pointsAwarded} pts` : '—'],
                  ['LAT / LNG', report.lat ? `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}` : 'Not captured'],
                  ['ADDRESS', report.address || '—'],
                  ...(isAdmin && report.user ? [['REPORTER', report.user.name], ['EMAIL', report.user.email]] : []),
                  ...(report.adminNote ? [['ADMIN NOTE', report.adminNote]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: '#3A4256', letterSpacing: 0.8, marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, color: '#C0C8D8' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Admin action buttons */}
              {isAdmin && report.status === 'Pending' && (
                <div style={{ marginTop: 8 }}>
                  <input
                    value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Optional admin note..."
                    style={{ width: '100%', background: '#13161E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F2F8', padding: '8px 12px', fontSize: 13, outline: 'none', marginBottom: 10, fontFamily: 'DM Sans, sans-serif' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="success" size="sm" disabled={actioning} onClick={() => handleAction('Approved')}>
                      {actioning ? '...' : '✓ Approve (+10 pts)'}
                    </Btn>
                    <Btn variant="danger" size="sm" disabled={actioning} onClick={() => handleAction('Rejected')}>
                      {actioning ? '...' : '✗ Reject'}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
