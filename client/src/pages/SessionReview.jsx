import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vivaApi } from '../utils/api';
import { ArrowLeft, Calendar } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

function scoreColor(s) { return s >= 7 ? '#34d399' : s >= 5 ? '#fbbf24' : '#f87171'; }

export default function SessionReview() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    vivaApi.getSession(id)
      .then(setSession)
      .catch(e => setError(e.response?.data?.error?.message || 'Failed to load session.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container page"><div className="full-loader"><div className="spinner" /><span>Loading session...</span></div></div>;
  if (error)   return (
    <div className="container page">
      <div className="error-banner">
        ⚠️ {error}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: '1rem' }} onClick={() => navigate('/history')}>← Back</button>
      </div>
    </div>
  );
  if (!session) return null;

  const answers = session.answers || [];

  const radarData = answers.length ? [
    { dim: 'Correctness',  val: Math.round(answers.reduce((s, a) => s + (a.rubric?.correctness        || 0), 0) / answers.length) },
    { dim: 'Relevance',    val: Math.round(answers.reduce((s, a) => s + (a.rubric?.relevance          || 0), 0) / answers.length) },
    { dim: 'Completeness', val: Math.round(answers.reduce((s, a) => s + (a.rubric?.completeness       || 0), 0) / answers.length) },
    { dim: 'Technical',    val: Math.round(answers.reduce((s, a) => s + (a.rubric?.technicalAccuracy  || 0), 0) / answers.length) },
    { dim: 'Explanation',  val: Math.round(answers.reduce((s, a) => s + (a.rubric?.explanationQuality || 0), 0) / answers.length) },
  ] : [];

  const trendData = answers.map((a, i) => ({ q: `Q${i + 1}`, score: a.score }));

  return (
    <div className="container page animate-in" style={{ maxWidth: 900 }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/history')}>
        <ArrowLeft size={14} /> Back to History
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-accent)', background: 'var(--grad-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '.5rem' }}>{session.subject}</h2>
            {session.topic && <p style={{ marginBottom: '.75rem' }}>{session.topic}</p>}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-violet">{session.difficultyMode}</span>
              <span className="badge badge-cyan">{session.language}</span>
              <span className="chip">{session.totalQuestions} questions</span>
              {session.reportSource === 'fallback' && <span className="badge badge-orange">Fallback report</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.5rem', color: scoreColor((session.totals?.percentage || 0) / 10) }}>
              {session.totals?.percentage ?? '—'}%
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
              {session.totals?.score}/{session.totals?.max} pts · avg {session.totals?.average}/10
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>
              <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
              {new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {(radarData.length > 0 || trendData.length > 0) && (
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {radarData.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Skill Radar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,.1)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar dataKey="val" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
          {trendData.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Score per Question</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" />
                  <XAxis dataKey="q" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#22d3ee', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Learning Report */}
      {session.report && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-accent)' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Learning Report</h3>

          {session.report.overallStrengths?.length > 0 && (
            <div className="report-section">
              <h4>✅ Strengths</h4>
              <ul style={{ paddingLeft: '1.2rem' }}>
                {session.report.overallStrengths.map((s, i) => (
                  <li key={i} style={{ color: '#6ee7b7', fontSize: '.9rem', marginBottom: '.2rem' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {session.report.weakConcepts?.length > 0 && (
            <div className="report-section">
              <h4 style={{ color: '#f87171' }}>⚠️ Weak Concepts</h4>
              <div className="tag-list">
                {session.report.weakConcepts.map((c, i) => (
                  <span key={i} className="badge badge-red">{c}</span>
                ))}
              </div>
            </div>
          )}

          {session.report.revisionTopics?.length > 0 && (
            <div className="report-section">
              <h4>📖 Revision Topics</h4>
              <ul style={{ paddingLeft: '1.2rem' }}>
                {session.report.revisionTopics.map((t, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '.9rem', marginBottom: '.2rem' }}>• {t}</li>
                ))}
              </ul>
            </div>
          )}

          {session.report.nextSessionSuggestion && (
            <div className="report-section">
              <h4>🎯 Next Session Suggestion</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>{session.report.nextSessionSuggestion}</p>
            </div>
          )}

          {session.report.improvementPlan && (
            <div className="report-section">
              <h4>📈 Improvement Plan</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>{session.report.improvementPlan}</p>
            </div>
          )}
        </div>
      )}

      {/* Answer breakdown */}
      <h3 style={{ marginBottom: '1rem' }}>Answer Breakdown</h3>
      {answers.map((a, i) => (
        <details key={i} className="card" style={{ marginBottom: '.75rem' }}>
          <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginRight: '.75rem' }}>Q{i + 1}</span>
              <span style={{ fontSize: '.9rem', color: 'var(--text-secondary)' }}>
                {a.question?.slice(0, 80)}{(a.question?.length || 0) > 80 ? '…' : ''}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: scoreColor(a.score), flexShrink: 0, marginLeft: '1rem' }}>
              {a.score}/10
            </span>
          </summary>
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '.88rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Answer: <em>{a.transcript || '(none provided)'}</em>
            </p>
            <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', marginBottom: '.75rem' }}>{a.feedback}</p>

            {/* Rubric scores inline */}
            {a.rubric && (
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                {Object.entries({
                  Correctness: a.rubric.correctness,
                  Relevance:   a.rubric.relevance,
                  Completeness: a.rubric.completeness,
                  Technical:   a.rubric.technicalAccuracy,
                  Explanation: a.rubric.explanationQuality,
                }).map(([k, v]) => (
                  <span key={k} className="chip" style={{ color: scoreColor(v) }}>{k}: {v}/10</span>
                ))}
              </div>
            )}

            {a.missingConcepts?.length > 0 && (
              <div className="tag-list" style={{ marginBottom: '.5rem' }}>
                {a.missingConcepts.map((c, j) => (
                  <span key={j} className="badge badge-red" style={{ fontSize: '.75rem' }}>{c}</span>
                ))}
              </div>
            )}

            {a.adaptiveDecision?.reason && (
              <div className="adaptive-banner" style={{ marginTop: '.5rem' }}>
                🧠 {a.adaptiveDecision.reason}
              </div>
            )}
          </div>
        </details>
      ))}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/history')}>← All Sessions</button>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>New Viva</button>
      </div>
    </div>
  );
}
