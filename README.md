# PlaceTrack — College Placement Tracker

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)

A full-stack, production-ready platform for tracking student placement readiness. Built with React.js, Node.js + Express, PostgreSQL, and Docker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, TanStack Query, Chart.js |
| Backend | Node.js 20, Express 4, JWT Auth |
| Database | PostgreSQL 16 |
| DevOps | Docker, Docker Compose, Nginx |
| Auth | JWT (access + refresh tokens) |

---

## Project Structure

```
college-placement-tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # DB pool config
│   │   ├── controllers/    # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── studentController.js
│   │   │   ├── dataController.js       # Projects, Certs, Aptitude, Interviews, Applications
│   │   │   ├── resumeController.js
│   │   │   ├── analyticsController.js  # Score calculation engine
│   │   │   └── companyController.js    # Companies & Drives
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verify + role check
│   │   │   ├── errorHandler.js
│   │   │   └── validators.js   # express-validator rules
│   │   ├── routes/
│   │   │   └── index.js        # All API routes
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── logger.js       # Winston
│   │   └── server.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── services/
│   │   │   └── api.js              # Axios with auto token refresh
│   │   ├── styles/
│   │   │   └── global.css          # Design system
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── AppLayout.jsx   # Sidebar + top bar
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── ResumePage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── CertificationsPage.jsx
│   │   │   ├── AptitudePage.jsx
│   │   │   ├── InterviewPage.jsx
│   │   │   ├── ApplicationsPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── DrivesPage.jsx
│   │   │   ├── CoordinatorPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── seeds/
│   │   └── 001_seed_data.sql
│   └── init.sh
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quickstart

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

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Student | student@college.edu | Student@123 |
| Coordinator | coordinator@college.edu | Coord@123 |
| Admin | admin@college.edu | Admin@123 |

---

## API Reference

Base URL: `http://localhost/api`

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

### Projects / Certifications / Aptitude / Interviews / Applications
All follow standard CRUD: `GET /` `POST /` `PUT /:id` `DELETE /:id`

Endpoints:
- `/projects`
- `/certifications`
- `/aptitude`
- `/interviews`
- `/applications`

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/dashboard` | Dashboard stats |
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
| Academic (CGPA) | 25% | CGPA/10 × 100, minus backlog penalty |
| Projects | 20% | 25 points per project, capped at 100 |
| Certifications | 15% | 20 points per cert, capped at 100 |
| Aptitude Tests | 20% | Average score percentage across tests |
| Interview Readiness | 15% | Average overall rating × 10 |
| Skills | 5% | 10 points per skill, capped at 100 |

Scores are cached in `analytics_snapshots` and refreshed on demand.

---

## Features by Role

### Student
- Personal dashboard with readiness score
- Resume upload and version management
- Projects portfolio with tech stack
- Certifications with verification URLs
- Aptitude test score tracking with charts
- Interview performance logging with radar charts
- Placement application status tracking
- Full analytics with trends, strengths, and recommendations

### Placement Coordinator
- Student readiness overview
- Department-wise analytics
- Create and manage placement drives
- View drive applicants and statistics

### Admin
- All coordinator features
- Student management table
- Full platform administration

---

## Development Setup (without Docker)

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
psql -U postgres -d placement_tracker -f database/seeds/001_seed_data.sql
```

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- Dual JWT: short-lived access tokens (15m) + refresh tokens (7d)
- Rate limiting on all endpoints, stricter on auth
- Helmet.js security headers
- Input validation via express-validator
- CORS whitelist
- Role-based access control on all protected routes

---

## Production Checklist

- [ ] Generate strong JWT secrets (64+ chars)
- [ ] Set strong DB password
- [ ] Configure `ALLOWED_ORIGINS` for your domain
- [ ] Set `NODE_ENV=production`
- [ ] Mount a volume for `/app/uploads` backups
- [ ] Enable HTTPS via reverse proxy (Nginx/Traefik)
- [ ] Set up PostgreSQL backups
