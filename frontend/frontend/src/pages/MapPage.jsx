import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyReports, getAdminReports } from '../services/api';
import { Spinner } from '../components/ui';

const COLORS = { 'No Helmet': '#f5c842', 'No Seatbelt': '#f5844e', 'Signal Jump': '#f25c5c', 'Wrong Parking': '#5b8af5', 'Triple Riding': '#3ecf8e', 'Mobile While Driving': '#b05bf5' };
const ICONS = { 'No Helmet': 'H', 'No Seatbelt': 'S', 'Signal Jump': '!', 'Wrong Parking': 'P', 'Triple Riding': '3', 'Mobile While Driving': 'M' };
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

function ensureLeafletLoaded() {
  if (window.L) return Promise.resolve();
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }
  const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
  if (existing) {
    if (window.L) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Leaflet.')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet.'));
    document.head.appendChild(script);
  });
}

export default function MapPage() {
  const { user } = useAuth();
  const element = useRef(null); const map = useRef(null); const markers = useRef(null);
  const [reports, setReports] = useState([]); const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState('');
  const [type, setType] = useState(''); const [status, setStatus] = useState('');
  const loadReports = useCallback(async () => {
    try { const request = user?.role === 'admin' ? getAdminReports : getMyReports; setReports((await request()).data.reports || []); }
    catch (error) { console.error('Unable to load map reports:', error.message); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { loadReports(); }, [loadReports]);
  useEffect(() => {
    let retry; let resizeObserver;
    const initialise = () => {
      if (!element.current || map.current) return;
      if (!window.L) { retry = window.setTimeout(initialise, 250); return; }
      map.current = window.L.map(element.current, { zoomControl: false }).setView([20.5937, 78.9629], 5);
      window.L.control.zoom({ position: 'bottomright' }).addTo(map.current);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map.current);
      markers.current = window.L.layerGroup().addTo(map.current);
      window.requestAnimationFrame(() => map.current?.invalidateSize());
      if (typeof ResizeObserver === 'function') {
        resizeObserver = new ResizeObserver(() => map.current?.invalidateSize());
        resizeObserver.observe(element.current);
      }
    };
    let cancelled = false;
    ensureLeafletLoaded()
      .then(() => { if (!cancelled) initialise(); })
      .catch((error) => {
        if (!cancelled) {
          console.error('Unable to load map library:', error.message);
          setMapError('Unable to load map right now. Please refresh and try again.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; window.clearTimeout(retry); resizeObserver?.disconnect(); map.current?.remove(); map.current = null; };
  }, []);
  const located = useMemo(() => reports.filter(r => Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lng))), [reports]);
  const filtered = useMemo(() => located.filter(r => (!type || r.violationType === type) && (!status || r.status === status)), [located, type, status]);
  useEffect(() => {
    if (!map.current || !markers.current || !window.L) return;
    markers.current.clearLayers(); const bounds = [];
    filtered.forEach(r => {
      const position = [Number(r.lat), Number(r.lng)]; const color = COLORS[r.violationType] || '#f5c842';
      const marker = window.L.marker(position, { icon: window.L.divIcon({ className: 'violation-marker', iconSize: [32, 32], iconAnchor: [16, 16], html: `<span style="background:${color}">${ICONS[r.violationType] || '•'}</span>` }) });
      marker.bindPopup(`<strong>${r.violationType || 'Traffic violation'}</strong><br>${r.vehicleNumber || ''}<br>${r.address || `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`}`);
      markers.current.addLayer(marker); bounds.push(position);
    });
    if (bounds.length === 1) map.current.setView(bounds[0], 15);
    else if (bounds.length > 1) map.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [filtered]);
  return <div className="page-container map-page fade-up">
    <div className="page-heading"><div><h1>Violation Map</h1><p>View GPS-located traffic violation reports.</p></div><div className="map-count"><span />{filtered.length} shown</div></div>
    <div className="map-filters"><select value={type} aria-label="Filter by violation" onChange={e => setType(e.target.value)}><option value="">All violations</option>{Object.keys(COLORS).map(v => <option key={v}>{v}</option>)}</select><select value={status} aria-label="Filter by status" onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
    <div className="map-legend">{Object.entries(COLORS).map(([v, color]) => <button key={v} className={type === v ? 'active' : ''} onClick={() => setType(t => t === v ? '' : v)}><i style={{ background: color }} />{v}</button>)}</div>
    <section className="map-shell"><div ref={element} className="leaflet-map" />{loading && <div className="map-loading"><Spinner size={32} /> Loading reports…</div>}{!loading && mapError && <div className="map-empty">{mapError}</div>}{!loading && !mapError && !filtered.length && <div className="map-empty">No GPS-located reports match these filters.</div>}</section>
    <p className="map-note">Map data © OpenStreetMap contributors. Tap a marker for report details.</p>
  </div>;
}
