# Aptitude Test Module — Documentation

This document covers the **Aptitude Test Module** extension added on top of the existing PlaceTrack platform. It does not duplicate the platform's base README — see `README.md` and `docs/API.md` for the original system.

---

## What was added

A complete exam-style aptitude testing system, fully separate from the pre-existing "manual aptitude score" feature (which remains at `/aptitude` and `aptitudeAPI` — untouched).

| Layer | New files |
|---|---|
| Database | `database/migrations/002_aptitude_module.sql` |
| Backend | `backend/src/controllers/aptitudeTestController.js`, `backend/src/routes/aptitude.js` |
| Backend (modified) | `backend/src/routes/index.js` (mounts new router), `backend/src/controllers/analyticsController.js` (updated readiness formula) |
| Frontend | `frontend/src/pages/quiz/*.jsx` (6 pages), `frontend/src/services/api.js` (added `aptitudeTestAPI`) |
| Frontend (modified) | `frontend/src/App.jsx` (new routes), `frontend/src/components/common/AppLayout.jsx` (new nav links), `frontend/src/pages/DashboardPage.jsx` (new stat card + quick action) |

**Nothing existing was rewritten.** All legacy routes, controllers, and pages continue to work exactly as before.

---

## Why a separate namespace?

The original project already had a simple "log my aptitude score manually" feature at `GET/POST /api/aptitude`. To avoid any collision, the new quiz engine is mounted under a distinct prefix:

```
/api/aptitude-test/*     ← new quiz module (this document)
/api/aptitude/*          ← existing manual score log (unchanged)
```

Same pattern on the frontend: `/aptitude-tests/*` (new) vs `/aptitude` (existing, relabeled "Manual Score Log" in the sidebar for clarity).

---

## Database schema

8 new tables, fully normalized with foreign keys:

```
aptitude_categories          — Quantitative, Logical, Verbal, Programming, General
aptitude_questions           — question bank (options A-D, correct answer, explanation, difficulty, marks)
aptitude_tests                — admin-configured tests (timer, duration, passing marks, randomization flags)
aptitude_test_questions      — join table: which questions belong to which test, with order
aptitude_attempts            — one row per student test attempt (status, score, timing)
aptitude_attempt_answers     — one row per question per attempt (selected answer, correctness, marks awarded)
```

Seed data included: 5 categories, 23 questions, and 5 ready-to-use tests (including a 10-question mixed "Full Mock Aptitude Test").

To apply the migration:

```bash
cd backend
node src/utils/migrate.js migrate   # picks up 002_aptitude_module.sql automatically (sorted by filename)
```

---

## REST API reference

All routes are prefixed `/api/aptitude-test`. 🔒 = requires JWT. Role column shows who can call it beyond the base auth requirement.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/categories` | any 🔒 | List categories with question/test counts |
| POST | `/categories` | admin, coordinator | Create category |
| PUT | `/categories/:id` | admin, coordinator | Update category |
| DELETE | `/categories/:id` | admin | Delete category |
| GET | `/questions` | admin, coordinator | List questions (filters: categoryId, difficulty, search, page, limit) |
| POST | `/questions` | admin, coordinator | Create question |
| PUT | `/questions/:id` | admin, coordinator | Update question |
| DELETE | `/questions/:id` | admin, coordinator | Delete question |
| POST | `/questions/bulk-import` | admin, coordinator | Import question array as JSON |
| GET | `/tests` | any 🔒 | List tests (filters: categoryId, active) |
| GET | `/tests/:id` | any 🔒 | Get single test |
| POST | `/tests` | admin, coordinator | Create test + attach question IDs |
| PUT | `/tests/:id` | admin, coordinator | Update test metadata |
| DELETE | `/tests/:id` | admin | Delete test |
| POST | `/attempt/start` | student | Start (or resume) an attempt — body: `{ testId, mode }` |
| PUT | `/attempt/:attemptId/answer` | student | Save one answer mid-attempt — body: `{ questionId, selectedAnswer, isFlagged }` |
| POST | `/attempt/:attemptId/submit` | student | Submit, auto-grade, update readiness score |
| GET | `/attempt/:attemptId/result` | any 🔒 | Full result + per-question breakdown |
| GET | `/my-attempts` | student | Attempt history + stats + trend (for analytics page) |
| GET | `/admin/stats` | admin, coordinator | Platform-wide test stats |

### Example — starting and submitting an attempt

```bash
# Start
POST /api/aptitude-test/attempt/start
{ "testId": "e1000000-0000-0000-0000-000000000001", "mode": "timed" }
→ { data: { attemptId, questions: [...], durationMinutes: 15 } }

# Save an answer (called automatically by the UI on every click)
PUT /api/aptitude-test/attempt/{attemptId}/answer
{ "questionId": "...", "selectedAnswer": "B", "isFlagged": false }

