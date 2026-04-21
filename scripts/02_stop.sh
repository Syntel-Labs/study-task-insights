#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  02_stop.sh — Detiene el stack de STI
#
#  Uso:
#    ./scripts/02_stop.sh                 # detiene todo (datos intactos)
#    ./scripts/02_stop.sh --volumes       # detiene y borra volumenes (DB y modelo)
#    ./scripts/02_stop.sh server          # solo backend
#    ./scripts/02_stop.sh client          # solo frontend
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

TARGET="all"
WITH_VOLUMES=false

for arg in "$@"; do
  case "$arg" in
    --volumes|-v) WITH_VOLUMES=true ;;
    --help|-h)    grep '^#  ' "$0" | sed 's/^#  //'; exit 0 ;;
    server|client|all) TARGET="$arg" ;;
    *) die "Argumento desconocido: $arg" ;;
  esac
done

require_docker
require_env_files

DOWN_ARGS=(--remove-orphans)
$WITH_VOLUMES && DOWN_ARGS+=(-v)

if [[ "$TARGET" == "all" || "$TARGET" == "client" ]]; then
  echo -e "\n${BOLD}${BLUE}[sti] Deteniendo frontend...${RESET}\n"
  dcc down "${DOWN_ARGS[@]}"
fi

if [[ "$TARGET" == "all" || "$TARGET" == "server" ]]; then
  echo -e "\n${BOLD}${BLUE}[sti] Deteniendo backend...${RESET}\n"
  dcs down "${DOWN_ARGS[@]}"
fi

echo ""
if $WITH_VOLUMES; then
  ok "Stack detenido. Volumenes eliminados (DB y modelo LLM se perdieron)."
else
  ok "Stack detenido. Volumenes preservados."
fi
