import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { vivaApi } from '../utils/api';

function scorePct(pct) { return pct >= 75 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171'; }

export default function SessionHistory() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    vivaApi.listSessions()
      .then(setData)
      .catch(e => setError(e.response?.data?.error?.message || 'Failed to load sessions.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container page"><div className="full-loader"><div className="spinner" /><span>Loading history...</span></div></div>;
  if (error)   return <div className="container page"><div className="error-banner">⚠️ {error}</div></div>;

  const { sessions = [] } = data || {};

  return (
    <div className="container page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '.25rem' }}>Session History</h1>
          <p>{sessions.length} session{sessions.length !== 1 ? 's' : ''} completed</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/setup')}>+ New Viva</button>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No sessions yet</h3>
          <p>Start a viva to see your history here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/setup')}>Start Viva</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {sessions.map(s => (
            <div key={s._id} className="session-row"
              onClick={() => navigate(`/sessions/${s._id}`)}
              style={{ cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{s.subject}</span>
                  {s.topic && <span className="chip">{s.topic}</span>}
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-violet">{s.difficultyMode}</span>
                  <span className="badge badge-cyan">{s.language}</span>
                  <span className="chip">{s.totalQuestions} Q</span>
                  {s.reportSource === 'fallback' && <span className="badge badge-orange">Fallback report</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: scorePct(s.totals?.percentage) }}>
                    {s.totals?.percentage ?? '—'}%
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                    <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
