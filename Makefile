.PHONY: help up down build logs shell-db shell-api migrate seed reset test clean

## ── Meta ──────────────────────────────────────────────────────────────────────
help:            ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

## ── Docker ────────────────────────────────────────────────────────────────────
up:              ## Start all services (production build)
	docker compose up --build -d

up-dev:          ## Start services with dev overrides (hot-reload API)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

down:            ## Stop all services
	docker compose down

logs:            ## Tail all service logs
	docker compose logs -f

logs-api:        ## Tail backend logs only
	docker compose logs -f backend

logs-db:         ## Tail postgres logs only
	docker compose logs -f postgres

build:           ## Rebuild images without cache
	docker compose build --no-cache

## ── Database ──────────────────────────────────────────────────────────────────
migrate:         ## Run SQL migrations
	docker compose exec backend node src/utils/migrate.js migrate

seed:            ## Run seed data
	docker compose exec backend node src/utils/migrate.js seed

seed-demo:       ## Generate 20 demo students
	docker compose exec backend node ../../scripts/generate-test-data.js 20

reset:           ## Drop and recreate the DB volume (⚠ DESTRUCTIVE)
	@read -p "This will delete all data. Continue? [y/N] " c; [ "$$c" = "y" ] || exit 0
	docker compose down -v
	docker compose up -d postgres
	sleep 5
	$(MAKE) migrate seed

shell-db:        ## Open psql shell in postgres container
	docker compose exec postgres psql -U postgres placement_tracker

shell-api:       ## Open sh in backend container
	docker compose exec backend sh

## ── Local dev (without Docker) ───────────────────────────────────────────────
dev-backend:     ## Run backend in dev mode (requires local Postgres)
	cd backend && npm run dev

dev-frontend:    ## Run frontend dev server
	cd frontend && npm start

install:         ## Install all dependencies
	cd backend && npm install
	cd frontend && npm install

## ── Testing ───────────────────────────────────────────────────────────────────
test:            ## Run backend tests
	cd backend && npm test

test-cov:        ## Run backend tests with coverage report
	cd backend && npm test -- --coverage

## ── Cleanup ───────────────────────────────────────────────────────────────────
clean:           ## Remove containers, images, and volumes
	docker compose down -v --rmi local
