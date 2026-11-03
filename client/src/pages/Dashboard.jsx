import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, BookOpen, TrendingUp, Brain, ChevronRight, Calendar } from 'lucide-react';
import { vivaApi } from '../utils/api';

function scorePct(pct) {
  if (pct >= 75) return '#34d399';
  if (pct >= 50) return '#fbbf24';
  return '#f87171';
}

function StatCard({ icon, label, value, color, suffix = '' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="stat-value" style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    vivaApi.listSessions()
      .then(setData)
      .catch(e => setError(e.response?.data?.error?.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="container page">
      <div className="full-loader"><div className="spinner" /><span>Loading dashboard...</span></div>
    </div>
  );

  if (error) return (
    <div className="container page">
      <div className="error-banner">⚠️ {error}</div>
    </div>
  );

  const { sessions = [], stats = {} } = data || {};

  return (
    <div className="container page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '.25rem' }}>Dashboard</h1>
          <p style={{ fontSize: '.9rem' }}>Your viva practice overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>
          <Brain size={16} /> New Viva
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4 section">
        <StatCard icon={<Target size={20} />}    label="Total Attempts"  value={stats.totalAttempts || 0}  color="#7c3aed" />
        <StatCard icon={<TrendingUp size={20} />} label="Average Score"  value={stats.avgScore || 0}       color="#22d3ee" suffix="%" />
        <StatCard icon={<Trophy size={20} />}     label="Best Score"     value={stats.bestScore || 0}      color="#f59e0b" suffix="%" />
        <StatCard icon={<BookOpen size={20} />}   label="Questions Done" value={stats.totalQuestions || 0} color="#10b981" />
      </div>

      {/* Subject performance */}
      {stats.subjectWise?.length > 0 && (
        <section className="section">
          <h3 style={{ marginBottom: '1rem' }}>Subject Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {stats.subjectWise.map(sw => (
              <div key={sw.subject}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                  <span style={{ fontSize: '.9rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{sw.subject}</span>
                  <span style={{ fontSize: '.9rem', fontWeight: 700, color: scorePct(sw.avgPercentage) }}>{sw.avgPercentage}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${sw.avgPercentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent sessions */}
      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Recent Sessions</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
            View all <ChevronRight size={14} />
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <h3>No sessions yet</h3>
            <p>Start your first viva to see your progress here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/setup')}><Brain size={16} /> Start Viva</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {sessions.slice(0, 5).map(s => (
              <div key={s._id} className="session-row" onClick={() => navigate(`/sessions/${s._id}`)} style={{ cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '.25rem' }}>{s.subject}</div>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {s.topic && <span className="chip">{s.topic}</span>}
                    <span className="badge badge-violet">{s.difficultyMode}</span>
                    <span className="badge badge-cyan">{s.language}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: scorePct(s.totals?.percentage) }}>
                    {s.totals?.percentage ?? '—'}%
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                    <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
