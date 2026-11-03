import { generateJSON, generateContent } from '../lib/gemini.js';
import VivaSession from '../models/VivaSession.js';
import {
  GenerateBodySchema,
  EvaluateBodySchema,
  ReportBodySchema,
  SaveSessionBodySchema,
  EvaluationResponseSchema,
  SessionPlanSchema,
  FinalReportSchema,
} from '../lib/schemas.js';
import {
  computeOverallScore,
  chooseNextDifficulty,
  RECENT_HISTORY_COUNT,
} from '../config/adaptiveConfig.js';

function apiError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function studentId(req) {
  return req.headers['x-student-id'];
}

// ─── Generate session plan + first question ───────────────────────────────────
export async function generateSession(req, res) {
  const parsed = GenerateBodySchema.safeParse(req.body);
  if (!parsed.success) return apiError(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const { subject, topic, difficulty, totalQuestions, language } = parsed.data;
  const initialDifficulty = difficulty === 'Adaptive' ? 'Medium' : difficulty;

  const prompt = `You are an expert academic examiner conducting a viva (oral exam).

Subject: ${subject}${topic ? ` — Topic: ${topic}` : ''}
Difficulty: ${initialDifficulty}
Total questions to cover: ${totalQuestions}
Language: ${language} (if Hinglish, questions in English but accept Hindi/English answers)

Return a JSON with:
- "openingQuestion": The first viva question at ${initialDifficulty} difficulty. Make it specific, thought-provoking, and open-ended. Do NOT give trivial definitions.
- "conceptAreas": An array of ${totalQuestions} distinct concept areas or topics to cover across the viva (short labels, not full questions).

IMPORTANT: Make the opening question genuinely challenging and academically rigorous.`;

  try {
    const raw = await generateJSON(
      [{ role: 'user', parts: [{ text: prompt }] }],
      {
        type: 'object',
        properties: {
          openingQuestion: { type: 'string' },
          conceptAreas:   { type: 'array', items: { type: 'string' } },
        },
        required: ['openingQuestion', 'conceptAreas'],
      }
    );

    const validated = SessionPlanSchema.safeParse(raw);
    if (!validated.success) return apiError(res, 502, 'AI_INVALID_RESPONSE', 'AI returned invalid session plan.');

    return res.json({
      openingQuestion:   validated.data.openingQuestion,
      conceptAreas:      validated.data.conceptAreas,
      initialDifficulty,
    });
  } catch (err) {
    console.error('generateSession error:', err.message);
    return apiError(res, 502, 'AI_ERROR', 'Failed to generate session plan.');
  }
}

// ─── Evaluate answer + next adaptive question ─────────────────────────────────
export async function evaluateAnswer(req, res) {
  const parsed = EvaluateBodySchema.safeParse(req.body);
  if (!parsed.success) return apiError(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const {
    sessionPlan, currentQuestion, currentDifficulty, questionIndex, transcript,
    history, allQuestions,
  } = parsed.data;

  const { subject, topic, difficulty: difficultyMode, language, conceptAreas, totalQuestions } = sessionPlan;

  const isLastQuestion = questionIndex >= totalQuestions - 1;
  const recentHistory = history.slice(-RECENT_HISTORY_COUNT);
  const historyText = recentHistory.length
    ? recentHistory.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1} summary: ${h.summary} (score: ${h.score}/10)`).join('\n')
    : 'None yet';

  const previousQTexts = allQuestions.join('\n') || 'None';

  const evalPrompt = `You are a strict but fair academic examiner evaluating a viva answer.

Subject: ${subject}${topic ? ` — Topic: ${topic}` : ''}
Question asked: "${currentQuestion}"
Difficulty of this question: ${currentDifficulty}
Student answer: "${transcript || '[No answer given]'}"

Recent session history:
${historyText}

Score EACH rubric dimension 0–10 using these anchors:
0–2: Wrong/absent, 3–4: Weak/incomplete, 5–6: Partial, 7–8: Good, 9–10: Excellent.

CRITICAL RULES:
- If the answer is empty, "I don't know", or completely off-topic → all rubric scores ≤ 2.
- Never auto-award full marks. Be rigorous.
- missingConcepts: list key concepts the student clearly missed.

${!isLastQuestion ? `For "followUpQuestion": Write a NEW question on the SAME subject. The next difficulty will be determined by the server. Make it different from all previous questions:
${previousQTexts}

Do NOT repeat any question verbatim or near-verbatim.` : 'For "followUpQuestion": Return an empty string (this is the last question).'}

Return JSON with fields: score (0-10 int), maxScore (always 10), correctness (0-10 int), relevance (0-10 int), completeness (0-10 int), technicalAccuracy (0-10 int), explanationQuality (0-10 int), feedback (string), idealAnswer (string), strengths (array of strings), improvements (array of strings), missingConcepts (array of strings), nextDifficulty (Easy/Medium/Hard), followUpQuestion (string).`;

  try {
    const raw = await generateJSON(
      [{ role: 'user', parts: [{ text: evalPrompt }] }],
      {
        type: 'object',
        properties: {
          score:              { type: 'integer' },
          maxScore:           { type: 'integer' },
          correctness:        { type: 'integer' },
          relevance:          { type: 'integer' },
          completeness:       { type: 'integer' },
          technicalAccuracy:  { type: 'integer' },
          explanationQuality: { type: 'integer' },
          feedback:           { type: 'string' },
          idealAnswer:        { type: 'string' },
          strengths:          { type: 'array', items: { type: 'string' } },
          improvements:       { type: 'array', items: { type: 'string' } },
          missingConcepts:    { type: 'array', items: { type: 'string' } },
          nextDifficulty:     { type: 'string' },
          followUpQuestion:   { type: 'string' },
        },
        required: ['score','maxScore','correctness','relevance','completeness','technicalAccuracy','explanationQuality','feedback','idealAnswer','strengths','improvements','missingConcepts','nextDifficulty','followUpQuestion'],
      }
    );

    const validated = EvaluationResponseSchema.safeParse(raw);
    if (!validated.success) return apiError(res, 502, 'AI_INVALID_RESPONSE', `AI evaluation schema mismatch: ${validated.error.message}`);

    const ev = validated.data;

    // Server computes the authoritative overall score
    const serverScore = computeOverallScore(ev);

    // Server computes adaptive decision
    const adaptive = chooseNextDifficulty(currentDifficulty, serverScore, difficultyMode);

    // Duplicate question check
    const followUp = ev.followUpQuestion.trim();
    const isDuplicate = allQuestions.some(q =>
      q.trim().toLowerCase() === followUp.toLowerCase()
    );

    let finalFollowUp = followUp;
    if (isDuplicate && !isLastQuestion) {
      // Retry once with a regenerate hint
      try {
        const retryRaw = await generateJSON(
          [{ role: 'user', parts: [{ text: evalPrompt + '\n\nNOTE: The previous follow-up question was a duplicate. Generate a completely different question.' }] }],
          { type: 'object', properties: { followUpQuestion: { type: 'string' } }, required: ['followUpQuestion'] }
        );
        finalFollowUp = retryRaw.followUpQuestion?.trim() || followUp;
      } catch (_) { /* keep original */ }
    }

    return res.json({
      score:              serverScore,
      maxScore:           10,
      correctness:        ev.correctness,
      relevance:          ev.relevance,
      completeness:       ev.completeness,
      technicalAccuracy:  ev.technicalAccuracy,
      explanationQuality: ev.explanationQuality,
      feedback:           ev.feedback,
      idealAnswer:        ev.idealAnswer,
      strengths:          ev.strengths,
      improvements:       ev.improvements,
      missingConcepts:    ev.missingConcepts,
      adaptiveDecision: {
        from:   currentDifficulty,
        to:     adaptive.next,
        reason: adaptive.reason,
      },
      followUpQuestion: isLastQuestion ? null : finalFollowUp,
      isLastQuestion,
    });
  } catch (err) {
    console.error('evaluateAnswer error:', err.message);
    return apiError(res, 502, 'AI_ERROR', 'Failed to evaluate answer.');
  }
}

// ─── Generate final report ───────────────────────────────────────────────────
export async function generateReport(req, res) {
  const parsed = ReportBodySchema.safeParse(req.body);
  if (!parsed.success) return apiError(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const { sessionPlan, answers } = parsed.data;

  const summaryText = answers.map((a, i) =>
    `Q${i + 1}: ${a.question}\nAnswer: ${a.transcript}\nScore: ${a.score}/10\nFeedback: ${a.feedback}\nMissing: ${a.missingConcepts.join(', ') || 'none'}`
  ).join('\n\n');

  const prompt = `You are an expert academic advisor generating a personalised learning report.

Subject: ${sessionPlan.subject}${sessionPlan.topic ? ` — ${sessionPlan.topic}` : ''}

Viva summary:
${summaryText}

Generate a JSON report with:
- overallStrengths: array of strings (what the student did well)
- weakConcepts: array of concepts the student consistently struggled with
- revisionTopics: array of specific topics to revise (be actionable)
- nextSessionSuggestion: one sentence suggesting next focus area
- improvementPlan: 2–3 sentences on how to improve over the next week`;

  try {
    const raw = await generateJSON(
      [{ role: 'user', parts: [{ text: prompt }] }],
      {
        type: 'object',
        properties: {
          overallStrengths:      { type: 'array', items: { type: 'string' } },
          weakConcepts:          { type: 'array', items: { type: 'string' } },
          revisionTopics:        { type: 'array', items: { type: 'string' } },
          nextSessionSuggestion: { type: 'string' },
          improvementPlan:       { type: 'string' },
        },
        required: ['overallStrengths','weakConcepts','revisionTopics','nextSessionSuggestion','improvementPlan'],
      }
    );

    const validated = FinalReportSchema.safeParse(raw);
    if (!validated.success) {
      // Fallback report
      const avgScore = answers.reduce((s, a) => s + a.score, 0) / answers.length;
      const allMissing = [...new Set(answers.flatMap(a => a.missingConcepts))];
      return res.json({
        report: {
          overallStrengths: avgScore >= 7 ? ['Demonstrated good foundational knowledge'] : ['Attempted all questions'],
          weakConcepts: allMissing,
          revisionTopics: allMissing,
          nextSessionSuggestion: 'Focus on the weak concepts identified above.',
          improvementPlan: 'Review core concepts and practice explaining them aloud. Revisit the feedback for each question.',
        },
        reportSource: 'fallback',
      });
    }

    return res.json({ report: validated.data, reportSource: 'gemini' });
  } catch (err) {
    console.error('generateReport error:', err.message);
    const avgScore = answers.reduce((s, a) => s + a.score, 0) / answers.length;
    const allMissing = [...new Set(answers.flatMap(a => a.missingConcepts))];
    return res.json({
      report: {
        overallStrengths: avgScore >= 7 ? ['Demonstrated good foundational knowledge'] : ['Attempted all questions'],
        weakConcepts: allMissing,
        revisionTopics: allMissing,
        nextSessionSuggestion: 'Focus on the weak concepts identified above.',
        improvementPlan: 'Review core concepts and practice explaining them aloud.',
      },
      reportSource: 'fallback',
    });
  }
}

// ─── Save completed session ───────────────────────────────────────────────────
export async function saveSession(req, res) {
  const sid = studentId(req);
  if (!sid) return apiError(res, 400, 'MISSING_STUDENT_ID', 'X-Student-Id header required.');

  const parsed = SaveSessionBodySchema.safeParse(req.body);
  if (!parsed.success) return apiError(res, 400, 'VALIDATION_ERROR', parsed.error.message);

  const data = parsed.data;

  // Server recomputes totals — never trusts client
  const totalScore = data.answers.reduce((s, a) => s + a.score, 0);
  const maxScore   = data.answers.length * 10;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const average    = Math.round((totalScore / data.answers.length) * 10) / 10;

  const allMissing  = [...new Set(data.answers.flatMap(a => a.missingConcepts))];
  const allStrengths = [...new Set(data.answers.filter(a => a.score >= 7).map(a => a.question.slice(0, 60)))];

  try {
    const session = await VivaSession.create({
      studentId:      sid,
      subject:        data.subject,
      topic:          data.topic,
      difficultyMode: data.difficultyMode,
      language:       data.language,
      totalQuestions: data.totalQuestions,
      answers:        data.answers,
      totals: { score: totalScore, max: maxScore, percentage, average },
      weakConcepts:   allMissing,
      strongConcepts: allStrengths,
      report:         data.report,
      reportSource:   data.reportSource,
    });
    return res.status(201).json({ _id: session._id, message: 'Session saved.' });
  } catch (err) {
    console.error('saveSession error:', err.message);
    return apiError(res, 500, 'DB_ERROR', 'Failed to save session.');
  }
}

// ─── List sessions for this student ─────────────────────────────────────────
export async function listSessions(req, res) {
  const sid = studentId(req);
  if (!sid) return apiError(res, 400, 'MISSING_STUDENT_ID', 'X-Student-Id header required.');

  try {
    const sessions = await VivaSession.find({ studentId: sid })
      .sort({ createdAt: -1 })
      .select('subject topic difficultyMode language totalQuestions totals weakConcepts reportSource createdAt')
      .lean();

    // Dashboard stats
    const totalAttempts    = sessions.length;
    const avgScore         = totalAttempts ? Math.round(sessions.reduce((s, x) => s + (x.totals?.percentage || 0), 0) / totalAttempts) : 0;
    const bestScore        = totalAttempts ? Math.max(...sessions.map(x => x.totals?.percentage || 0)) : 0;
    const totalQuestions   = sessions.reduce((s, x) => s + (x.totalQuestions || 0), 0);

    const subjectMap = {};
    for (const s of sessions) {
      if (!subjectMap[s.subject]) subjectMap[s.subject] = { total: 0, count: 0 };
      subjectMap[s.subject].total += s.totals?.percentage || 0;
      subjectMap[s.subject].count += 1;
    }
    const subjectWise = Object.entries(subjectMap).map(([subject, v]) => ({
      subject,
      avgPercentage: Math.round(v.total / v.count),
    }));

    return res.json({
      sessions,
      stats: { totalAttempts, avgScore, bestScore, totalQuestions, subjectWise },
    });
  } catch (err) {
    console.error('listSessions error:', err.message);
    return apiError(res, 500, 'DB_ERROR', 'Failed to fetch sessions.');
  }
}

// ─── Get one session (ownership check) ──────────────────────────────────────
export async function getSession(req, res) {
  const sid = studentId(req);
  if (!sid) return apiError(res, 400, 'MISSING_STUDENT_ID', 'X-Student-Id header required.');

  try {
    const session = await VivaSession.findById(req.params.id).lean();
    if (!session) return apiError(res, 404, 'NOT_FOUND', 'Session not found.');
    if (session.studentId !== sid) return apiError(res, 403, 'FORBIDDEN', 'Access denied.');
    return res.json(session);
  } catch (err) {
    console.error('getSession error:', err.message);
    return apiError(res, 500, 'DB_ERROR', 'Failed to fetch session.');
  }
}
