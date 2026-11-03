import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mic, BarChart2, Trophy, Zap, Shield, ChevronRight, TrendingUp } from 'lucide-react';

const FEATURES = [
  { icon: <Brain size={24} />, title: 'Adaptive AI Examiner', desc: 'Questions adapt in real-time based on your score — harder when you ace it, supportive when you need it.', color: '#7c3aed' },
  { icon: <Mic size={24} />, title: 'Voice-First Experience', desc: 'Speak your answers naturally. The AI listens, transcribes, and evaluates just like a real examiner.', color: '#22d3ee' },
  { icon: <BarChart2 size={24} />, title: 'Rubric-Based Scoring', desc: '5-dimension rubric: Correctness, Relevance, Completeness, Technical Accuracy, and Explanation Quality.', color: '#6366f1' },
  { icon: <Trophy size={24} />, title: 'Personalised Reports', desc: 'Every session ends with a tailored learning report: strengths, weak concepts, revision topics, and improvement plan.', color: '#f59e0b' },
  { icon: <TrendingUp size={24} />, title: 'Progress Analytics', desc: 'Track score trends, subject-wise performance, and difficulty progression across all your viva sessions.', color: '#10b981' },
  { icon: <Shield size={24} />, title: 'Privacy First', desc: 'No accounts, no email. Demo identity is a browser UUID. No personal data is collected or stored.', color: '#ef4444' },
];

const SUBJECTS = ['Data Science', 'Machine Learning', 'Cyber Security', 'Computer Networks', 'Theory of Computation', 'IoT', 'Business Management'];

const STEPS = [
  { num: '01', title: 'Choose your subject & settings', desc: 'Pick subject, difficulty mode, number of questions (5 or 10), and language.' },
  { num: '02', title: 'Answer the examiner aloud', desc: 'The AI examiner speaks the question. Answer by voice or type. No time pressure — speak naturally.' },
  { num: '03', title: 'Get instant evaluation', desc: 'See your rubric scores, feedback, ideal answer, and the adaptive decision for the next question.' },
  { num: '04', title: 'Receive your learning report', desc: 'After all questions, get a personalised revision plan with weak concepts and actionable next steps.' },
];

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <p className="hero-tagline">✦ AI-Powered Adaptive Viva Examiner for College Students</p>
        <h1 style={{ marginBottom: '1rem' }}>
          <span className="gradient-text">Practice Smarter.</span><br />
          Speak Confidently.<br />
          Perform Better.
        </h1>
        <p className="hero-desc">
          VivaMate AI conducts a fully adaptive oral exam, scores every answer on a 5-dimension rubric, and produces a personalised learning report — all powered by Gemini AI.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/setup')}>
            <Zap size={18} /> Start Free Viva <ChevronRight size={16} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>
            <BarChart2 size={18} /> View Dashboard
          </button>
        </div>
      </section>

      <div className="container">
        {/* Subject chips */}
        <section className="section">
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
            {SUBJECTS.map(s => (
              <span key={s} className="chip" style={{ fontSize: '.88rem', padding: '.3rem .8rem' }}>{s}</span>
            ))}
            <span className="chip" style={{ color: 'var(--violet-light)', borderColor: 'var(--border-accent)' }}>+ Custom</span>
          </div>
        </section>

        {/* Features */}
        <section className="section">
          <h2 style={{ textAlign: 'center', marginBottom: '.75rem' }}>
            Everything a real examiner does, <span className="gradient-text">and more</span>
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: 540, margin: '0 auto 2.5rem' }}>
            Built for the way students actually learn — through speaking, not typing.
          </p>
          <div className="grid-2" style={{ gap: '1.25rem' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card card-hover" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${f.color}22`, border: `1px solid ${f.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: f.color, flexShrink: 0,
                }}>{f.icon}</div>
                <div>
                  <h4 style={{ marginBottom: '.35rem' }}>{f.title}</h4>
                  <p style={{ fontSize: '.9rem' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="section">
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem' }}>How it <span className="gradient-text">works</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1.5rem' }}>
            {STEPS.map(s => (
              <div key={s.num} className="card card-accent" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: -5, fontSize: '4rem', fontWeight: 900, color: 'rgba(124,58,237,.08)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--violet-light)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>Step {s.num}</div>
                <h4 style={{ marginBottom: '.5rem' }}>{s.title}</h4>
                <p style={{ fontSize: '.9rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="section" style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className="card-glass" style={{ maxWidth: 600, margin: '0 auto', padding: '3rem', borderColor: 'var(--border-accent)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Ready to ace your <span className="gradient-text">next viva?</span></h2>
            <p style={{ marginBottom: '2rem' }}>Set up your first session in under a minute. No signup required.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/setup')}>
              <Brain size={18} /> Start Your Viva Now
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
