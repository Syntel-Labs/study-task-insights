#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  05_shell.sh — Abre shell interactiva dentro de un contenedor
#
#  Uso:
#    ./scripts/05_shell.sh sti-apollo       # Node backend
#    ./scripts/05_shell.sh sti-atlas        # PostgreSQL
#    ./scripts/05_shell.sh sti-hermes       # Ollama
#    ./scripts/05_shell.sh sti-nike         # nginx + React
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

require_docker

CONTAINER="${1:-}"
[[ -z "$CONTAINER" ]] && die "Uso: ${0##*/} sti-apollo|sti-atlas|sti-hermes|sti-nike"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  die "El contenedor '${CONTAINER}' no esta corriendo."
fi

if docker exec "${CONTAINER}" bash -c "exit" 2>/dev/null; then
  SHELL_CMD="bash"
else
  SHELL_CMD="sh"
fi

echo -e "\n${BOLD}${BLUE}[sti] Shell (${SHELL_CMD}) en ${CONTAINER}...${RESET}"

case "$CONTAINER" in
  sti-atlas)  echo -e "${YELLOW}Tip: psql -U \$POSTGRES_USER -d \$POSTGRES_DB${RESET}\n" ;;
  sti-hermes) echo -e "${YELLOW}Tip: ollama list | ollama pull <modelo>${RESET}\n" ;;
  sti-apollo) echo -e "${YELLOW}Tip: pnpm exec prisma studio / pnpm test${RESET}\n" ;;
  *)          echo "" ;;
esac

docker exec -it "${CONTAINER}" "${SHELL_CMD}"
