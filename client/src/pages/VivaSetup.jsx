import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Info } from 'lucide-react';

const SUBJECTS = [
  'Data Science', 'Machine Learning', 'Cyber Security',
  'Computer Networks', 'Theory of Computation', 'Internet of Things',
  'Business Management', 'Custom',
];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Adaptive'];
const QUESTION_COUNTS = [5, 10];
const LANGUAGES = ['English', 'Hindi', 'Hinglish'];

export default function VivaSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: 'Data Science',
    customSubject: '',
    topic: '',
    difficulty: 'Adaptive',
    totalQuestions: 5,
    language: 'English',
  });

  const handleStart = () => {
    const subject = form.subject === 'Custom' ? form.customSubject.trim() : form.subject;
    if (!subject) { alert('Please enter a custom subject name.'); return; }
    navigate('/viva', { state: { ...form, subject } });
  };

  return (
    <div className="container page animate-in" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '.35rem' }}>Setup Your Viva</h1>
        <p>Configure your oral exam session. The AI will adapt to your performance in real-time.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Subject */}
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>📚 Subject</h4>
          <div className="option-grid">
            {SUBJECTS.map(s => (
              <button key={s}
                className={`option-btn${form.subject === s ? ' selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, subject: s }))}>
                {s}
              </button>
            ))}
          </div>
          {form.subject === 'Custom' && (
            <input className="form-input" style={{ marginTop: '1rem' }}
              placeholder="Enter your custom subject..."
              value={form.customSubject}
              onChange={e => setForm(f => ({ ...f, customSubject: e.target.value }))} />
          )}
        </div>

        {/* Topic */}
        <div className="card">
          <h4 style={{ marginBottom: '.5rem' }}>🎯 Specific Topic <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '.85rem' }}>(optional)</span></h4>
          <p style={{ fontSize: '.88rem', marginBottom: '1rem' }}>Narrow the focus, e.g. "Decision Trees", "RSA Encryption", "OSI Model"</p>
          <input className="form-input" placeholder="Leave blank to cover the full subject..."
            value={form.topic}
            onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
        </div>

        {/* Difficulty */}
        <div className="card">
          <h4 style={{ marginBottom: '.5rem' }}>⚡ Difficulty Mode</h4>
          <p style={{ fontSize: '.88rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--violet-light)' }}>Adaptive</strong> — questions get harder/easier based on your score in real-time. Fixed modes keep difficulty constant.
          </p>
          <div className="option-grid">
            {DIFFICULTIES.map(d => (
              <button key={d}
                className={`option-btn${form.difficulty === d ? ' selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, difficulty: d }))}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Questions & Language */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ marginBottom: '.75rem' }}>🔢 Questions</h4>
            <div className="option-grid">
              {QUESTION_COUNTS.map(n => (
                <button key={n}
                  className={`option-btn${form.totalQuestions === n ? ' selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, totalQuestions: n }))}>
                  {n} questions
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <h4 style={{ marginBottom: '.75rem' }}>🌐 Language</h4>
            <div className="option-grid">
              {LANGUAGES.map(l => (
                <button key={l}
                  className={`option-btn${form.language === l ? ' selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, language: l }))}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language note */}
        {(form.language === 'Hindi' || form.language === 'Hinglish') && (
          <div className="info-banner">
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Hinglish/Hindi mode:</strong> Questions are in English; you can answer in Hindi, English, or a mix.
              Speech recognition uses the <code>hi-IN</code> locale. If your device doesn't have a Hindi TTS voice, English voice is used as fallback.
            </span>
          </div>
        )}

        {/* Summary */}
        <div className="card card-accent" style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>Selected:</span>
          <span className="badge badge-violet">{form.subject === 'Custom' ? (form.customSubject || 'Custom') : form.subject}</span>
          {form.topic && <span className="badge badge-cyan">{form.topic}</span>}
          <span className="badge badge-green">{form.difficulty}</span>
          <span className="badge badge-orange">{form.totalQuestions} questions</span>
          <span className="badge badge-violet">{form.language}</span>
        </div>

        <button className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-end' }} onClick={handleStart}>
          Begin Viva <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
