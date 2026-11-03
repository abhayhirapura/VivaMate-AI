import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { vivaApi } from '../utils/api';
import { SPEECH_SUPPORTED, TTS_SUPPORTED, createRecognizer, speak, stopSpeaking } from '../utils/speech';

function RubricBar({ label, score }) {
  const color = score >= 7 ? '#34d399' : score >= 5 ? '#fbbf24' : '#f87171';
  return (
    <div className="rubric-bar">
      <span className="rubric-label">{label}</span>
      <div className="rubric-track">
        <div className="rubric-fill" style={{ width: `${score * 10}%`, background: color }} />
      </div>
      <span className="rubric-score" style={{ color }}>{score}/10</span>
    </div>
  );
}

const PHASES = {
  LOADING:    'loading',
  QUESTION:   'question',
  RECORDING:  'recording',
  SUBMITTING: 'submitting',
  EVALUATED:  'evaluated',
  ERROR:      'error',
};

export default function VivaRoom() {
  const { state: setupState } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!setupState) navigate('/setup');
  }, [setupState, navigate]);

  const [sessionPlan,       setSessionPlan]       = useState(null);
  const [currentQuestion,   setCurrentQuestion]   = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState('');
  const [questionIndex,     setQuestionIndex]     = useState(0);
  const [allQuestions,      setAllQuestions]      = useState([]);
  const [history,           setHistory]           = useState([]);
  const [transcript,        setTranscript]        = useState('');
  const [phase,             setPhase]             = useState(PHASES.LOADING);
  const [evaluation,        setEvaluation]        = useState(null);
  const [error,             setError]             = useState(null);
  const [isSpeaking,        setIsSpeaking]        = useState(false);
  const [completedAnswers,  setCompletedAnswers]  = useState([]);
  const [vivaStarted,       setVivaStarted]       = useState(false);
  const recognizerRef = useRef(null);

  // Load session plan on mount
  useEffect(() => {
    if (!setupState) return;
    vivaApi.generate({
      subject:        setupState.subject,
      topic:          setupState.topic || '',
      difficulty:     setupState.difficulty,
      totalQuestions: setupState.totalQuestions,
      language:       setupState.language,
    }).then(data => {
      setSessionPlan(data);
      setCurrentQuestion(data.openingQuestion);
      setCurrentDifficulty(data.initialDifficulty);
      setAllQuestions([data.openingQuestion]);
      setPhase(PHASES.QUESTION);
    }).catch(e => {
      setError(e.response?.data?.error?.message || 'Failed to generate session. Check your API key and try again.');
      setPhase(PHASES.ERROR);
    });
  }, [setupState]);

  const speakQuestion = useCallback((text) => {
    if (!TTS_SUPPORTED || !text) return;
    setIsSpeaking(true);
    speak(text, setupState?.language || 'English', () => setIsSpeaking(false));
  }, [setupState]);

  // First question: need user gesture before TTS
  const handleStartViva = () => {
    if (vivaStarted) return;
    setVivaStarted(true);
    speakQuestion(currentQuestion);
  };

  const startRecording = () => {
    setTranscript('');
    setPhase(PHASES.RECORDING);
    if (!SPEECH_SUPPORTED) return; // typed-only fallback

    try {
      const rec = createRecognizer(
        setupState?.language || 'English',
        (t) => setTranscript(t),
        () => setPhase(prev => prev === PHASES.RECORDING ? PHASES.QUESTION : prev),
        (errCode) => {
          if (errCode === 'not-allowed') {
            setError('Microphone access denied. Please allow mic access or type your answer below.');
          }
          setPhase(PHASES.QUESTION);
        }
      );
      if (rec) {
        recognizerRef.current = rec;
        rec.start();
      }
    } catch (e) {
      console.warn('Failed to start recognizer:', e.message);
      setPhase(PHASES.QUESTION);
    }
  };

  const stopRecording = () => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setPhase(PHASES.QUESTION);
  };

  const submitAnswer = async () => {
    if (!sessionPlan) return;
    stopSpeaking();
    setPhase(PHASES.SUBMITTING);
    setError(null);

    try {
      const ev = await vivaApi.evaluate({
        sessionPlan: {
          subject:        setupState.subject,
          topic:          setupState.topic || '',
          difficulty:     setupState.difficulty,
          language:       setupState.language,
          conceptAreas:   sessionPlan.conceptAreas,
          totalQuestions: setupState.totalQuestions,
        },
        currentQuestion,
        currentDifficulty,
        questionIndex,
        transcript: transcript.trim(),
        history,
        allQuestions,
      });

      setEvaluation(ev);

      const answer = {
        questionIndex,
        question:        currentQuestion,
        difficultyAsked: currentDifficulty,
        transcript:      transcript.trim(),
        score:           ev.score,
        rubric: {
          correctness:        ev.correctness,
          relevance:          ev.relevance,
          completeness:       ev.completeness,
          technicalAccuracy:  ev.technicalAccuracy,
          explanationQuality: ev.explanationQuality,
        },
        feedback:        ev.feedback,
        idealAnswer:     ev.idealAnswer,
        strengths:       ev.strengths,
        improvements:    ev.improvements,
        missingConcepts: ev.missingConcepts,
        adaptiveDecision: ev.adaptiveDecision,
      };

      setCompletedAnswers(prev => [...prev, answer]);
      setHistory(prev => [...prev, {
        question: currentQuestion,
        score:    ev.score,
        summary:  transcript.slice(0, 120),
      }]);
      setPhase(PHASES.EVALUATED);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Evaluation failed. Please try again.');
      setPhase(PHASES.QUESTION);
    }
  };

  const goNextQuestion = () => {
    if (!evaluation) return;

    if (evaluation.isLastQuestion || !evaluation.followUpQuestion) {
      navigate('/result', {
        state: { setupState, sessionPlan, answers: completedAnswers },
      });
      return;
    }

    const nextQ = evaluation.followUpQuestion;
    const nextD = evaluation.adaptiveDecision?.to || currentDifficulty;
    setCurrentQuestion(nextQ);
    setCurrentDifficulty(nextD);
    setAllQuestions(prev => [...prev, nextQ]);
    setQuestionIndex(prev => prev + 1);
    setTranscript('');
    setEvaluation(null);
    setError(null);
    setPhase(PHASES.QUESTION);
    speakQuestion(nextQ);
  };

  const total    = setupState?.totalQuestions || 5;
  const progress = (questionIndex / total) * 100;
  const scoreClass = (s) => s >= 7 ? 'score-good' : s >= 5 ? 'score-mid' : 'score-low';

  if (phase === PHASES.LOADING) return (
    <div className="container page">
      <div className="full-loader">
        <div className="spinner" />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Preparing your viva...</span>
        <p style={{ fontSize: '.9rem', textAlign: 'center', maxWidth: 300 }}>
          Gemini AI is crafting your personalised question set for <strong>{setupState?.subject}</strong>
        </p>
      </div>
    </div>
  );

  if (phase === PHASES.ERROR && !evaluation && !sessionPlan) return (
    <div className="container page" style={{ maxWidth: 600 }}>
      <div className="error-banner" style={{ flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} /><strong>Error generating session</strong>
        </div>
        <p>{error}</p>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/setup')}>← Back to Setup</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container page">
      <div className="viva-room">
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-violet">{setupState?.subject}</span>
            <span className="badge badge-cyan">{currentDifficulty}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', color: 'var(--text-secondary)' }}>
            Q {questionIndex + 1} / {total}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Error banner (recoverable) */}
        {error && phase !== PHASES.LOADING && (
          <div className="error-banner">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Speech not supported notice */}
        {!SPEECH_SUPPORTED && (
          <div className="info-banner">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>Speech recognition requires Chrome or Edge. You can type your answer below.</span>
          </div>
        )}

        {/* Question card */}
        <div className="question-card animate-in">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div className={`avatar-ring${isSpeaking ? ' speaking' : ''}`}
              style={{ width: 56, height: 56, fontSize: '1.5rem', flexShrink: 0 }}>🎓</div>
            <div style={{ flex: 1 }}>
              <div className="question-number">Question {questionIndex + 1} of {total}</div>
              <p className="question-text">{currentQuestion}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!vivaStarted ? (
              <button className="btn btn-primary btn-sm" onClick={handleStartViva}>
                <Volume2 size={14} /> Start Viva
              </button>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => speakQuestion(currentQuestion)} disabled={isSpeaking}>
                <Volume2 size={14} /> {isSpeaking ? 'Speaking...' : 'Listen again'}
              </button>
            )}
            {!TTS_SUPPORTED && <span className="chip" style={{ color: '#f87171' }}>TTS not available</span>}
          </div>
        </div>

        {/* Answer input — hidden during evaluation */}
        {phase !== PHASES.EVALUATED && (
          <div className="card animate-in">
            {/* Waveform + mic */}
            {SPEECH_SUPPORTED && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className={`waveform${phase !== PHASES.RECORDING ? ' idle' : ''}`}>
                  {[...Array(7)].map((_, i) => <div key={i} className="wave-bar" />)}
                </div>
                <button
                  id="mic-btn"
                  className={`mic-btn${phase === PHASES.RECORDING ? ' recording' : ''}`}
                  onClick={phase === PHASES.RECORDING ? stopRecording : startRecording}
                  disabled={phase === PHASES.SUBMITTING}
                  title={phase === PHASES.RECORDING ? 'Stop recording' : 'Start recording'}
                >
                  {phase === PHASES.RECORDING
                    ? <MicOff size={28} color="#ef4444" />
                    : <Mic size={28} color="#7c3aed" />}
                </button>
                <span style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>
                  {phase === PHASES.RECORDING ? '🔴 Recording — click to stop' : 'Click mic to record'}
                </span>
              </div>
            )}

            {/* Transcript / typed answer */}
            <div className="form-group">
              <label className="form-label" htmlFor="answer-box">
                Your answer {phase === PHASES.RECORDING ? '(live transcript)' : ''}
              </label>
              <textarea
                id="answer-box"
                className="form-textarea"
                rows={5}
                placeholder={SPEECH_SUPPORTED
                  ? 'Your spoken answer will appear here. You can also type or edit...'
                  : 'Type your answer here...'}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                maxLength={2000}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                <span>{transcript.length}/2000 chars</span>
                {transcript && (
                  <button style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem' }}
                    onClick={() => setTranscript('')}>Clear</button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button id="submit-btn" className="btn btn-primary"
                onClick={submitAnswer}
                disabled={phase === PHASES.SUBMITTING}>
                {phase === PHASES.SUBMITTING
                  ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Evaluating...</>
                  : <>Submit Answer <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* Evaluation panel */}
        {phase === PHASES.EVALUATED && evaluation && (
          <div className="eval-panel animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ marginBottom: '.25rem' }}>Evaluation Result</h3>
                <p style={{ fontSize: '.88rem' }}>Question {questionIndex + 1} of {total}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`big-score ${scoreClass(evaluation.score)}`}>
                  {evaluation.score}
                  <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-muted)' }}>/10</span>
                </div>
              </div>
            </div>

            {/* Rubric breakdown */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '.75rem', fontSize: '.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Rubric Breakdown
              </h4>
              <RubricBar label="Correctness"        score={evaluation.correctness} />
              <RubricBar label="Relevance"          score={evaluation.relevance} />
              <RubricBar label="Completeness"       score={evaluation.completeness} />
              <RubricBar label="Technical Accuracy" score={evaluation.technicalAccuracy} />
              <RubricBar label="Explanation"        score={evaluation.explanationQuality} />
            </div>

            <div className="divider" />

            {/* Feedback */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '.5rem' }}>Feedback</h4>
              <p style={{ fontSize: '.93rem' }}>{evaluation.feedback}</p>
            </div>

            {evaluation.strengths?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '.5rem', color: '#34d399', fontSize: '.9rem' }}>✓ Strengths</h4>
                <ul style={{ paddingLeft: '1.2rem' }}>
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '.9rem', marginBottom: '.25rem' }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.improvements?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '.5rem', color: '#fbbf24', fontSize: '.9rem' }}>↑ Improvements</h4>
                <ul style={{ paddingLeft: '1.2rem' }}>
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '.9rem', marginBottom: '.25rem' }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="divider" />

            {/* Ideal answer (collapsible) */}
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '.9rem', color: 'var(--text-accent)', fontWeight: 600 }}>
                View ideal answer
              </summary>
              <p style={{ marginTop: '.75rem', fontSize: '.9rem', background: 'rgba(0,0,0,.2)', borderRadius: 8, padding: '1rem', color: 'var(--text-secondary)' }}>
                {evaluation.idealAnswer}
              </p>
            </details>

            {/* Adaptive decision */}
            {evaluation.adaptiveDecision && !evaluation.isLastQuestion && (
              <div className="adaptive-banner">
                🧠 <strong>Adaptive:</strong>&nbsp;{evaluation.adaptiveDecision.reason}
                &nbsp;Next difficulty: <strong style={{ marginLeft: 4 }}>{evaluation.adaptiveDecision.to}</strong>
              </div>
            )}

            {/* Next */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button id="next-btn" className="btn btn-primary" onClick={goNextQuestion}>
                {evaluation.isLastQuestion
                  ? '📊 View Final Report'
                  : <>Next Question <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
