#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  04_logs.sh — Sigue logs de un contenedor del stack
#
#  Uso:
#    ./scripts/04_logs.sh sti-apollo              # API backend
#    ./scripts/04_logs.sh sti-atlas               # PostgreSQL
#    ./scripts/04_logs.sh sti-hermes              # Ollama
#    ./scripts/04_logs.sh sti-prometheus          # Descarga de modelo
#    ./scripts/04_logs.sh sti-nike                # Frontend (nginx)
#    ./scripts/04_logs.sh sti-apollo 500          # ultimas 500 lineas
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

require_docker

CONTAINER="${1:-}"
TAIL="${2:-200}"

[[ -z "$CONTAINER" ]] && die "Debes indicar el contenedor. Uso: ${0##*/} sti-<nombre> [tail]"

if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  die "El contenedor '${CONTAINER}' no existe. Uso: sti-apollo|sti-atlas|sti-hermes|sti-prometheus|sti-nike"
fi

echo -e "\n${BOLD}${BLUE}[sti] Logs de ${CONTAINER} (ultimas ${TAIL} lineas)...${RESET}\n"
docker logs -f --tail="${TAIL}" "${CONTAINER}"
