// src/pages/SubmitPage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport } from '../services/api';
import { Btn, Card, Toast, Spinner } from '../components/ui';

const VIOLATION_TYPES = [
  { value: '', label: 'Select violation type...' },
  { value: 'No Helmet',              label: '⛑  No Helmet' },
  { value: 'No Seatbelt',            label: '🔒  No Seatbelt' },
  { value: 'Signal Jump',            label: '🚦  Signal Jump' },
  { value: 'Wrong Parking',          label: '🚫  Wrong Parking' },
  { value: 'Triple Riding',          label: '🛵  Triple Riding' },
  { value: 'Mobile While Driving',   label: '📵  Mobile While Driving' },
];

// Simple reverse geocode fallback (no Google API needed)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function SubmitPage() {
  const navigate = useNavigate();
  const fileRef = useRef();

  const [step, setStep] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [violationType, setViolationType] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  // ── Image handling ──────────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ msg: 'Only image files allowed (jpg, png, webp).', type: 'error' }); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ msg: 'File too large. Max 10MB.', type: 'error' }); return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  // ── GPS capture ─────────────────────────────────────────────────────────────
  function captureLocation() {
    if (!navigator.geolocation) {
      setToast({ msg: 'Geolocation not supported by your browser.', type: 'error' }); return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        setLocation({ lat, lng, address });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        const msgs = {
          1: 'Location permission denied. Please enable it in browser settings.',
          2: 'Location unavailable. Try again.',
          3: 'Location request timed out.',
        };
        setToast({ msg: msgs[err.code] || 'Failed to get location.', type: 'error' });
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(s) {
    const e = {};
    if (s === 1 && !image) e.image = 'An image is required for AI validation.';
    if (s === 2) {
      if (!vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number is required.';
      else if (!/^[A-Z0-9\s-]{3,15}$/i.test(vehicleNumber.trim())) e.vehicleNumber = 'Invalid vehicle number format (e.g. MH12AB1234).';
      if (!violationType) e.violationType = 'Please select a violation type.';
    }
    if (s === 3 && !location) e.location = 'Please capture your GPS location.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => s + 1);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('vehicleNumber', vehicleNumber.trim().toUpperCase());
      fd.append('violationType', violationType);
      fd.append('lat', location.lat);
      fd.append('lng', location.lng);
      fd.append('address', location.address);
      if (image) fd.append('image', image);

      const res = await submitReport(fd);
      setToast({ msg: res.data.message, type: res.data.report.status === 'Rejected' ? 'warning' : 'success' });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (e) {
      setToast({ msg: e.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const STEPS = ['Evidence', 'Details', 'Location'];

  return (
    <div style={{ padding: '2rem', maxWidth: 680, margin: '0 auto' }} className="fade-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>Report a Violation</h1>
        <p style={{ color: '#8B93A8', fontSize: 14 }}>3 steps: upload evidence → enter details → confirm location.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', background: '#13161E', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, padding: '12px', textAlign: 'center', background: step === i + 1 ? 'rgba(245,200,66,0.1)' : 'transparent', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: 0.6, color: step > i + 1 ? '#3ECF8E' : step === i + 1 ? '#F5C842' : '#5A6176' }}>
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{s.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* STEP 1 — Image */}
      {step === 1 && (
        <Card>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: '1.5rem' }}>Upload Evidence Image</h3>
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{ border: `2px dashed ${errors.image ? '#F25C5C' : imagePreview ? '#3ECF8E' : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: imagePreview ? 'rgba(62,207,142,0.04)' : '#1A1E2A', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.2s' }}>
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, objectFit: 'cover' }} />
                <span style={{ fontSize: 13, color: '#3ECF8E', fontWeight: 600 }}>✓ Image ready</span>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48 }}>📸</div>
                <div style={{ color: '#8B93A8', fontSize: 15, fontWeight: 500 }}>Drag & drop or click to upload</div>
                <div style={{ fontSize: 13, color: '#5A6176' }}>JPG, PNG, WEBP — max 10MB</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
          {errors.image && <div style={{ fontSize: 13, color: '#F25C5C', marginTop: 8 }}>⚠ {errors.image}</div>}
          {imagePreview && (
            <Btn variant="ghost" size="sm" onClick={() => { setImage(null); setImagePreview(null); }} style={{ marginTop: 10 }}>
              Remove image
            </Btn>
          )}
          <div style={{ background: 'rgba(245,200,66,0.07)', border: '1px solid rgba(245,200,66,0.18)', borderRadius: 10, padding: '12px 14px', marginTop: 16, fontSize: 13, color: '#8B93A8', display: 'flex', gap: 8 }}>
            <span style={{ color: '#F5C842' }}>⚠</span>
            Reports without images are automatically rejected by AI validation.
          </div>
          <Btn onClick={nextStep} style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
            Next: Enter Details →
          </Btn>
        </Card>
      )}

      {/* STEP 2 — Details */}
      {step === 2 && (
        <Card>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: '1.5rem' }}>Violation Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, marginBottom: 6 }}>Vehicle Number</div>
              <input
                placeholder="MH12AB1234"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                maxLength={15}
                style={{ width: '100%', background: '#1A1E2A', border: `1px solid ${errors.vehicleNumber ? '#F25C5C' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, color: '#F0F2F8', padding: '12px 16px', fontSize: 15, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
              />
              {errors.vehicleNumber && <div style={{ fontSize: 12, color: '#F25C5C', marginTop: 4 }}>⚠ {errors.vehicleNumber}</div>}
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, marginBottom: 6 }}>Violation Type</div>
              <select
                value={violationType}
                onChange={e => setViolationType(e.target.value)}
                style={{ width: '100%', background: '#1A1E2A', border: `1px solid ${errors.violationType ? '#F25C5C' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, color: '#F0F2F8', padding: '12px 16px', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}
              >
                {VIOLATION_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.violationType && <div style={{ fontSize: 12, color: '#F25C5C', marginTop: 4 }}>⚠ {errors.violationType}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
            <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>← Back</Btn>
            <Btn onClick={nextStep} style={{ flex: 2, justifyContent: 'center' }}>Next: Capture Location →</Btn>
          </div>
        </Card>
      )}

      {/* STEP 3 — Location */}
      {step === 3 && (
        <Card>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: '1.5rem' }}>Capture GPS Location</h3>

          {!location ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📍</div>
              <p style={{ color: '#8B93A8', marginBottom: 24, fontSize: 15 }}>
                We'll capture your exact GPS coordinates and reverse-geocode the address.
              </p>
              <Btn onClick={captureLocation} disabled={locating} size="lg" style={{ justifyContent: 'center' }}>
                {locating ? <><Spinner size={18} /> Locating...</> : '📍 Capture My Location'}
              </Btn>
              {errors.location && <div style={{ fontSize: 13, color: '#F25C5C', marginTop: 12 }}>⚠ {errors.location}</div>}
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(62,207,142,0.07)', border: '1px solid rgba(62,207,142,0.2)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: 11, color: '#3ECF8E', fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>✓ GPS LOCATION CAPTURED</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{location.address}</div>
                <div style={{ fontSize: 12, color: '#5A6176' }}>
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </div>
              </div>
              <div style={{ background: '#1A1E2A', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 31px),repeating-linear-gradient(90deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 31px)' }} />
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📍</div>
                  <div style={{ fontSize: 13, color: '#F5C842', fontWeight: 600 }}>{location.address.split(',')[0]}</div>
                  <div style={{ fontSize: 11, color: '#3A4256', marginTop: 4 }}>Map preview available with Google Maps API key</div>
                </div>
              </div>
              <Btn variant="ghost" size="sm" onClick={() => setLocation(null)}>Re-capture location</Btn>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
            <Btn variant="ghost" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>← Back</Btn>
            <Btn onClick={handleSubmit} disabled={!location || submitting} style={{ flex: 2, justifyContent: 'center' }}>
              {submitting ? <><Spinner size={18} /> Submitting...</> : '✓ Submit Report'}
            </Btn>
          </div>
        </Card>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
