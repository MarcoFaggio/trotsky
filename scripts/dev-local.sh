#!/usr/bin/env bash
# Trosky — comfortable local dev on macOS (external drives, file watcher limits).
# Usage:
#   ./scripts/dev-local.sh           # Docker infra + Next.js only (default)
#   ./scripts/dev-local.sh --full    # Docker infra + web + worker (needs Redis)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "$(uname -s)" == "Darwin" ]]; then
  ulimit -n 10240 2>/dev/null || true
fi

if ! command -v docker &>/dev/null; then
  echo "Docker not found. Install Docker Desktop or run Postgres/Redis yourself." >&2
  exit 1
fi

echo "Starting Postgres + Redis (docker compose)..."
docker compose up -d

if [[ "${1:-}" == "--full" ]]; then
  echo "Starting full stack (web + worker). Press Ctrl+C to stop."
  export NEXT_DEV_POLLING="${NEXT_DEV_POLLING:-1}"
  exec pnpm exec turbo dev
else
  echo "Starting Next.js only (no worker). Use --full for BullMQ worker. Press Ctrl+C to stop."
  export NEXT_DEV_POLLING="${NEXT_DEV_POLLING:-1}"
  exec pnpm exec turbo dev --filter=@hotel-pricing/web
fi
