import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { vivaApi } from '../utils/api';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

function scoreColor(s) { return s >= 7 ? '#34d399' : s >= 5 ? '#fbbf24' : '#f87171'; }

export default function FinalResult() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const [report,       setReport]       = useState(null);
  const [reportSource, setReportSource] = useState(null);
  const [savedId,      setSavedId]      = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!state?.answers?.length) { navigate('/'); return; }

    vivaApi.report({
      sessionPlan: {
        subject: state.setupState.subject,
        topic:   state.setupState.topic || '',
      },
      answers: state.answers.map(a => ({
        question:        a.question,
        transcript:      a.transcript,
        score:           a.score,
        feedback:        a.feedback,
        missingConcepts: a.missingConcepts,
      })),
    }).then(data => {
      setReport(data.report);
      setReportSource(data.reportSource);
      setLoading(false);
      saveToDb(data.report, data.reportSource);
    }).catch(() => {
      // Fallback report from local scores
      const avg = state.answers.reduce((s, a) => s + a.score, 0) / state.answers.length;
      const allMissing = [...new Set(state.answers.flatMap(a => a.missingConcepts))];
      const fb = {
        overallStrengths:      avg >= 7 ? ['Demonstrated solid foundational knowledge'] : ['Completed all questions'],
        weakConcepts:          allMissing,
        revisionTopics:        allMissing,
        nextSessionSuggestion: 'Focus on the weak concepts identified above.',
        improvementPlan:       'Review core concepts and practice explaining them aloud.',
      };
      setReport(fb);
      setReportSource('fallback');
      setLoading(false);
      saveToDb(fb, 'fallback');
    });
  }, [state, navigate]);

  const saveToDb = async (rpt, src) => {
    setSaving(true);
    try {
      const res = await vivaApi.saveSession({
        studentId:      localStorage.getItem('vivamate_student_id'),
        subject:        state.setupState.subject,
        topic:          state.setupState.topic || '',
        difficultyMode: state.setupState.difficulty,
        language:       state.setupState.language,
        totalQuestions: state.setupState.totalQuestions,
        answers:        state.answers,
        report:         rpt,
        reportSource:   src,
      });
      setSavedId(res._id);
    } catch (e) {
      setSaveError(e.response?.data?.error?.message || 'Failed to save session to database.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="container page">
      <div className="full-loader"><div className="spinner" /><span>Generating your learning report...</span></div>
    </div>
  );

  if (!state?.answers || !report) return (
    <div className="container page">
      <div className="error-banner">No result data found.
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: '1rem' }} onClick={() => navigate('/')}>Go home</button>
      </div>
    </div>
  );

  const answers    = state.answers || [];
  const totalScore = answers.reduce((s, a) => s + a.score, 0);
  const maxScore   = answers.length * 10;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const average    = (totalScore / answers.length).toFixed(1);

  const radarData = [
    { dim: 'Correctness',  val: Math.round(answers.reduce((s, a) => s + a.rubric.correctness, 0)        / answers.length) },
    { dim: 'Relevance',    val: Math.round(answers.reduce((s, a) => s + a.rubric.relevance, 0)          / answers.length) },
    { dim: 'Completeness', val: Math.round(answers.reduce((s, a) => s + a.rubric.completeness, 0)       / answers.length) },
    { dim: 'Technical',    val: Math.round(answers.reduce((s, a) => s + a.rubric.technicalAccuracy, 0)  / answers.length) },
    { dim: 'Explanation',  val: Math.round(answers.reduce((s, a) => s + a.rubric.explanationQuality, 0) / answers.length) },
  ];
  const trendData = answers.map((a, i) => ({ q: `Q${i + 1}`, score: a.score }));

  return (
    <div className="container page animate-in" style={{ maxWidth: 900 }}>
      {/* Score header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--grad-card)', borderColor: 'var(--border-accent)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '.5rem' }}>🏆</div>
        <h1 style={{ marginBottom: '.25rem', fontSize: '2rem' }}>Viva Complete!</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          {state.setupState.subject}{state.setupState.topic ? ` — ${state.setupState.topic}` : ''}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor(parseFloat(average)), fontFamily: 'var(--font-display)' }}>
              {average}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/10</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Avg Score</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor(percentage / 10), fontFamily: 'var(--font-display)' }}>
              {percentage}%
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Overall</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--violet-light)', fontFamily: 'var(--font-display)' }}>
              {totalScore}/{maxScore}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Total Points</div>
          </div>
        </div>

        {/* Save status */}
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'center' }}>
          {saving && (
            <div className="info-banner" style={{ justifyContent: 'center' }}>
              <div className="spinner" style={{ width: 14, height: 14 }} /> Saving session to database...
            </div>
          )}
          {savedId && (
            <div className="success-banner" style={{ justifyContent: 'center' }}>
              <CheckCircle size={15} /> Session saved to database (ID: ...{savedId.slice(-8)})
            </div>
          )}
          {saveError && (
            <div className="error-banner" style={{ justifyContent: 'center' }}>
              <AlertCircle size={15} /> {saveError}
            </div>
          )}
          {reportSource === 'fallback' && (
            <div className="info-banner" style={{ justifyContent: 'center' }}>
              ℹ️ Report generated from local scores (AI report generation failed — session still saved).
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Skill Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,.1)" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Radar dataKey="val" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Score per Question</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" />
              <XAxis dataKey="q" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: '#f8fafc' }} />
              <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#22d3ee', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Personalised Learning Report */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-accent)' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>📋 Personalised Learning Report</h3>

        {report.overallStrengths?.length > 0 && (
          <div className="report-section">
            <h4>✅ Overall Strengths</h4>
            <ul style={{ paddingLeft: '1.2rem' }}>
              {report.overallStrengths.map((s, i) => (
                <li key={i} style={{ color: '#6ee7b7', marginBottom: '.25rem', fontSize: '.93rem' }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {report.weakConcepts?.length > 0 && (
          <div className="report-section">
            <h4 style={{ color: '#f87171' }}>⚠️ Weak Concepts</h4>
            <div className="tag-list">
              {report.weakConcepts.map((c, i) => (
                <span key={i} className="badge badge-red">{c}</span>
              ))}
            </div>
          </div>
        )}

        {report.revisionTopics?.length > 0 && (
          <div className="report-section">
            <h4>📖 Revision Topics</h4>
            <ul style={{ paddingLeft: '1.2rem' }}>
              {report.revisionTopics.map((t, i) => (
                <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: '.25rem', fontSize: '.93rem' }}>• {t}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="report-section">
          <h4>🎯 Next Session Suggestion</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.93rem' }}>{report.nextSessionSuggestion}</p>
        </div>

        <div className="report-section">
          <h4>📈 Improvement Plan</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.93rem' }}>{report.improvementPlan}</p>
        </div>
      </div>

      {/* Per-answer breakdown */}
      <h3 style={{ marginBottom: '1rem' }}>Answer Breakdown</h3>
      {answers.map((a, i) => (
        <details key={i} className="card" style={{ marginBottom: '.75rem' }}>
          <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginRight: '.75rem' }}>Q{i + 1}</span>
              <span style={{ fontSize: '.9rem', color: 'var(--text-secondary)' }}>
                {a.question.slice(0, 80)}{a.question.length > 80 ? '…' : ''}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: scoreColor(a.score), flexShrink: 0, marginLeft: '1rem' }}>
              {a.score}/10
            </span>
          </summary>
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '.88rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Your answer: <em>{a.transcript || '(no answer given)'}</em>
            </p>
            <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', marginBottom: '.75rem' }}>{a.feedback}</p>
            {a.missingConcepts?.length > 0 && (
              <div className="tag-list">
                {a.missingConcepts.map((c, j) => (
                  <span key={j} className="badge badge-red" style={{ fontSize: '.75rem' }}>{c}</span>
                ))}
              </div>
            )}
            {a.adaptiveDecision?.reason && (
              <div className="adaptive-banner" style={{ marginTop: '.75rem' }}>
                🧠 {a.adaptiveDecision.reason}
              </div>
            )}
          </div>
        </details>
      ))}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/setup')}>
          <Brain size={18} /> New Viva
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
        {savedId && (
          <button className="btn btn-ghost" onClick={() => navigate(`/sessions/${savedId}`)}>View Saved Session</button>
        )}
      </div>
    </div>
  );
}
