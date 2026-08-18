// src/pages/DashboardPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyReports } from '../services/api';
import { StatCard, EmptyState, Btn, Card } from '../components/ui';
import ReportCard from '../components/ReportCard';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyReports();
      setReports(res.data.reports);
      await refreshUser();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => { load(); }, [load]);

  const counts = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    approved: reports.filter(r => r.status === 'Approved').length,
    rejected: reports.filter(r => r.status === 'Rejected').length,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#8B93A8', fontSize: 14 }}>Track your reports and civic contributions.</p>
        </div>
        <Btn onClick={() => navigate('/submit')} size="md">+ Report Violation</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: '2rem' }}>
        <StatCard label="Total Reports" value={counts.total} icon="📋" />
        <StatCard label="Pending" value={counts.pending} color="#F5C842" icon="⏳" />
        <StatCard label="Approved" value={counts.approved} color="#3ECF8E" icon="✓" />
        <StatCard label="Civic Points" value={user?.points ?? 0} color="#F5C842" icon="⭐" />
      </div>

      {/* Recent activity notice */}
      {counts.approved > 0 && (
        <div style={{ background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: '1.5rem', fontSize: 14, color: '#3ECF8E', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>✓</span>
          <span>{counts.approved} of your report{counts.approved > 1 ? 's' : ''} approved — you've earned <strong>{user?.points} civic points</strong>!</span>
        </div>
      )}

      {/* Reports list */}
      <div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: '1rem' }}>My Reports</h2>

        {error && (
          <div style={{ background: 'rgba(242,92,92,0.1)', border: '1px solid rgba(242,92,92,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#F25C5C', fontSize: 14 }}>
            {error} <button onClick={load} style={{ background: 'none', border: 'none', color: '#F5C842', cursor: 'pointer', marginLeft: 8 }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F5C842', borderRadius: '50%' }} />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <EmptyState
              icon="📷"
              title="No reports yet"
              subtitle="Submit your first traffic violation report and start earning civic points."
              action={<Btn onClick={() => navigate('/submit')}>Submit First Report →</Btn>}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.map(r => <ReportCard key={r.id} report={r} isAdmin={false} />)}
          </div>
        )}
      </div>
    </div>
  );
}
