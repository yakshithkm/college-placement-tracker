# PlaceTrack API Documentation

Base URL: `http://localhost/api` (production) or `http://localhost:5000/api` (local dev)

All protected routes require:
```
Authorization: Bearer <accessToken>
```

---

## Authentication

### POST `/auth/register`
Register a new user.

**Request body:**
```json
{
  "email": "student@college.edu",
  "password": "SecurePass123",
  "firstName": "Optimus",
  "lastName": "Prime",
  "phone": "9876543210",
  "collegeId": "CS21001",
  "role": "student"
}
```
`role` must be `"student"` or `"coordinator"`. Admin accounts are created directly in DB.

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "student", "firstName": "...", "lastName": "..." },
    "accessToken": "eyJ...",
    "refreshToken": "uuid-uuid"
  }
}
```

---

### POST `/auth/login`
```json
{ "email": "student@college.edu", "password": "SecurePass123" }
```
Same response shape as register.

---

### POST `/auth/refresh`
Exchange a refresh token for new tokens.
```json
{ "refreshToken": "uuid-uuid" }
```
Response: `{ "data": { "accessToken": "...", "refreshToken": "..." } }`

---

### POST `/auth/logout`
```json
{ "refreshToken": "uuid-uuid" }
```

---

### GET `/auth/me` 🔒
Returns full user + student profile.

---

### POST `/auth/change-password` 🔒
```json
{ "currentPassword": "...", "newPassword": "..." }
```
Revokes all refresh tokens on success.

---

## Students

### GET `/students/me` 🔒
Returns own profile with project/cert/application counts.

### PUT `/students/me` 🔒
Update profile fields (all optional):
```json
{
  "firstName": "Optimus",
  "lastName": "Prime",
  "phone": "9876543210",
  "bio": "Full-stack developer...",
  "department": "CSE",
  "batchYear": 2021,
  "graduationYear": 2025,
  "cgpa": 8.75,
  "tenthPercentage": 92.5,
  "twelfthPercentage": 88.0,
  "linkedinUrl": "https://linkedin.com/in/...",
  "githubUrl": "https://github.com/...",
  "portfolioUrl": "https://mysite.com"
}
```

### GET `/students` 🔒 *(Coordinator/Admin)*
Query params: `department`, `batch`, `search`, `eligible`, `page`, `limit`

### GET `/students/me/skills` 🔒
### POST `/students/me/skills` 🔒
```json
{ "skillName": "React.js", "proficiencyLevel": 4, "category": "Frontend" }
```
### DELETE `/students/me/skills/:skillId` 🔒

### GET `/students/me/semesters` 🔒
### POST `/students/me/semesters` 🔒
```json
{ "semester": 5, "year": 2023, "sgpa": 8.9 }
```

---

## Resumes

### GET `/resumes` 🔒
### POST `/resumes` 🔒
Multipart form-data:
```
resume: <pdf file>
versionName: "SDE Resume v2"
```
### PUT `/resumes/:id/activate` 🔒  — Sets this version as active
### DELETE `/resumes/:id` 🔒

---

## Projects

### GET `/projects` 🔒
### POST `/projects` 🔒
```json
{
  "title": "PlaceTrack",
  "description": "Placement tracker platform...",
  "technologies": ["React", "Node.js", "PostgreSQL"],
  "githubUrl": "https://github.com/...",
  "liveUrl": "https://placetrack.app",
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "isFeatured": true
}
```
### PUT `/projects/:id` 🔒
### DELETE `/projects/:id` 🔒

---

## Certifications

### GET `/certifications` 🔒
### POST `/certifications` 🔒
```json
{
  "name": "AWS Solutions Architect",
  "provider": "Amazon Web Services",
  "issueDate": "2024-03-15",
  "expiryDate": "2027-03-15",
  "credentialId": "ABC-123",
  "verificationUrl": "https://aws.amazon.com/verify/..."
}
```
### PUT `/certifications/:id` 🔒
### DELETE `/certifications/:id` 🔒

---

## Aptitude Scores

### GET `/aptitude` 🔒
Response includes `data` (score records) and `stats` (averages).

### POST `/aptitude` 🔒
```json
{
  "testName": "TCS NQT Mock 3",
  "testDate": "2024-11-15",
  "quantitative": 82,
  "logical": 78,
  "verbal": 80,
  "maxScore": 300,
  "percentile": 88,
  "notes": "Improved from last attempt"
}
```
### DELETE `/aptitude/:id` 🔒

---

## Interview Scores

### GET `/interviews` 🔒
Response includes `data` (records) and `stats` (averages by category).

### POST `/interviews` 🔒
```json
{
  "interviewType": "mock",
  "interviewDate": "2024-11-20",
  "company": "Mock Round 3",
  "communicationRating": 8,
  "technicalRating": 7,
  "hrRating": 9,
  "problemSolvingRating": 7,
  "feedback": "Good communication. Improve system design."
}
```
`interviewType`: `"mock"` | `"technical"` | `"hr"` | `"real"`

### DELETE `/interviews/:id` 🔒

---

## Applications

### GET `/applications` 🔒
Query params: `status`

Statuses: `applied` | `test_cleared` | `interview_scheduled` | `selected` | `rejected`

Response includes `data` (records) and `stats` (count by status).

### POST `/applications` 🔒
```json
{
  "driveId": "uuid (optional)",
  "companyName": "TechCorp Solutions",
  "role": "Software Engineer",
  "appliedDate": "2024-10-01",
  "status": "applied",
  "notes": "Applied via campus portal"
}
```
### PUT `/applications/:id` 🔒
```json
{ "status": "interview_scheduled", "notes": "...", "packageOffered": 8.5 }
```
### DELETE `/applications/:id` 🔒

---

## Analytics

### GET `/analytics/dashboard` 🔒
Returns summary counts and scores for the student dashboard widget.

```json
{
  "readinessScore": 72.4,
  "resumeScore": 0,
  "aptitudeAvg": 83.2,
  "interviewScore": 7.25,
  "certCount": 2,
  "projectCount": 3,
  "applicationCount": 5,
  "selectedCount": 0
}
```

### GET `/analytics/me` 🔒
Full analytics with sub-scores, strengths, weak areas, recommendations, and trend history.

### POST `/analytics/refresh` 🔒
Triggers a fresh recalculation and stores a new snapshot. Returns the updated analytics.

### GET `/analytics/coordinator` 🔒 *(Coordinator/Admin)*
Platform-wide stats: total students, department breakdown, drive participation, etc.

---

## Companies

### GET `/companies` 🔒
Query params: `search`, `page`, `limit`

### POST `/companies` 🔒 *(Coordinator/Admin)*
```json
{
  "name": "TechCorp Solutions",
  "industry": "Information Technology",
  "website": "https://techcorp.com",
  "description": "Leading IT solutions provider",
  "hrContactName": "Jane Doe",
  "hrContactEmail": "hr@techcorp.com"
}
```
### PUT `/companies/:id` 🔒 *(Coordinator/Admin)*
### DELETE `/companies/:id` 🔒 *(Admin only)*

---

## Placement Drives

### GET `/drives` 🔒
Query params: `status` (`upcoming` | `active` | `completed` | `cancelled`), `page`, `limit`

### GET `/drives/:id` 🔒
### POST `/drives` 🔒 *(Coordinator/Admin)*
```json
{
  "companyId": "uuid",
  "title": "TechCorp Campus Drive 2025",
  "role": "Software Engineer",
  "packageLpa": 8.5,
  "description": "3-round process: Online → Technical → HR",
  "eligibilityCriteria": { "minCgpa": 6.5, "backlogs": 0 },
  "status": "upcoming",
  "registrationDeadline": "2025-03-01T23:59:00Z",
  "driveDate": "2025-03-15T09:00:00Z"
}
```
### PUT `/drives/:id` 🔒 *(Coordinator/Admin)*
### DELETE `/drives/:id` 🔒 *(Admin only)*
### GET `/drives/:id/applicants` 🔒 *(Coordinator/Admin)*

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Human-readable error description",
  "code": "ERROR_CODE"
}
```

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request body failed validation |
| `INVALID_CREDENTIALS` | Wrong email or password |
| `TOKEN_EXPIRED` | Access token expired — use `/auth/refresh` |
| `INVALID_REFRESH_TOKEN` | Refresh token invalid or expired |
| `EMAIL_EXISTS` | Email already registered |
| `DUPLICATE_ENTRY` | Record already exists (DB unique constraint) |
| `FOREIGN_KEY_VIOLATION` | Referenced record not found |

---

## Rate Limits

| Scope | Limit |
|---|---|
| Auth endpoints (`/auth/*`) | 20 requests / 15 min |
| All other API endpoints | 100 requests / 15 min |

Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
