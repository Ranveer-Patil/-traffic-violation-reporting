// src/pages/AdminPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAdminReports, actionReport } from '../services/api';
import { StatCard, Btn, Card, Toast, EmptyState } from '../components/ui';
import ReportCard from '../components/ReportCard';
import { useNavigate } from 'react-router-dom';

const VIOLATION_OPTIONS = [
  { value: '', label: 'All Violations' },
  { value: 'No Helmet',            label: 'No Helmet' },
  { value: 'No Seatbelt',          label: 'No Seatbelt' },
  { value: 'Signal Jump',          label: 'Signal Jump' },
  { value: 'Wrong Parking',        label: 'Wrong Parking' },
  { value: 'Triple Riding',        label: 'Triple Riding' },
  { value: 'Mobile While Driving', label: 'Mobile While Driving' },
];

const STATUS_OPTIONS = [
  { value: '',         label: 'All Statuses' },
  { value: 'Pending',  label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', violationType: '', date: '' });
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.violationType) params.violationType = filters.violationType;
      if (filters.date) params.date = filters.date;
      const res = await getAdminReports(params);
      setReports(res.data.reports);
    } catch (e) {
      setToast({ msg: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id, action, note) {
    try {
      const res = await actionReport(id, action, note);
      setToast({ msg: res.data.message, type: action === 'Approved' ? 'success' : 'error' });
      load();
    } catch (e) {
      setToast({ msg: e.message, type: 'error' });
    }
  }

  const counts = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    approved: reports.filter(r => r.status === 'Approved').length,
    rejected: reports.filter(r => r.status === 'Rejected').length,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>Admin Panel</h1>
          <p style={{ color: '#8B93A8', fontSize: 14 }}>Review and action citizen-submitted violation reports.</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => navigate('/admin/stats')}>View Statistics →</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: '2rem' }}>
        <StatCard label="Total" value={counts.total} icon="📋" />
        <StatCard label="Pending" value={counts.pending} color="#F5C842" icon="⏳" />
        <StatCard label="Approved" value={counts.approved} color="#3ECF8E" icon="✓" />
        <StatCard label="Rejected" value={counts.rejected} color="#F25C5C" icon="✗" />
      </div>

      {/* Filters */}
      <div style={{ background: '#13161E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, marginBottom: 6 }}>Status</div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ width: '100%', background: '#1A1E2A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F2F8', padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, marginBottom: 6 }}>Violation Type</div>
          <select value={filters.violationType} onChange={e => setFilters(f => ({ ...f, violationType: e.target.value }))}
            style={{ width: '100%', background: '#1A1E2A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F2F8', padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {VIOLATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 13, color: '#8B93A8', fontWeight: 500, marginBottom: 6 }}>Date</div>
          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            style={{ width: '100%', background: '#1A1E2A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F0F2F8', padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setFilters({ status: '', violationType: '', date: '' })}>Clear Filters</Btn>
      </div>

      {/* Reports */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F5C842', borderRadius: '50%' }} />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <EmptyState icon="🔍" title="No reports found" subtitle="Try adjusting your filters." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(r => (
            <ReportCard key={r.id} report={r} isAdmin={true} onAction={handleAction} />
          ))}
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
