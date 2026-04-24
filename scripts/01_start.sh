#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  01_start.sh — Levanta el stack completo de STI (server + client)
#
#  Uso:
#    ./scripts/01_start.sh                # backend en CPU + cliente
#    ./scripts/01_start.sh --gpu          # backend en GPU (perfil nvidia) + cliente
#    ./scripts/01_start.sh server         # solo backend (CPU)
#    ./scripts/01_start.sh server --gpu   # solo backend en GPU
#    ./scripts/01_start.sh client         # solo frontend
#    ./scripts/01_start.sh --help
#
#  Nota: los perfiles 'cpu' y 'gpu' levantan variantes distintas del servicio
#  Ollama (sti-hermes vs sti-hermes-gpu). Comparten volumen, asi que los modelos
#  descargados persisten al cambiar. No invoques inferencia en los dos a la vez.
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

TARGET="all"
USE_GPU=false

for arg in "$@"; do
  case "$arg" in
    --help|-h) grep '^#  ' "$0" | sed 's/^#  //'; exit 0 ;;
    --gpu)     USE_GPU=true ;;
    all|server|client) TARGET="$arg" ;;
    *) die "Argumento desconocido: $arg. Uso: [server|client|all] [--gpu]" ;;
  esac
done

require_docker
require_env_files

PROFILE="cpu"
[[ "$USE_GPU" == true ]] && PROFILE="gpu"

if [[ "$TARGET" == "all" || "$TARGET" == "server" ]]; then
  echo -e "\n${BOLD}${BLUE}[sti] Levantando backend (perfil: ${PROFILE})...${RESET}\n"
  # Limpieza defensiva: baja la variante contraria si estuviera corriendo.
  dcs_profile cpu down --remove-orphans 2>/dev/null || true
  dcs_profile gpu down --remove-orphans 2>/dev/null || true
  dcs_profile "${PROFILE}" up -d --build --remove-orphans
fi

if [[ "$TARGET" == "all" || "$TARGET" == "client" ]]; then
  echo -e "\n${BOLD}${BLUE}[sti] Levantando frontend (nike)...${RESET}\n"
  dcc up -d --build --remove-orphans
fi

echo ""
ok "Stack levantado. Estado actual:"
echo ""
docker ps --filter "name=sti-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
