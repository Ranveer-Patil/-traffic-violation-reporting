// src/components/ui.js — Shared UI primitives for CivicAlert
import React, { useEffect } from 'react';

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = '', avatar, size = 36 }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #F5C842, #E8A020)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#0B0D11',
      fontFamily: 'Syne, sans-serif', flexShrink: 0,
      border: '2px solid rgba(245,200,66,0.3)',
    }}>
      {initials || '?'}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  Pending: { bg: 'rgba(245,200,66,0.15)', color: '#F5C842' },
  Approved: { bg: 'rgba(62,207,142,0.15)', color: '#3ECF8E' },
  Rejected: { bg: 'rgba(242,92,92,0.15)', color: '#F25C5C' },
};

export function Badge({ status }) {
  const style = BADGE_COLORS[status] || BADGE_COLORS.Pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 20, letterSpacing: 0.5,
      background: style.bg, color: style.color,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #F5C842, #E8A020)',
    color: '#0B0D11',
    border: 'none',
    fontWeight: 700,
  },
  ghost: {
    background: '#1A1E2A',
    color: '#8B93A8',
    border: '1px solid rgba(255,255,255,0.07)',
    fontWeight: 500,
  },
  success: {
    background: 'rgba(62,207,142,0.15)',
    color: '#3ECF8E',
    border: '1px solid rgba(62,207,142,0.3)',
    fontWeight: 600,
  },
  danger: {
    background: 'rgba(242,92,92,0.15)',
    color: '#F25C5C',
    border: '1px solid rgba(242,92,92,0.3)',
    fontWeight: 600,
  },
};

const BTN_SIZES = {
  sm: { padding: '8px 14px', fontSize: 13 },
  md: { padding: '10px 20px', fontSize: 14 },
  lg: { padding: '14px 28px', fontSize: 15 },
};

export function Btn({ children, variant = 'primary', size = 'md', disabled, onClick, style: customStyle, ...rest }) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const s = BTN_SIZES[size] || BTN_SIZES.md;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v, ...s,
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'DM Sans, sans-serif',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all 0.15s ease',
        ...customStyle,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style: customStyle, ...rest }) {
  return (
    <div
      style={{
        background: '#13161E',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '1.5rem',
        ...customStyle,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = '#F0F2F8' }) {
  return (
    <div style={{
      background: '#13161E',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#5A6176', fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ fontSize: 18, opacity: 0.8 }}>{icon}</span>}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 800,
        fontFamily: 'Syne, sans-serif',
        color,
      }}>
        {value}
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: 18, marginBottom: 8,
      }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ color: '#5A6176', fontSize: 14, marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
          {subtitle}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, style: customStyle, ...rest }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, marginBottom: 6 }}>
          {label}
        </div>
      )}
      <input
        style={{
          width: '100%',
          background: '#1A1E2A',
          border: `1px solid ${error ? '#F25C5C' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 10,
          color: '#F0F2F8',
          padding: '12px 16px',
          fontSize: 15,
          outline: 'none',
          fontFamily: 'DM Sans, sans-serif',
          transition: 'border-color 0.2s',
          ...customStyle,
        }}
        onFocus={e => { e.target.style.borderColor = '#F5C842'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#F25C5C' : 'rgba(255,255,255,0.07)'; }}
        {...rest}
      />
      {error && <div style={{ fontSize: 12, color: '#F25C5C', marginTop: 4 }}>⚠ {error}</div>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, options = [], error, style: customStyle, ...rest }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, marginBottom: 6 }}>
          {label}
        </div>
      )}
      <select
        style={{
          width: '100%',
          background: '#1A1E2A',
          border: `1px solid ${error ? '#F25C5C' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 10,
          color: '#F0F2F8',
          padding: '12px 16px',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235A6176' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
          ...customStyle,
        }}
        {...rest}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div style={{ fontSize: 12, color: '#F25C5C', marginTop: 4 }}>⚠ {error}</div>}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
const TOAST_COLORS = {
  success: { bg: 'rgba(62,207,142,0.15)', border: 'rgba(62,207,142,0.3)', color: '#3ECF8E', icon: '✓' },
  error: { bg: 'rgba(242,92,92,0.15)', border: 'rgba(242,92,92,0.3)', color: '#F25C5C', icon: '✗' },
  warning: { bg: 'rgba(245,200,66,0.15)', border: 'rgba(245,200,66,0.3)', color: '#F5C842', icon: '⚠' },
  info: { bg: 'rgba(91,138,245,0.15)', border: 'rgba(91,138,245,0.3)', color: '#5B8AF5', icon: 'ℹ' },
};

export function Toast({ msg, type = 'info', onClose, duration = 4000 }) {
  const t = TOAST_COLORS[type] || TOAST_COLORS.info;

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#13161E', border: `1px solid ${t.border}`,
      borderRadius: 14, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      maxWidth: 420, animation: 'fadeUp 0.3s ease',
    }}>
      <span style={{
        width: 30, height: 30, borderRadius: 8,
        background: t.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: t.color, fontWeight: 700,
        fontSize: 14, flexShrink: 0,
      }}>
        {t.icon}
      </span>
      <span style={{ fontSize: 14, color: '#F0F2F8', flex: 1 }}>{msg}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', color: '#5A6176',
          cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = '#F5C842' }) {
  return (
    <div
      className="spinner"
      style={{
        width: size, height: size,
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: color,
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  );
}
