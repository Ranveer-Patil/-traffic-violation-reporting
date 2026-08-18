// src/pages/StatsPage.jsx
import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../services/api';
import { StatCard, Card } from '../components/ui';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F5C842', borderRadius: '50%' }} />
    </div>
  );

  const approvalRate = stats?.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }} className="fade-up">
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>System Statistics</h1>
      <p style={{ color: '#8B93A8', fontSize: 14, marginBottom: '2rem' }}>Overview of all reports in the CivicAlert system.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: '2rem' }}>
        <StatCard label="Total Reports" value={stats?.total ?? 0} icon="📋" />
        <StatCard label="Pending Review" value={stats?.pending ?? 0} color="#F5C842" icon="⏳" />
        <StatCard label="Approved" value={stats?.approved ?? 0} color="#3ECF8E" icon="✓" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} color="#F25C5C" icon="✗" />
        <StatCard label="Registered Users" value={stats?.users ?? 0} icon="👥" />
        <StatCard label="Approval Rate" value={`${approvalRate}%`} color="#5B8AF5" icon="📈" />
      </div>

      {/* Visual bar */}
      {stats?.total > 0 && (
        <Card>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: '1.25rem' }}>Report Status Breakdown</h3>
          <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
            {stats.approved > 0 && (
              <div style={{ flex: stats.approved, background: '#3ECF8E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0B0D11' }}>
                {Math.round(stats.approved / stats.total * 100)}%
              </div>
            )}
            {stats.pending > 0 && (
              <div style={{ flex: stats.pending, background: '#F5C842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0B0D11' }}>
                {Math.round(stats.pending / stats.total * 100)}%
              </div>
            )}
            {stats.rejected > 0 && (
              <div style={{ flex: stats.rejected, background: '#F25C5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {Math.round(stats.rejected / stats.total * 100)}%
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
            {[['#3ECF8E', 'Approved'], ['#F5C842', 'Pending'], ['#F25C5C', 'Rejected']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8B93A8' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
