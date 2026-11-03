# VivaMate AI 🎓

> **Practice Smarter. Speak Confidently. Perform Better.**

VivaMate AI is an adaptive, voice-first oral exam (viva) examiner powered by Google Gemini. It listens to spoken answers, scores them on a 5-dimension rubric, adapts the next question based on your performance, and generates a personalised learning report at the end of every session.

---

## Problem

College students have no realistic way to practise oral exams (vivas). Text chatbots lack voice interaction, no tool adapts difficulty per answer, and none produce a personalised rubric-scored revision report.

## Solution

VivaMate AI conducts a real viva:
1. **Speaks** each question aloud (browser TTS)
2. **Listens** to the spoken answer (browser Web Speech API)
3. **Scores** it on 5 rubric dimensions using Gemini AI with structured JSON output
4. **Adapts** the next question — harder, same, or easier — based on score
5. **Generates** a personalised revision report at the end
6. **Persists** every session to MongoDB Atlas for history and analytics

---

## Features

- 🎙️ **Voice-first** — Mic recording + TTS playback; graceful typed fallback
- 🧠 **Adaptive questions** — Score ≥8 → harder, 5–7 → same, ≤4 → easier
- 📊 **5-dimension rubric** — Correctness, Relevance, Completeness, Technical Accuracy, Explanation Quality
- 📋 **Personalised report** — Strengths, weak concepts, revision topics, improvement plan
- 📈 **Analytics** — Score trends, subject-wise performance, skill radar charts
- 🌐 **Multi-language** — English, Hindi, Hinglish (hi-IN speech recognition)
- 🔒 **No login required** — Anonymous UUID-based identity (demo only)
- 🗄️ **Persistent sessions** — Saved to MongoDB Atlas; full history + review

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Recharts, Lucide React |
| Styling | Vanilla CSS with design tokens — no Tailwind, no UI framework |
| Backend | Node.js + Express, Helmet, CORS, express-rate-limit |
| AI | Google Gemini via `@google/genai` SDK (structured JSON output + Zod re-validation) |
| Database | MongoDB Atlas + Mongoose |
| Voice | Browser Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## Architecture

```mermaid
graph TD
    A[Browser — React + Vite :5173] -->|REST + X-Student-Id| B[Express Server :5001]
    B -->|@google/genai SDK| C[Google Gemini API]
    B -->|Mongoose| D[(MongoDB Atlas)]
    A -->|SpeechRecognition| E[Browser Mic]
    A -->|SpeechSynthesis| F[Browser TTS]
    B --> G[adaptiveConfig.js]
    G -->|Rubric weights + difficulty rules| B
    B -->|Zod schemas| H[AI output validated on server]
```

---

## Project Structure

```
vocal labs/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/             # 8 pages (Landing, Dashboard, VivaSetup,
│   │   │                      #   VivaRoom, FinalResult, Analytics,
│   │   │                      #   SessionHistory, SessionReview)
│   │   ├── utils/
│   │   │   ├── api.js         # Axios client with X-Student-Id header
│   │   │   ├── speech.js      # Web Speech API wrapper
│   │   │   └── studentId.js   # UUID generation + localStorage
│   │   ├── App.jsx            # Router + Navbar + Footer
│   │   ├── index.css          # Complete design system (CSS variables)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── adaptiveConfig.js   # Adaptive rules, rubric weights
│   │   ├── controllers/
│   │   │   └── vivaController.js   # All route handlers
│   │   ├── lib/
│   │   │   ├── gemini.js           # Gemini SDK wrapper (timeout, retry)
│   │   │   └── schemas.js          # Zod schemas for all inputs + AI output
│   │   ├── models/
│   │   │   └── VivaSession.js      # Mongoose schema
│   │   ├── routes/
│   │   │   └── vivaRoutes.js       # Express router + AI rate limiter
│   │   ├── tests/
│   │   │   └── unit.test.js        # Jest unit tests
│   │   └── index.js               # App entry, DB connect
│   ├── .env.example
│   └── package.json
├── screenshots/               # (capture manually — see screenshots/README.md)
├── .gitignore
├── package.json               # Root convenience scripts
├── README.md
└── DEMO.md
```

---

## Install & Run

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (with IP whitelisted in Network Access)
- Google AI Studio API key

### 1. Install dependencies

```bash
# From the project root:
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit server/.env with your real values:
#   GEMINI_API_KEY=...
#   GEMINI_MODEL=gemini-2.0-flash
#   MONGODB_URI=mongodb+srv://...
```

### 3. Run

```bash
# Terminal 1 — server (port 5001)
cd server && npm run dev

# Terminal 2 — client (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173** in Chrome or Edge.

### 4. Verify health

```bash
curl http://localhost:5001/api/health
# Expected: {"status":"ok","db":"connected","model":"gemini-2.0-flash",...}
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `GEMINI_MODEL` | ✅ | Model name, e.g. `gemini-2.0-flash` |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `PORT` | No | Server port (default: 5001) |
| `CLIENT_ORIGIN` | No | CORS origin (default: `http://localhost:5173`) |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | API base URL (leave blank — Vite proxy handles it in dev) |

> **Security:** `GEMINI_API_KEY` is server-side only. It is never bundled into the client. The `client/` code has no direct Gemini access.

---

## API Reference

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check + DB connection status |
| POST | `/api/viva/generate` | Create session plan + first question |
| POST | `/api/viva/evaluate` | Score answer + return next adaptive question |
| POST | `/api/viva/report` | Generate final learning report |
| POST | `/api/viva/sessions` | Persist completed session (returns 201 + `_id`) |
| GET | `/api/viva/sessions` | List student's sessions + dashboard stats |
| GET | `/api/viva/sessions/:id` | Get one session (ownership-checked) |

**All error responses:** `{ error: { code: string, message: string } }`  
**AI routes:** 20 requests/minute/IP rate limit.  
**Answer max length:** 2000 characters.

---

## Running Tests

```bash
cd server && npm test
```

Tests cover: score aggregation, adaptive difficulty rules, Zod schema validation (reject malformed AI output), session ownership checks, and server-side total recomputation.

---

## Limitations

- **Speech recognition:** Chrome and Edge only (Firefox not supported). Requires HTTPS or localhost.
- **Hindi TTS:** `hi-IN` voice may not be installed on all devices — English fallback is used automatically.
- **Gemini rate limits:** Free tier has RPM limits; high concurrent use may hit 429 errors.
- **Demo auth:** UUID in localStorage is not real authentication. Anyone with the UUID can query that student's sessions.
- **Mic permission:** Must be granted by the user; permission-denied is handled with a typed fallback.
- **No PDF export:** Planned for future.

---

## Future Scope

- PDF export of session reports
- Weak-topic focused practice mode
- Personalised question recommendations from past sessions
- Real authentication (Firebase Auth / OAuth)
- Full Hindi-language questions
- Mobile app (React Native)

---

## Resume Description

> Built VivaMate AI, a voice-first adaptive oral exam simulator powered by Google Gemini. The system conducts structured viva sessions with real-time speech recognition, evaluates answers on a 5-dimension rubric using structured JSON output from Gemini with server-side Zod re-validation, adapts question difficulty per answer, and generates personalised revision reports — all persisted in MongoDB Atlas. Full-stack: React + Vite frontend, Node.js + Express backend with rate limiting, helmet security headers, and comprehensive unit tests.
