import { z } from 'zod';

const score10 = () => z.number().int().min(0).max(10);

export const EvaluationResponseSchema = z.object({
  score:              score10(),
  maxScore:           z.literal(10),
  correctness:        score10(),
  relevance:          score10(),
  completeness:       score10(),
  technicalAccuracy:  score10(),
  explanationQuality: score10(),
  feedback:           z.string().min(1),
  idealAnswer:        z.string().min(1),
  strengths:          z.array(z.string()),
  improvements:       z.array(z.string()),
  missingConcepts:    z.array(z.string()),
  nextDifficulty:     z.enum(['Easy','Medium','Hard']),
  followUpQuestion:   z.string(),
});

export const SessionPlanSchema = z.object({
  openingQuestion: z.string().min(1),
  conceptAreas:    z.array(z.string()).min(1),
});

export const FinalReportSchema = z.object({
  overallStrengths:      z.array(z.string()),
  weakConcepts:          z.array(z.string()),
  revisionTopics:        z.array(z.string()),
  nextSessionSuggestion: z.string(),
  improvementPlan:       z.string(),
});

export const GenerateBodySchema = z.object({
  subject:        z.string().min(1).max(100),
  topic:          z.string().max(200).default(''),
  difficulty:     z.enum(['Easy','Medium','Hard','Adaptive']),
  totalQuestions: z.union([z.literal(5), z.literal(10)]),
  language:       z.enum(['English','Hindi','Hinglish']),
});

export const EvaluateBodySchema = z.object({
  sessionPlan:     z.object({
    subject:        z.string(),
    topic:          z.string(),
    difficulty:     z.enum(['Easy','Medium','Hard','Adaptive']),
    language:       z.enum(['English','Hindi','Hinglish']),
    conceptAreas:   z.array(z.string()),
    totalQuestions: z.union([z.literal(5), z.literal(10)]),
  }),
  currentQuestion: z.string().min(1),
  currentDifficulty: z.enum(['Easy','Medium','Hard']),
  questionIndex:   z.number().int().min(0),
  transcript:      z.string().max(2000),
  history:         z.array(z.object({
    question: z.string(),
    score:    z.number(),
    summary:  z.string(),
  })).default([]),
  allQuestions:    z.array(z.string()).default([]),
});

export const ReportBodySchema = z.object({
  sessionPlan: z.object({
    subject: z.string(),
    topic:   z.string(),
  }),
  answers: z.array(z.object({
    question:    z.string(),
    transcript:  z.string(),
    score:       z.number(),
    feedback:    z.string(),
    missingConcepts: z.array(z.string()),
  })),
});

export const SaveSessionBodySchema = z.object({
  studentId:      z.string().uuid(),
  subject:        z.string().min(1),
  topic:          z.string().default(''),
  difficultyMode: z.enum(['Easy','Medium','Hard','Adaptive']),
  language:       z.enum(['English','Hindi','Hinglish']),
  totalQuestions: z.union([z.literal(5), z.literal(10)]),
  answers:        z.array(z.object({
    questionIndex:   z.number().int().min(0),
    question:        z.string(),
    difficultyAsked: z.enum(['Easy','Medium','Hard']),
    transcript:      z.string(),
    score:           z.number().int().min(0).max(10),
    rubric:          z.object({
      correctness:        z.number().int().min(0).max(10),
      relevance:          z.number().int().min(0).max(10),
      completeness:       z.number().int().min(0).max(10),
      technicalAccuracy:  z.number().int().min(0).max(10),
      explanationQuality: z.number().int().min(0).max(10),
    }),
    feedback:        z.string(),
    idealAnswer:     z.string(),
    strengths:       z.array(z.string()),
    improvements:    z.array(z.string()),
    missingConcepts: z.array(z.string()),
    adaptiveDecision: z.object({
      from:   z.string(),
      to:     z.string(),
      reason: z.string(),
    }),
  })),
  report: z.object({
    overallStrengths:      z.array(z.string()),
    weakConcepts:          z.array(z.string()),
    revisionTopics:        z.array(z.string()),
    nextSessionSuggestion: z.string(),
    improvementPlan:       z.string(),
  }),
  reportSource: z.enum(['gemini','fallback']),
});
