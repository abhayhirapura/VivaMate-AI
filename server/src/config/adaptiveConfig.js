// Adaptive difficulty rules — the single source of truth
export const ADAPTIVE_RULES = {
  harder: { minScore: 8, label: 'harder' },
  same:   { minScore: 5, label: 'same' },
  easier: { maxScore: 4, label: 'easier' },
};

export const RUBRIC_WEIGHTS = {
  correctness:        0.30,
  relevance:          0.15,
  completeness:       0.20,
  technicalAccuracy:  0.20,
  explanationQuality: 0.15,
};

export const MAX_QUESTIONS = { 5: 5, 10: 10 };
export const MAX_ANSWER_LENGTH = 2000;
export const RECENT_HISTORY_COUNT = 3;
export const AI_TIMEOUT_MS = 30_000;
export const AI_RETRIES = 1;

export function computeOverallScore(rubric) {
  const { correctness, relevance, completeness, technicalAccuracy, explanationQuality } = rubric;
  const raw =
    correctness        * RUBRIC_WEIGHTS.correctness +
    relevance          * RUBRIC_WEIGHTS.relevance +
    completeness       * RUBRIC_WEIGHTS.completeness +
    technicalAccuracy  * RUBRIC_WEIGHTS.technicalAccuracy +
    explanationQuality * RUBRIC_WEIGHTS.explanationQuality;
  return Math.round(raw);
}

export function chooseNextDifficulty(currentDifficulty, score, difficultyMode) {
  if (difficultyMode !== 'Adaptive') return { next: currentDifficulty, reason: 'Fixed difficulty mode — not adapting.' };
  if (score >= ADAPTIVE_RULES.harder.minScore) return { next: 'Hard',   reason: `Score ${score}/10 ≥ ${ADAPTIVE_RULES.harder.minScore} — escalating difficulty.` };
  if (score >= ADAPTIVE_RULES.same.minScore)   return { next: currentDifficulty === 'Easy' ? 'Medium' : currentDifficulty, reason: `Score ${score}/10 in ${ADAPTIVE_RULES.same.minScore}–${ADAPTIVE_RULES.harder.minScore - 1} — same difficulty, targeting gaps.` };
  return { next: 'Easy', reason: `Score ${score}/10 ≤ ${ADAPTIVE_RULES.easier.maxScore} — stepping back to consolidate.` };
}
