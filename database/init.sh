#!/bin/bash
set -e

echo "Running database migrations..."
for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
  echo "Applying $f"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < "$f"
done

echo "Running seed data..."
for f in /docker-entrypoint-initdb.d/seeds/*.sql; do
  echo "Seeding $f"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < "$f"
done

echo "Database initialized successfully!"
