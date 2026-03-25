#!/usr/bin/env bash
# Launch Trosky (web app only).
# Requires: .env with DATABASE_URL and REDIS_URL pointing to a running Postgres + Redis.
# (Use Docker: docker compose up -d   OR   use Neon + Upstash and put their URLs in .env)

set -e
cd "$(dirname "$0")/.."

echo "Loading .env..."
if [ -f .env ]; then
  set -a
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set in .env"
  echo "  Option A: Install Docker, run: docker compose up -d"
  echo "  Option B: Use Neon (neon.tech) + Upstash (upstash.com), then set DATABASE_URL and REDIS_URL in .env"
  exit 1
fi

echo "Installing dependencies..."
pnpm install

echo "Generating Prisma client..."
pnpm --filter @hotel-pricing/db exec prisma generate

echo "Running database migrations..."
pnpm --filter @hotel-pricing/db exec prisma migrate dev --name init || {
  echo "Migration failed. Is Postgres running? (e.g. docker compose up -d or use Neon URL in .env)"
  exit 1
}

echo "Seeding demo data..."
pnpm db:seed

echo ""
echo "Starting web app at http://localhost:3000"
echo "Log in with: analyst@example.com / Password123!"
echo ""
pnpm --filter @hotel-pricing/web dev
