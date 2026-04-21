#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  07_status.sh — Estado del stack y chequeos basicos
#
#  Uso:
#    ./scripts/07_status.sh
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

require_docker

echo -e "\n${BOLD}${BLUE}[sti] Contenedores del stack:${RESET}\n"
docker ps -a --filter "name=sti-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${BOLD}${BLUE}[sti] Chequeos de salud:${RESET}\n"

check() {
  local label="$1"
  local url="$2"
  if curl -sSf --max-time 3 "${url}" >/dev/null 2>&1; then
    ok "${label}: ${url}"
  else
    warn "${label}: ${url} (no responde)"
  fi
}

APP_PORT="$(grep -E '^APP_PORT=' "${SERVER_ENV}" 2>/dev/null | cut -d= -f2 || echo 3000)"
APP_PORT="${APP_PORT:-3000}"

check "API  /healthz" "http://localhost:${APP_PORT}/healthz"
check "SPA  /"        "http://localhost:8080/"

echo ""
