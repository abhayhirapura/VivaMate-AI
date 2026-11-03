# VivaMate AI — 3-Minute Demo Script

## Pre-Demo Setup (2 minutes before)

```bash
# Terminal 1
cd server && npm run dev
# Wait for: ✅ MongoDB connected + 🚀 server running on port 5001

# Terminal 2
cd client && npm run dev
# Wait for: Local: http://localhost:5173
```

- Open **http://localhost:5173** in **Chrome** (required for voice)
- Open **MongoDB Atlas** in another tab → Browse Collections → `vivasessions`
- Ensure microphone permission is granted in Chrome

---

## Demo Flow (~3 minutes)

### 0:00 — Landing Page
- Show the hero: tagline, feature cards, how-it-works steps
- Point out: *"No login, no email — just start practicing"*
- Show the footer: *"Demo mode — UUID stored in browser, not real auth"*

### 0:20 — Setup Screen
- Click **Start Viva** (top-right or hero CTA)
- Select:
  - Subject: **Data Science**
  - Topic: *(leave blank)*
  - Difficulty: **Adaptive** ← highlight this
  - Questions: **5**
  - Language: **English**
- Click **Begin Viva**

### 0:40 — Live Viva Room Loads
- Loading state: *"Gemini AI is crafting your personalised question set"*
- Question appears — examiner avatar with animated ring
- Click **Start Viva** button → browser speaks the question aloud (TTS)

### 1:00 — Answer Q1 (Deliberate weak answer)
- Click mic → give a vague answer: *"Data science is about analysing data"*
- Stop recording → transcript appears
- Click **Submit Answer**
- Evaluation loads in ~3 seconds
- **Show:** Low score (3–4/10), rubric bars all low, feedback highlighting gaps
- **Show adaptive banner:** *"Score 3 ≤ 4 — stepping back to consolidate. Next: Easy difficulty"*
- Click **Next Question** → easier question spoken aloud

### 1:45 — Answer Q2 (Strong answer)
- Give a comprehensive, detailed answer with specific concepts
- **Show:** High score (8–9/10), rubric bars mostly green
- **Show adaptive banner:** *"Score 9 ≥ 8 — escalating difficulty. Next: Hard difficulty"*
- Click **Next Question**

### 2:15 — Skip to Finish
- Answer remaining 3 questions (typed is fine for speed)
- After Q5 → click **View Final Report**

### 2:25 — Final Result Page
- Show: overall score, avg, total points
- Show: Skill Radar chart (pentagon of 5 rubric dimensions)
- Show: Score per Question line chart
- Show: Personalised Learning Report (strengths, weak concepts, revision topics)
- **Show:** Green "Session saved to database" banner with `_id`

### 2:45 — MongoDB Atlas
- Switch to Atlas tab → Refresh → Show the new document in `vivasessions`
- Highlight: `answers[]` array, `totals` object, `report` embedded, `reportSource: "gemini"`

### 2:55 — Dashboard & History
- Click **Dashboard** → stats: attempts, avg score, best score, questions done
- Click **History** → session listed with date, subject, score
- Click the session → full review: radar, trend, learning report, answer breakdown

---

## Fallback Plans

| Failure | Fallback |
|---|---|
| **Wi-Fi down** | Show a pre-recorded screen recording of a full viva session |
| **Mic not working** | Text input box is always visible below the mic — type the answer |
| **Gemini quota exceeded** | Show the clear `RATE_LIMITED` error banner; explain free-tier limits |
| **MongoDB unreachable** | Hit `/api/health` to show `"db":"disconnected"`; explain Atlas IP whitelist |
| **Firefox / Safari** | Switch to Chrome; typed answers always work regardless |
| **API key invalid** | Show the `AI_ERROR` banner — no mock data, real error message |

---

## Key Talking Points

1. **No mocks** — every Gemini call is real; failures show real error messages
2. **Server computes scores** — client cannot manipulate rubric weights or totals
3. **Ownership checks** — Student A cannot read Student B's session (can demo with `curl -H "X-Student-Id: wrong-uuid"`)
4. **Adaptive rules are transparent** — all in `server/src/config/adaptiveConfig.js`, one file
5. **Zod validation** — all AI output is re-validated on the server before being used

---

## Quick API Demo (curl)

```bash
# Health check
curl http://localhost:5001/api/health

# Generate a session (replace with real studentId)
curl -X POST http://localhost:5001/api/viva/generate \
  -H "Content-Type: application/json" \
  -H "X-Student-Id: $(uuidgen)" \
  -d '{"subject":"Machine Learning","topic":"","difficulty":"Adaptive","totalQuestions":5,"language":"English"}'

# Ownership check — should return 403
curl http://localhost:5001/api/viva/sessions/SOME_ID \
  -H "X-Student-Id: 00000000-0000-0000-0000-000000000000"
```
