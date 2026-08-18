// src/pages/LeaderboardPage.jsx
import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/api';
import { Avatar, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(r => setLeaders(r.data.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }} className="fade-up">
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>Civic Leaderboard</h1>
      <p style={{ color: '#8B93A8', fontSize: 14, marginBottom: '2rem' }}>
        Top citizen reporters ranked by civic points earned from approved reports.
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F5C842', borderRadius: '50%' }} />
        </div>
      ) : (
        <Card style={{ padding: 0 }}>
          {leaders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8B93A8' }}>
              No data yet. Be the first to submit and get approved!
            </div>
          ) : leaders.map((u, i) => {
            const isYou = u.id === user?.id;
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1rem 1.5rem', borderBottom: i < leaders.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: isYou ? 'rgba(245,200,66,0.04)' : 'transparent', borderLeft: isYou ? '2px solid #F5C842' : '2px solid transparent', transition: 'background 0.2s' }}>
                {/* Rank */}
                <div style={{ width: 36, textAlign: 'center', fontSize: i < 3 ? 24 : 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#5A6176', flexShrink: 0 }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                {/* Avatar */}
                <Avatar name={u.name} avatar={u.avatar} size={40} />
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.name}
                    {isYou && <span style={{ fontSize: 11, background: 'rgba(245,200,66,0.15)', color: '#F5C842', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#5A6176' }}>{u.email}</div>
                </div>
                {/* Points */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: i === 0 ? '#F5C842' : '#F0F2F8' }}>{u.points}</div>
                  <div style={{ fontSize: 11, color: '#5A6176' }}>points</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <div style={{ marginTop: '1.5rem', background: 'rgba(245,200,66,0.07)', border: '1px solid rgba(245,200,66,0.15)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#8B93A8' }}>
        ⭐ Earn <strong style={{ color: '#F5C842' }}>+10 civic points</strong> for every report approved by an admin. Points are civic recognition only — not real monetary rewards.
      </div>
    </div>
  );
}
