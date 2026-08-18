// src/pages/MapPage.jsx
// Fallback map page — works without Google Maps API key
// Shows a list of GPS-located reports. When Google Maps key is added, full map will work.

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyReports, getAdminReports } from '../services/api';
import { Spinner, Badge } from '../components/ui';

const VIOLATION_COLORS = {
  'No Helmet':             '#F5C842',
  'No Seatbelt':           '#F5844E',
  'Signal Jump':           '#F25C5C',
  'Wrong Parking':         '#5B8AF5',
  'Triple Riding':         '#3ECF8E',
  'Mobile While Driving':  '#B05BF5',
};

const VIOLATION_ICONS = {
  'No Helmet':             '⛑',
  'No Seatbelt':           '🔒',
  'Signal Jump':           '🚦',
  'Wrong Parking':         '🚫',
  'Triple Riding':         '🛵',
  'Mobile While Driving':  '📵',
};

// ── Reverse geocoding utility (exported for SubmitPage) ──────────────────────
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function MapPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadReports = useCallback(async () => {
    try {
      const fn = user?.role === 'admin' ? getAdminReports : getMyReports;
      const res = await fn();
      const all = res.data.reports || [];
      setReports(all);
    } catch (e) {
      console.error('Failed to load reports:', e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const located = reports.filter(r => r.lat && r.lng);
  const filtered = located.filter(r => {
    if (filterType && r.violationType !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
            Violation Map
          </h1>
          <p style={{ color: '#8b93a8', fontSize: 14 }}>
            GPS-located violation reports. {located.length} reports with coordinates.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.25)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: 14 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🗺️</span>
        <div>
          <div style={{ fontWeight: 600, color: '#f5c842', marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>
            Interactive Map Coming Soon
          </div>
          <div style={{ fontSize: 13, color: '#8b93a8', lineHeight: 1.7 }}>
            Add your Google Maps API key to <code style={{ background: '#1a1e2a', padding: '1px 6px', borderRadius: 4, color: '#f0f2f8' }}>frontend/.env</code> for the full interactive map experience.
            <br />
            <code style={{ background: '#1a1e2a', padding: '4px 10px', borderRadius: 6, color: '#f5c842', display: 'inline-block', marginTop: 8 }}>
              REACT_APP_GOOGLE_MAPS_KEY=your_api_key_here
            </code>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ background: '#13161E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F2F8', padding: '8px 14px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
          <option value="">All Violations</option>
          {Object.keys(VIOLATION_ICONS).map(v => <option key={v} value={v}>{VIOLATION_ICONS[v]} {v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: '#13161E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F2F8', padding: '8px 14px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <div style={{ background: '#13161e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#8b93a8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ecf8e' }} />
          {filtered.length} violation{filtered.length !== 1 ? 's' : ''} with GPS
        </div>
      </div>

      {/* Colour legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {Object.entries(VIOLATION_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b93a8', cursor: 'pointer' }}
            onClick={() => setFilterType(f => f === type ? '' : type)}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color,
              boxShadow: filterType === type ? `0 0 0 2px ${color}` : 'none' }} />
            {VIOLATION_ICONS[type]} {type}
          </div>
        ))}
      </div>

      {/* Grid of located reports */}
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: '1rem' }}>
        {filtered.length} Reports with GPS Coordinates
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(r => {
            const color = VIOLATION_COLORS[r.violationType] || '#f5c842';
            return (
              <div key={r.id} style={{ background: '#13161e', border: `1px solid ${color}25`, borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {VIOLATION_ICONS[r.violationType]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color }}>{r.violationType}</div>
                    <div style={{ fontSize: 11, color: '#5a6176' }}>{r.vehicleNumber}</div>
                  </div>
                  <Badge status={r.status} />
                </div>
                <div style={{ fontSize: 11, color: '#5a6176', background: '#1a1e2a', borderRadius: 6, padding: '6px 8px' }}>
                  📍 {r.address?.split(',')[0] || `${parseFloat(r.lat).toFixed(4)}, ${parseFloat(r.lng).toFixed(4)}`}
                </div>
                <a
                  href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View on Google Maps →
                </a>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#5a6176' }}>
              No reports with GPS coordinates yet. Submit a report to see it here!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
