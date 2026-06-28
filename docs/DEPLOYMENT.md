# Deployment Guide

## Quick-start (Docker, single server)

```bash
# 1. Clone
git clone <repo> placetrack && cd placetrack

# 2. Configure secrets
cp .env.example .env
cp backend/.env.example backend/.env

# Edit backend/.env — mandatory changes:
#   JWT_SECRET      → 64+ random chars
#   JWT_REFRESH_SECRET → 64+ random chars
#   DB_PASSWORD     → strong password (also update .env)

# 3. Build and start
docker compose up --build -d

# 4. Verify
curl http://localhost/health       # nginx → {"status":"ok"}
curl http://localhost/api/health   # express → {"status":"ok"}
```

Visit `http://localhost` in your browser.

---

## Environment Variables Reference

### `backend/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Set to `production` on server |
| `PORT` | No | `5000` | Internal port |
| `DB_HOST` | Yes | `postgres` | Docker service name or IP |
| `DB_PORT` | No | `5432` | |
| `DB_NAME` | Yes | `placement_tracker` | |
| `DB_USER` | Yes | `postgres` | |
| `DB_PASSWORD` | Yes | — | Strong password required |
| `JWT_SECRET` | Yes | — | Min 64 chars, random |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | Yes | — | Min 64 chars, different from JWT_SECRET |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `UPLOAD_DIR` | No | `/app/uploads` | Persist with a volume |
| `MAX_FILE_SIZE` | No | `10485760` | Bytes (default 10 MB) |
| `ALLOWED_ORIGINS` | Yes | `http://localhost` | Comma-separated for multiple domains |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | 15 min |
| `RATE_LIMIT_MAX` | No | `100` | Requests per window |

---

## Generating Strong Secrets

```bash
# Linux / macOS
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Adding HTTPS (Nginx reverse proxy)

If running behind a domain, add an Nginx proxy with Let's Encrypt. Example with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Then update `ALLOWED_ORIGINS=https://yourdomain.com` in `backend/.env`.

---

## Scaling

The backend is stateless (refresh tokens in PostgreSQL). You can run multiple backend replicas behind a load balancer:

```yaml
# docker-compose.yml addition
backend:
  deploy:
    replicas: 3
```

Make sure the `uploads` volume is on shared storage (NFS, S3-backed, etc.) if you scale replicas.

---

## Backups

```bash
# Dump the database
docker compose exec postgres pg_dump -U postgres placement_tracker > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U postgres placement_tracker < backup_20250101.sql
```

Set this up as a daily cron job.

---

## Useful Commands

```bash
# Check service health
make logs-api

# Open psql
make shell-db

# Regenerate analytics for all students (psql)
SELECT calculate_and_store_analytics();   -- requires custom function

# View student count
docker compose exec postgres psql -U postgres placement_tracker \
  -c "SELECT COUNT(*) FROM students;"

# Clear refresh tokens older than 30 days
docker compose exec postgres psql -U postgres placement_tracker \
  -c "DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '30 days';"
```
