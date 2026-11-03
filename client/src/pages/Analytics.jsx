import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vivaApi } from '../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    vivaApi.listSessions()
      .then(setData)
      .catch(e => setError(e.response?.data?.error?.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container page"><div className="full-loader"><div className="spinner" /><span>Loading analytics...</span></div></div>;
  if (error)   return <div className="container page"><div className="error-banner">⚠️ {error}</div></div>;

  const { sessions = [], stats = {} } = data || {};

  if (sessions.length === 0) return (
    <div className="container page">
      <h1 style={{ marginBottom: '1rem' }}>Analytics</h1>
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>No data yet</h3>
        <p>Complete a viva session to see your analytics.</p>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>Start Viva</button>
      </div>
    </div>
  );

  const trendData = sessions.slice().reverse().map((s, i) => ({
    name:    `#${i + 1}`,
    score:   s.totals?.percentage || 0,
    subject: s.subject,
  }));

  const subjectData = (stats.subjectWise || []).map(sw => ({
    subject: sw.subject.length > 14 ? sw.subject.slice(0, 14) + '…' : sw.subject,
    avg:     sw.avgPercentage,
  }));

  return (
    <div className="container page animate-in">
      <h1 style={{ marginBottom: '2rem' }}>Analytics</h1>

      {/* Summary stats */}
      <div className="grid-4 section">
        {[
          ['Total Sessions',  stats.totalAttempts  || 0],
          ['Avg Score',      `${stats.avgScore     || 0}%`],
          ['Best Score',     `${stats.bestScore    || 0}%`],
          ['Questions Done',  stats.totalQuestions || 0],
        ].map(([l, v]) => (
          <div key={l} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{v}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem', marginTop: '.25rem' }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 section">
        {/* Score trend */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Score Trend Over Sessions</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: '#f8fafc' }}
                formatter={(v) => [`${v}%`, 'Score']}
                labelFormatter={(_, pl) => pl?.[0]?.payload?.subject || ''}
              />
              <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#22d3ee', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject averages */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Subject Averages</h3>
          {subjectData.length === 0 ? (
            <p style={{ textAlign: 'center', paddingTop: '2rem' }}>Only one subject so far.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" />
                <XAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: '#f8fafc' }}
                  formatter={(v) => [`${v}%`, 'Avg']}
                />
                <Bar dataKey="avg" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
