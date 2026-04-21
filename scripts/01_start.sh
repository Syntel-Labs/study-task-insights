#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  01_start.sh — Levanta el stack completo de STI (server + client)
#
#  Uso:
#    ./scripts/01_start.sh                # levanta todo
#    ./scripts/01_start.sh server         # solo backend
#    ./scripts/01_start.sh client         # solo frontend
#    ./scripts/01_start.sh --help
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

TARGET="${1:-all}"

case "$TARGET" in
  --help|-h)
    grep '^#  ' "$0" | sed 's/^#  //'
    exit 0
    ;;
  all|server|client) ;;
  *) die "Argumento desconocido: $TARGET. Uso: [server|client|all]" ;;
esac

require_docker
require_env_files

if [[ "$TARGET" == "all" || "$TARGET" == "server" ]]; then
  echo -e "\n${BOLD}${BLUE}[sti] Levantando backend (atlas, hermes, prometheus, apollo)...${RESET}\n"
  dcs up -d --build --remove-orphans
fi

if [[ "$TARGET" == "all" || "$TARGET" == "client" ]]; then
  echo -e "\n${BOLD}${BLUE}[sti] Levantando frontend (nike)...${RESET}\n"
  dcc up -d --build --remove-orphans
fi

echo ""
ok "Stack levantado. Estado actual:"
echo ""
docker ps --filter "name=sti-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
