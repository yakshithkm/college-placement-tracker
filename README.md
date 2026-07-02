---

## Quickstart (Docker)

### Prerequisites
- Docker Desktop (or Docker + Docker Compose)
- Git

### 1. Clone and configure

```bash
git clone <repo-url> college-placement-tracker
cd college-placement-tracker

# Copy env files
cp .env.example .env
cp backend/.env.example backend/.env
```

### 2. Edit secrets in `backend/.env`

```env
JWT_SECRET=<at-least-64-char-random-string>
JWT_REFRESH_SECRET=<another-64-char-random-string>
DB_PASSWORD=<strong-db-password>
```

### 3. Build and launch

```bash
docker compose up --build
```

The platform will be available at **http://localhost**

---

## Quickstart (Local dev, no Docker)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # configure DB_HOST=localhost
npm run dev            # starts on :5000
```

### Frontend
```bash
cd frontend
npm install
npm start              # starts on :3000
```

### Database
```bash
psql -U postgres -c "CREATE DATABASE placement_tracker;"
psql -U postgres -d placement_tracker -f database/migrations/001_initial_schema.sql
psql -U postgres -d placement_tracker -f database/migrations/002_aptitude_module.sql
psql -U postgres -d placement_tracker -f database/seeds/001_seed_data.sql
```

On Windows PowerShell, if you hit a `WIN1252` encoding error on the aptitude migration (it contains emoji), set the client encoding first:
```powershell
$env:PGCLIENTENCODING = "UTF8"
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Student | student@college.edu | Student@123 |
| Coordinator | coordinator@college.edu | Coord@123 |
| Admin | admin@college.edu | Admin@123 |

---

## Aptitude Test Module

A full exam-style aptitude testing system sits alongside the base platform: categories, a question bank, admin-built timed/practice tests, a full exam UI (question navigator, flag-for-review, auto-submit), detailed results with per-question explanations, and student analytics (trend charts, category strength).

📄 Full documentation: **[docs/APTITUDE_TEST_MODULE.md](docs/APTITUDE_TEST_MODULE.md)**

Quick links once running:
- `/aptitude-tests` — student: browse & take tests
- `/aptitude-tests/admin/tests` and `/aptitude-tests/admin/questions` — admin/coordinator: manage content

This is separate from the legacy manual score log at `/aptitude`, which still works unchanged. Both feed into the same Aptitude Score bucket in the readiness formula (see below).

---

## API Reference

Base URL: `http://localhost/api` (Docker) or `http://localhost:5000/api` (local dev)

Full endpoint reference: **[docs/API.md](docs/API.md)**

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user |
| POST | `/auth/change-password` | Change password |

### Students
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/students/me` | Student | Get own profile |
| PUT | `/students/me` | Student | Update profile |
| GET | `/students` | Coord/Admin | List all students |
| GET/POST | `/students/me/skills` | Student | Manage skills |
| GET/POST | `/students/me/semesters` | Student | Manage semesters |

### Resumes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/resumes` | List resumes |
| POST | `/resumes` | Upload PDF resume |
| PUT | `/resumes/:id/activate` | Set active resume |
| DELETE | `/resumes/:id` | Delete resume |

### Projects / Certifications / Manual Aptitude Log / Interviews / Applications
All follow standard CRUD: `GET /` `POST /` `PUT /:id` `DELETE /:id`

Endpoints:
- `/projects`
- `/certifications`
- `/aptitude` — legacy manual score log
- `/interviews`
- `/applications`

### Aptitude Test Module
Base: `/api/aptitude-test`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/categories` | any | List categories |
| POST/PUT/DELETE | `/categories` | admin/coordinator | Manage categories |
| GET | `/questions` | admin/coordinator | List question bank |
| POST/PUT/DELETE | `/questions` | admin/coordinator | Manage questions |
| POST | `/questions/bulk-import` | admin/coordinator | Bulk import via JSON |
| GET | `/tests` | any | List tests |
| POST/PUT/DELETE | `/tests` | admin/coordinator | Manage tests |
| POST | `/attempt/start` | student | Start or resume an attempt |
| PUT | `/attempt/:id/answer` | student | Save an answer mid-attempt |
| POST | `/attempt/:id/submit` | student | Submit and auto-grade |
| GET | `/attempt/:id/result` | any | Full result + explanations |
| GET | `/my-attempts` | student | Attempt history + trend data |
| GET | `/admin/stats` | admin/coordinator | Platform-wide test stats |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/dashboard` | Dashboard stats (includes quiz attempt counts) |
| GET | `/analytics/me` | Full analytics with trends |
| POST | `/analytics/refresh` | Recalculate scores |
| GET | `/analytics/coordinator` | Coordinator overview |

### Companies & Drives
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/companies` | All |
| POST/PUT/DELETE | `/companies` | Coord/Admin |
| GET | `/drives` | All |
| POST/PUT/DELETE | `/drives` | Coord/Admin |
| GET | `/drives/:id/applicants` | Coord/Admin |

---

## Readiness Score Formula

The **Placement Readiness Score** (0–100) is computed as a weighted average:

| Component | Weight | Scoring |
|---|---|---|
| Resume | 30% | Active resume's ATS score |
| Aptitude | 30% | Blended average across manual score log **and** Aptitude Test Module attempts |
| Projects | 15% | 25 points per project, capped at 100 |
| Certifications | 10% | 20 points per certification, capped at 100 |
| Interview Readiness | 15% | Average overall rating × 10 |

Scores are cached in `analytics_snapshots` and recalculate automatically whenever a student submits an aptitude test attempt, or on demand via the "Refresh Score" button on the Analytics page.

---

## Features by Role

### Student
- Personal dashboard with readiness score
- Resume upload and version management
- Projects portfolio with tech stack
- Certifications with verification URLs
- **Aptitude Test Module** — timed/practice exam-style tests, question navigator, flag-for-review, auto-submit, detailed results with explanations, trend/category analytics
- Legacy manual aptitude score log (still available)
- Interview performance logging with radar charts
- Placement application status tracking
- Full analytics with trends, strengths, and recommendations

### Placement Coordinator
- Student readiness overview
- Department-wise analytics
- Create and manage placement drives
- **Aptitude Test Module admin** — manage question bank, build tests, view attempt stats
- View drive applicants and statistics

### Admin
- All coordinator features
- Student management table
- Full platform administration

---

## Deployment

For a step-by-step guide to deploying on free hosting (Neon + Render + Vercel), see:

📄 **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

Quick summary:
1. **Database** — Neon (free serverless Postgres)
2. **Backend** — Render (free Node web service)
3. **Frontend** — Vercel (free static hosting)

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- Dual JWT: short-lived access tokens (15m) + refresh tokens (7d)
- Rate limiting on all endpoints, stricter on auth
- Helmet.js security headers
- Input validation via express-validator
- CORS whitelist
- Role-based access control on all protected routes
- Aptitude Test Module: server-side duplicate-submission prevention, attempts scoped to authenticated student only

---

## Production Checklist

- [ ] Generate strong JWT secrets (64+ chars)
- [ ] Set strong DB password
- [ ] Configure `ALLOWED_ORIGINS` for your domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable SSL on the database connection (`DB_SSL=true`) if using a hosted Postgres provider
- [ ] Mount a volume (or use object storage) for `/app/uploads` — local disk storage does not persist on most free hosting tiers
- [ ] Enable HTTPS via reverse proxy (Nginx/Traefik) or hosting provider's built-in HTTPS
- [ ] Set up PostgreSQL backups