# Submit
POST /api/aptitude-test/attempt/{attemptId}/submit
{ "timeTakenSeconds": 412 }
→ { data: { score, totalMarks, correct, wrong, skipped, percentage, passed } }
```

### Bulk import format

```json
[
  {
    "categoryId": "d1000000-0000-0000-0000-000000000001",
    "questionText": "What is 15% of 200?",
    "optionA": "20", "optionB": "30", "optionC": "25", "optionD": "35",
    "correctAnswer": "B",
    "explanation": "15% × 200 = 30",
    "difficulty": "easy",
    "marks": 1,
    "negativeMarks": 0
  }
]
```

---

## Timer & practice mode behavior

- **Timed mode**: server returns `durationMinutes` on attempt start. Frontend runs a client-side countdown (`QuizTakingPage.jsx`) and **auto-submits** when it reaches zero, regardless of answered/unanswered state.
- **Practice mode**: no timer shown; student can take as long as they like. Admins control eligibility per-test via `allowPracticeMode` / `timerEnabled` flags — if both are true, the student picks on the test list page (`AptitudeTestListPage.jsx` shows both "Start Timed" and "Practice Mode" buttons).
- **Resuming**: if a student refreshes or navigates away mid-attempt, calling `/attempt/start` again with the same `testId` returns the **existing in-progress attempt** instead of creating a duplicate (enforced server-side, preventing multiple submissions).
- **Anti-refresh**: `beforeunload` listener warns before leaving an active attempt.

---

## Placement Readiness Score integration

The formula in `analyticsController.js` was updated to match the spec exactly:

```
Resume Score              30%
Aptitude Score            30%   ← blends legacy manual scores AND new quiz attempts
Projects                  15%
Certifications            10%
Interview Readiness       15%
```

The **Aptitude Score** bucket is a weighted blend of both data sources:

```js
aptitudeScore = (manualAvg × manualCount + quizAvg × quizCount) / (manualCount + quizCount)
```

This means a student who has never logged a manual score, but has taken 3 quiz tests, gets their aptitude score purely from quiz performance — and vice versa. Whenever `POST /attempt/:attemptId/submit` succeeds, it internally calls `calculateReadinessScore(studentId)`, so the **dashboard reflects the new score immediately** on next load — no separate refresh step needed (though the existing manual "Refresh Score" button on the Analytics page still works too).

`GET /api/analytics/dashboard` (existing endpoint, extended) now also returns:

```json
{
  "quizAttemptCount": 4,
  "quizAvgScore": 78.5,
  "quizBestScore": 92.0
}
```

---

## Frontend pages

| Route | Page | Audience |
|---|---|---|
| `/aptitude-tests` | Browse categories & tests, filter chips, "Start Timed" / "Practice Mode" buttons | student |
| `/aptitude-tests/take/:testId?mode=timed\|practice` | Full exam interface — question navigator, flag-for-review, progress bar, countdown, auto-submit | student |
| `/aptitude-tests/result/:attemptId` | Score summary, category breakdown, full answer review with explanations | student, coordinator, admin |
| `/aptitude-tests/history` | Attempt history table, trend line chart, category bar chart (Chart.js) | student |
| `/aptitude-tests/admin/questions` | Question bank CRUD, search/filter, bulk JSON import | admin, coordinator |
| `/aptitude-tests/admin/tests` | Test builder — pick questions, configure timer/marks/randomization, activate/deactivate | admin, coordinator |

Sidebar navigation (`AppLayout.jsx`) was extended with:
- Student: **"Aptitude Test Module"** link added above the existing "Manual Score Log" (renamed from "Aptitude Tests" for clarity)
- Coordinator / Admin: new **"Aptitude Test Module"** section with "Manage Tests" and "Question Bank" links

---

## Security

- All `/aptitude-test/*` routes require a valid JWT (`authenticate` middleware), reusing the platform's existing auth system — no new auth logic was introduced.
- Admin-only mutations (`createQuestion`, `createTest`, `deleteCategory`, `deleteTest`, etc.) are protected by `authorize('admin', 'coordinator')` or `authorize('admin')`, matching the existing RBAC pattern used elsewhere in the codebase.
- Students can only start/submit/view their **own** attempts — every attempt query is scoped by `student_id` derived from the authenticated JWT, never from a client-supplied ID.
- Duplicate submission is prevented at the database level: `submitAttempt` only operates on attempts with `status = 'in_progress'`; a second submit call on the same attempt returns 404.
- All inputs go through the same `express-validator`-free but parameterized-query pattern already used in the codebase (no raw string interpolation into SQL).

---

## Docker

No Docker changes were required. The new tables are picked up automatically by the existing `database/init.sh` script, which loops over every `*.sql` file in `database/migrations/` in filename order — `002_aptitude_module.sql` runs right after `001_initial_schema.sql` on a fresh `docker compose up`.

For an **already-running** stack, apply the migration manually:

```bash
docker compose exec backend node src/utils/migrate.js migrate
```

---

## Manual verification performed

Since this sandbox has no outbound access to install a local PostgreSQL instance, verification was done via:

1. **Backend**: every new/modified file was `require()`'d directly in Node — this catches syntax errors, broken imports, and route-mounting issues. All passed cleanly.
2. **Frontend**: full production build via `react-scripts build` (`CI=true`, i.e. warnings-as-errors mode) — **compiled successfully with zero warnings**, validating all JSX, hooks, and imports across all 6 new pages plus the 3 modified files.
3. **SQL migration**: custom tokenizer verified every string literal in the seed data opens and closes correctly (catches the most common migration bug — malformed `''` escaping).

Before first real run, apply the migration and smoke-test the flow: register/login as a student → `/aptitude-tests` → start a test → answer a few questions → submit → check `/aptitude-tests/result/:id` and confirm the dashboard's readiness score updated.
