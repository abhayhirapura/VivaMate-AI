import mongoose from 'mongoose';

const rubricSchema = new mongoose.Schema({
  correctness:        { type: Number, min: 0, max: 10 },
  relevance:          { type: Number, min: 0, max: 10 },
  completeness:       { type: Number, min: 0, max: 10 },
  technicalAccuracy:  { type: Number, min: 0, max: 10 },
  explanationQuality: { type: Number, min: 0, max: 10 },
}, { _id: false });

const answerSchema = new mongoose.Schema({
  questionIndex:    { type: Number, required: true },
  question:         { type: String, required: true },
  difficultyAsked:  { type: String, enum: ['Easy','Medium','Hard'], required: true },
  transcript:       { type: String, default: '' },
  score:            { type: Number, min: 0, max: 10 },
  rubric:           { type: rubricSchema },
  feedback:         { type: String },
  idealAnswer:      { type: String },
  strengths:        [{ type: String }],
  improvements:     [{ type: String }],
  missingConcepts:  [{ type: String }],
  adaptiveDecision: {
    from:   String,
    to:     String,
    reason: String,
  },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  overallStrengths:      [{ type: String }],
  weakConcepts:          [{ type: String }],
  revisionTopics:        [{ type: String }],
  nextSessionSuggestion: { type: String },
  improvementPlan:       { type: String },
}, { _id: false });

const vivaSessionSchema = new mongoose.Schema({
  studentId:      { type: String, required: true, index: true },
  subject:        { type: String, required: true },
  topic:          { type: String, default: '' },
  difficultyMode: { type: String, enum: ['Easy','Medium','Hard','Adaptive'], required: true },
  language:       { type: String, enum: ['English','Hindi','Hinglish'], required: true },
  totalQuestions: { type: Number, enum: [5, 10], required: true },
  answers:        [answerSchema],
  totals: {
    score:      Number,
    max:        Number,
    percentage: Number,
    average:    Number,
  },
  weakConcepts:   [{ type: String }],
  strongConcepts: [{ type: String }],
  report:         { type: reportSchema },
  reportSource:   { type: String, enum: ['gemini','fallback'], default: 'gemini' },
}, { timestamps: true });

export default mongoose.model('VivaSession', vivaSessionSchema);
