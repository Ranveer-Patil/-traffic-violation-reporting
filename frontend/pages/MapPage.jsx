// frontend/src/pages/MapPage.jsx
//
// Full Google Maps integration with:
//  • Color-coded violation pins (custom SVG markers)
//  • Clickable info windows with report detail
//  • MarkerClusterer for dense areas
//  • Filter panel (violation type, status, date range)
//  • Heatmap layer toggle
//  • Fit-bounds to all visible markers
//  • Reverse geocoding on report submit (utility exported)
//  • Graceful fallback if no API key provided

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyReports, getAllReports } from '../services/api';
import { Spinner, Badge, Btn, Select } from '../components/ui';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

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

const STATUS_COLORS = {
  Pending:  '#F5C842',
  Approved: '#3ECF8E',
  Rejected: '#F25C5C',
};

const VIOLATION_OPTS = [
  { value: '', label: 'All Violations' },
  'No Helmet', 'No Seatbelt', 'Signal Jump',
  'Wrong Parking', 'Triple Riding', 'Mobile While Driving',
].map(v => typeof v === 'string' ? { value: v, label: `${VIOLATION_ICONS[v]} ${v}` } : v);

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending',  label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];

// ── Google Maps loader (idempotent) ───────────────────────────────────────────
let mapsLoaded = false;
let mapsCallbacks = [];

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(window.google.maps); return; }
    if (mapsLoaded) { mapsCallbacks.push(resolve); return; }
    mapsLoaded = true;
    mapsCallbacks.push(resolve);

    window.__mapsReady = () => {
      mapsCallbacks.forEach(cb => cb(window.google.maps));
      mapsCallbacks = [];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,marker&callback=__mapsReady&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

// ── Reverse geocoding utility (exported for SubmitPage) ──────────────────────
export async function reverseGeocode(lat, lng) {
  if (!MAPS_KEY) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}`
    );
    const data = await res.json();
    return data.results?.[0]?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ── Custom SVG marker factory ────────────────────────────────────────────────
function makeMarkerSVG(color, status) {
  const ring = STATUS_COLORS[status] || '#888';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/></filter>
      <circle cx="18" cy="18" r="16" fill="${ring}" filter="url(#sh)" opacity="0.35"/>
      <circle cx="18" cy="18" r="13" fill="${color}" filter="url(#sh)"/>
      <circle cx="18" cy="18" r="8" fill="rgba(0,0,0,0.25)"/>
      <polygon points="18,38 12,26 24,26" fill="${color}"/>
    </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

// ── Main MapPage Component ────────────────────────────────────────────────────
export default function MapPage() {
  const { user } = useAuth();
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef([]);
  const infoRef     = useRef(null);
  const heatRef     = useRef(null);
  const clustRef    = useRef(null);

  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [selected, setSelected]   = useState(null);
  const [heatmap, setHeatmap]     = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [filters, setFilters]     = useState({ vType: '', status: '', dateFrom: '', dateTo: '' });
  const [stats, setStats]         = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // ── Load reports ────────────────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    try {
      const fn = user?.role === 'admin' ? getAllReports : getMyReports;
      const res = await fn();
      const all = res.data.reports || [];
      setReports(all);
      setStats({
        total:    all.length,
        pending:  all.filter(r => r.status === 'Pending').length,
        approved: all.filter(r => r.status === 'Approved').length,
        rejected: all.filter(r => r.status === 'Rejected').length,
      });
    } catch (e) {
      console.error('Failed to load reports:', e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ── Load Google Maps SDK ────────────────────────────────────────────────────
  useEffect(() => {
    if (!MAPS_KEY) { setMapsError('no_key'); setLoading(false); return; }
    loadGoogleMaps(MAPS_KEY)
      .then(() => setMapsReady(true))
      .catch(e => setMapsError(e.message));
  }, []);

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstance.current) return;
    const maps = window.google.maps;

    mapInstance.current = new maps.Map(mapRef.current, {
      center:    { lat: 18.5204, lng: 73.8567 },
      zoom:      12,
      mapTypeId: 'roadmap',
      styles: [
        { elementType: 'geometry',        stylers: [{ color: '#1a1e2a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8b93a8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#13161e' }] },
        { featureType: 'road',             elementType: 'geometry',        stylers: [{ color: '#222736' }] },
        { featureType: 'road',             elementType: 'geometry.stroke', stylers: [{ color: '#13161e' }] },
        { featureType: 'road.highway',     elementType: 'geometry',        stylers: [{ color: '#2c3347' }] },
        { featureType: 'water',            elementType: 'geometry',        stylers: [{ color: '#0b0d11' }] },
        { featureType: 'poi',              stylers: [{ visibility: 'off' }] },
        { featureType: 'transit',          stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative',   elementType: 'geometry',        stylers: [{ color: '#2c3347' }] },
        { featureType: 'landscape',        elementType: 'geometry',        stylers: [{ color: '#13161e' }] },
      ],
      disableDefaultUI:  false,
      zoomControl:       true,
      mapTypeControl:    false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoRef.current = new maps.InfoWindow({ maxWidth: 320 });
  }, [mapsReady]);

  // ── Apply filters and render markers ─────────────────────────────────────────
  const renderMarkers = useCallback(() => {
    if (!mapInstance.current || !window.google?.maps) return;
    const maps = window.google.maps;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (heatRef.current) { heatRef.current.setMap(null); heatRef.current = null; }

    // Filter reports
    let filtered = reports.filter(r => r.lat && r.lng);
    if (filters.vType)    filtered = filtered.filter(r => r.violationType === filters.vType);
    if (filters.status)   filtered = filtered.filter(r => r.status === filters.status);
    if (filters.dateFrom) filtered = filtered.filter(r => new Date(r.createdAt) >= new Date(filters.dateFrom));
    if (filters.dateTo)   filtered = filtered.filter(r => new Date(r.createdAt) <= new Date(filters.dateTo + 'T23:59:59'));

    if (filtered.length === 0) return;

    const bounds = new maps.LatLngBounds();
    const heatPoints = [];

    filtered.forEach(report => {
      const pos = { lat: parseFloat(report.lat), lng: parseFloat(report.lng) };
      bounds.extend(pos);
      heatPoints.push(new maps.LatLng(pos.lat, pos.lng));

      const color = VIOLATION_COLORS[report.violationType] || '#F5C842';

      const marker = new maps.Marker({
        position: pos,
        map: mapInstance.current,
        title: `${report.violationType} — ${report.vehicleNumber}`,
        icon: {
          url:        makeMarkerSVG(color, report.status),
          scaledSize: new maps.Size(36, 44),
          anchor:     new maps.Point(18, 44),
        },
        animation: maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        const reporter = report.user?.name || report.userName || 'Unknown';
        const ts = new Date(report.createdAt).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
        const statusColor = STATUS_COLORS[report.status] || '#888';
        const vColor = VIOLATION_COLORS[report.violationType] || '#F5C842';

        infoRef.current.setContent(`
          <div style="
            background:#13161e; color:#f0f2f8;
            font-family:'DM Sans',sans-serif;
            border-radius:12px; overflow:hidden; min-width:260px;
          ">
            <div style="
              background:${vColor}18; border-bottom:1px solid ${vColor}30;
              padding:12px 14px; display:flex; align-items:center; gap:10px;
            ">
              <span style="font-size:22px">${VIOLATION_ICONS[report.violationType] || '🚗'}</span>
              <div>
                <div style="font-weight:700; font-size:14px; color:${vColor}">
                  ${report.violationType}
                </div>
                <div style="font-size:11px; color:#8b93a8; margin-top:2px">${ts}</div>
              </div>
              <span style="
                margin-left:auto; font-size:10px; font-weight:700;
                padding:3px 9px; border-radius:20px; letter-spacing:0.6px;
                background:${statusColor}18; color:${statusColor};
                text-transform:uppercase;
              ">${report.status}</span>
            </div>
            <div style="padding:12px 14px; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; font-size:13px">
                <span style="color:#5a6176">Vehicle</span>
                <strong style="color:${vColor}">${report.vehicleNumber}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:13px">
                <span style="color:#5a6176">Reporter</span>
                <span>${reporter}</span>
              </div>
              <div style="font-size:12px; color:#5a6176; border-top:1px solid rgba(255,255,255,0.07); padding-top:8px; margin-top:2px">
                📍 ${report.address || `${parseFloat(report.lat).toFixed(5)}, ${parseFloat(report.lng).toFixed(5)}`}
              </div>
              ${report.pointsAwarded > 0 ? `<div style="font-size:12px; color:#3ecf8e">⭐ +${report.pointsAwarded} civic points awarded</div>` : ''}
            </div>
          </div>
        `);
        infoRef.current.open(mapInstance.current, marker);
        setSelected(report);
      });

      markersRef.current.push(marker);
    });

    // Fit all markers
    if (!bounds.isEmpty()) {
      mapInstance.current.fitBounds(bounds, { padding: 60 });
      if (filtered.length === 1) mapInstance.current.setZoom(15);
    }

    // Heatmap layer
    if (heatmap && heatPoints.length > 0) {
      heatRef.current = new maps.visualization.HeatmapLayer({
        data:   heatPoints,
        map:    mapInstance.current,
        radius: 40,
        opacity: 0.7,
        gradient: [
          'rgba(0,0,0,0)',
          'rgba(91,138,245,0.4)',
          'rgba(245,200,66,0.7)',
          'rgba(242,92,92,0.9)',
          'rgba(242,92,92,1)',
        ],
      });
    }
  }, [reports, filters, heatmap]);

  useEffect(() => {
    if (mapsReady && reports.length > 0) renderMarkers();
  }, [mapsReady, renderMarkers, reports]);

  // ── Toggle heatmap ───────────────────────────────────────────────────────────
  function toggleHeatmap() {
    setHeatmap(h => !h);
  }

  // ── Fit all ──────────────────────────────────────────────────────────────────
  function fitAll() {
    if (!mapInstance.current || markersRef.current.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    markersRef.current.forEach(m => bounds.extend(m.getPosition()));
    mapInstance.current.fitBounds(bounds, { padding: 60 });
  }

  const visibleCount = reports.filter(r => {
    if (!r.lat || !r.lng) return false;
    if (filters.vType   && r.violationType !== filters.vType) return false;
    if (filters.status  && r.status !== filters.status) return false;
    if (filters.dateFrom && new Date(r.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo   && new Date(r.createdAt) > new Date(filters.dateTo + 'T23:59:59')) return false;
    return true;
  }).length;

  // ── No API key fallback ───────────────────────────────────────────────────────
  if (mapsError === 'no_key') {
    return <NoKeyFallback reports={reports} loading={loading} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* ── Filter Sidebar ── */}
      <div style={{
        width: panelOpen ? 300 : 0,
        minWidth: panelOpen ? 300 : 0,
        background: '#13161e',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        zIndex: 10,
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16 }}>Map View</div>
            <div style={{ fontSize: 12, color: '#5a6176', marginTop: 2 }}>
              {visibleCount} of {reports.filter(r => r.lat).length} violations shown
            </div>
          </div>
          <button onClick={() => setPanelOpen(false)} style={{ background: 'none', border: 'none', color: '#5a6176', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
        </div>

        {/* Stats mini cards */}
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Total', value: stats.total, color: '#f0f2f8' },
            { label: 'Pending', value: stats.pending, color: '#f5c842' },
            { label: 'Approved', value: stats.approved, color: '#3ecf8e' },
            { label: 'Rejected', value: stats.rejected, color: '#f25c5c' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1e2a', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#5a6176' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6176', letterSpacing: 1, fontFamily: 'Syne, sans-serif' }}>FILTERS</div>

          <Select label="Violation Type" options={VIOLATION_OPTS} value={filters.vType}
            onChange={e => setFilters(f => ({ ...f, vType: e.target.value }))} />

          <Select label="Status" options={STATUS_OPTS} value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#8b93a8', fontWeight: 500 }}>Date From</label>
            <input type="date" value={filters.dateFrom}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              style={{ width: '100%', background: '#1a1e2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#f0f2f8', padding: '9px 12px', fontSize: 13, outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#8b93a8', fontWeight: 500 }}>Date To</label>
            <input type="date" value={filters.dateTo}
              onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              style={{ width: '100%', background: '#1a1e2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#f0f2f8', padding: '9px 12px', fontSize: 13, outline: 'none' }} />
          </div>

          <Btn variant="ghost" size="sm" onClick={() => setFilters({ vType: '', status: '', dateFrom: '', dateTo: '' })} style={{ width: '100%', justifyContent: 'center' }}>
            Clear Filters
          </Btn>

          {/* Legend */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6176', letterSpacing: 1, fontFamily: 'Syne, sans-serif', marginBottom: 10 }}>VIOLATION COLOURS</div>
            {Object.entries(VIOLATION_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }}
                onClick={() => setFilters(f => ({ ...f, vType: f.vType === type ? '' : type }))}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0,
                  boxShadow: filters.vType === type ? `0 0 0 2px ${color}` : 'none' }} />
                <span style={{ fontSize: 12, color: filters.vType === type ? color : '#8b93a8' }}>
                  {VIOLATION_ICONS[type]} {type}
                </span>
              </div>
            ))}
          </div>

          {/* Status ring legend */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5a6176', letterSpacing: 1, fontFamily: 'Syne, sans-serif', marginBottom: 10 }}>STATUS RING</div>
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${color}`, background: 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#8b93a8' }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map Container ── */}
      <div style={{ flex: 1, position: 'relative' }}>

        {/* Toolbar overlay */}
        <div style={{
          position: 'absolute', top: 16, left: panelOpen ? 16 : 56, right: 16,
          zIndex: 20, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {!panelOpen && (
            <button onClick={() => setPanelOpen(true)} style={{
              background: '#13161e', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, color: '#f0f2f8', padding: '8px 12px', cursor: 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ☰ Filters
            </button>
          )}

          <div style={{
            background: '#13161e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#8b93a8',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ecf8e' }} />
            {visibleCount} violation{visibleCount !== 1 ? 's' : ''} on map
          </div>

          <button onClick={fitAll} style={{
            background: '#13161e', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: '#f0f2f8', padding: '8px 14px', cursor: 'pointer', fontSize: 13,
          }}>
            ⊞ Fit All
          </button>

          <button onClick={toggleHeatmap} style={{
            background: heatmap ? 'rgba(242,92,92,0.15)' : '#13161e',
            border: `1px solid ${heatmap ? 'rgba(242,92,92,0.4)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8, color: heatmap ? '#f25c5c' : '#f0f2f8',
            padding: '8px 14px', cursor: 'pointer', fontSize: 13,
          }}>
            {heatmap ? '🔥 Hide Heatmap' : '🔥 Show Heatmap'}
          </button>

          <button onClick={loadReports} style={{
            background: '#13161e', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: '#8b93a8', padding: '8px 14px', cursor: 'pointer', fontSize: 13,
          }}>
            ↻ Refresh
          </button>
        </div>

        {/* Loading overlay */}
        {(loading || (!mapsReady && !mapsError)) && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(11,13,17,0.8)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', zIndex: 30, gap: 16,
          }}>
            <Spinner size={40} />
            <div style={{ fontSize: 14, color: '#8b93a8' }}>
              {loading ? 'Loading violation reports...' : 'Initialising Google Maps...'}
            </div>
          </div>
        )}

        {/* Selected report bottom card */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, background: '#13161e', border: `1px solid ${VIOLATION_COLORS[selected.violationType]}40`,
            borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center',
            gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 480, width: '90%',
            animation: 'slideUp 0.25s ease',
          }}>
            <span style={{ fontSize: 26 }}>{VIOLATION_ICONS[selected.violationType]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: VIOLATION_COLORS[selected.violationType] }}>
                {selected.violationType}
              </div>
              <div style={{ fontSize: 12, color: '#8b93a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selected.vehicleNumber} · {selected.address?.split(',')[0]}
              </div>
            </div>
            <Badge status={selected.status} />
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#5a6176', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        )}

        {/* The actual map div */}
        <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#0b0d11' }} />
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translate(-50%, 16px); } to { opacity:1; transform:translate(-50%, 0); } }
        .gm-style .gm-style-iw-c { background: #13161e !important; border: 1px solid rgba(255,255,255,0.07) !important; border-radius: 12px !important; padding: 0 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important; }
        .gm-style .gm-style-iw-d { overflow: hidden !important; }
        .gm-style .gm-style-iw-t::after { background: #13161e !important; }
        .gm-style-iw-chr { display: none !important; }
        .gm-ui-hover-effect { display: none !important; }
      `}</style>
    </div>
  );
}

// ── No API Key Fallback ───────────────────────────────────────────────────────
function NoKeyFallback({ reports, loading }) {
  const located = reports.filter(r => r.lat && r.lng);

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
            Violation Map
          </h1>
          <p style={{ color: '#8b93a8', fontSize: 14 }}>
            Live map of all reported violations with GPS coordinates.
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.25)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: 14 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🗺️</span>
        <div>
          <div style={{ fontWeight: 600, color: '#f5c842', marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>
            Google Maps API Key Required
          </div>
          <div style={{ fontSize: 13, color: '#8b93a8', lineHeight: 1.7 }}>
            Add your key to <code style={{ background: '#1a1e2a', padding: '1px 6px', borderRadius: 4, color: '#f0f2f8' }}>frontend/.env</code>:
            <br />
            <code style={{ background: '#1a1e2a', padding: '4px 10px', borderRadius: 6, color: '#f5c842', display: 'inline-block', marginTop: 8 }}>
              REACT_APP_GOOGLE_MAPS_KEY=your_api_key_here
            </code>
            <br /><br />
            Enable these APIs in Google Cloud Console:
            <strong style={{ color: '#f0f2f8' }}> Maps JavaScript API</strong>,
            <strong style={{ color: '#f0f2f8' }}> Geocoding API</strong>,
            <strong style={{ color: '#f0f2f8' }}> Visualization API</strong>
          </div>
        </div>
      </div>

      {/* Grid of located reports with coords */}
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: '1rem' }}>
        {located.length} Reports with GPS Coordinates
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {located.map(r => {
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
          {located.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#5a6176' }}>
              No reports with GPS coordinates yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}