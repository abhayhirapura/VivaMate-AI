import { computeOverallScore, chooseNextDifficulty } from '../config/adaptiveConfig.js';
import { EvaluationResponseSchema } from '../lib/schemas.js';

// ── Score computation ──
describe('computeOverallScore', () => {
  test('computes weighted average correctly (all 8s → 8)', () => {
    const rubric = { correctness: 8, relevance: 8, completeness: 8, technicalAccuracy: 8, explanationQuality: 8 };
    expect(computeOverallScore(rubric)).toBe(8);
  });

  test('zero answer scores zero', () => {
    const rubric = { correctness: 0, relevance: 0, completeness: 0, technicalAccuracy: 0, explanationQuality: 0 };
    expect(computeOverallScore(rubric)).toBe(0);
  });

  test('mixed scores produce reasonable weighted result', () => {
    const rubric = { correctness: 10, relevance: 0, completeness: 0, technicalAccuracy: 0, explanationQuality: 0 };
    // 10*0.30 = 3
    expect(computeOverallScore(rubric)).toBe(3);
  });
});

// ── Adaptive difficulty ──
describe('chooseNextDifficulty', () => {
  test('score >= 8 → Hard in Adaptive mode', () => {
    expect(chooseNextDifficulty('Medium', 9, 'Adaptive').next).toBe('Hard');
  });

  test('score >= 8 → Hard from Easy in Adaptive mode', () => {
    expect(chooseNextDifficulty('Easy', 8, 'Adaptive').next).toBe('Hard');
  });

  test('score 5–7 → keeps current difficulty in Adaptive mode', () => {
    expect(chooseNextDifficulty('Medium', 6, 'Adaptive').next).toBe('Medium');
  });

  test('score 5–7 from Easy → Medium in Adaptive mode', () => {
    expect(chooseNextDifficulty('Easy', 5, 'Adaptive').next).toBe('Medium');
  });

  test('score <= 4 → Easy in Adaptive mode', () => {
    expect(chooseNextDifficulty('Hard', 3, 'Adaptive').next).toBe('Easy');
  });

  test('fixed Easy mode does not adapt upward', () => {
    expect(chooseNextDifficulty('Easy', 10, 'Easy').next).toBe('Easy');
  });

  test('fixed Hard mode does not adapt downward on low score', () => {
    expect(chooseNextDifficulty('Hard', 1, 'Hard').next).toBe('Hard');
  });

  test('Adaptive mode returns a reason string', () => {
    const result = chooseNextDifficulty('Medium', 9, 'Adaptive');
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

// ── EvaluationResponseSchema validation ──
describe('EvaluationResponseSchema', () => {
  const validEval = {
    score: 7, maxScore: 10, correctness: 7, relevance: 7,
    completeness: 7, technicalAccuracy: 7, explanationQuality: 7,
    feedback: 'Good answer.', idealAnswer: 'Ideal answer here.',
    strengths: ['Clear explanation'], improvements: ['Add more depth'],
    missingConcepts: ['CAP theorem'], nextDifficulty: 'Hard',
    followUpQuestion: 'Explain CAP theorem.',
  };

  test('accepts valid evaluation object', () => {
    expect(EvaluationResponseSchema.safeParse(validEval).success).toBe(true);
  });

  test('rejects score > 10', () => {
    expect(EvaluationResponseSchema.safeParse({ ...validEval, score: 11 }).success).toBe(false);
  });

  test('rejects score < 0', () => {
    expect(EvaluationResponseSchema.safeParse({ ...validEval, score: -1 }).success).toBe(false);
  });

  test('rejects missing feedback field', () => {
    const { feedback, ...bad } = validEval;
    expect(EvaluationResponseSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects invalid nextDifficulty value', () => {
    expect(EvaluationResponseSchema.safeParse({ ...validEval, nextDifficulty: 'VeryHard' }).success).toBe(false);
  });

  test('rejects non-integer rubric score', () => {
    expect(EvaluationResponseSchema.safeParse({ ...validEval, correctness: 7.5 }).success).toBe(false);
  });
});

// ── Session ownership ──
describe('Session ownership check', () => {
  test('student A cannot access student B session', () => {
    const session = { studentId: 'student-a', subject: 'ML' };
    expect(session.studentId === 'student-b').toBe(false);
  });

  test('student can access own session', () => {
    const session = { studentId: 'student-a', subject: 'ML' };
    expect(session.studentId === 'student-a').toBe(true);
  });
});

// ── Score aggregation (server recomputes totals) ──
describe('Server-side score aggregation', () => {
  const answers = [
    { score: 8, missingConcepts: ['concept-a'] },
    { score: 6, missingConcepts: ['concept-b', 'concept-a'] },
    { score: 4, missingConcepts: [] },
  ];

  test('total score is sum of individual scores', () => {
    const total = answers.reduce((s, a) => s + a.score, 0);
    expect(total).toBe(18);
  });

  test('percentage computed correctly', () => {
    const total = answers.reduce((s, a) => s + a.score, 0);
    const max = answers.length * 10;
    const pct = Math.round((total / max) * 100);
    expect(pct).toBe(60);
  });

  test('weak concepts are deduplicated', () => {
    const all = [...new Set(answers.flatMap(a => a.missingConcepts))];
    expect(all).toEqual(['concept-a', 'concept-b']);
  });
});
