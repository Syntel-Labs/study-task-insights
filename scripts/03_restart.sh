#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  03_restart.sh — Reinicia el stack o un contenedor especifico
#
#  Uso:
#    ./scripts/03_restart.sh                       # reinicia todo (server + client)
#    ./scripts/03_restart.sh server                # reinicia solo backend
#    ./scripts/03_restart.sh client                # reinicia solo frontend
#    ./scripts/03_restart.sh sti-apollo            # reinicia un contenedor
#    ./scripts/03_restart.sh sti-atlas
#    ./scripts/03_restart.sh sti-hermes
#    ./scripts/03_restart.sh sti-nike
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

TARGET="${1:-all}"

require_docker
require_env_files

case "$TARGET" in
  --help|-h) grep '^#  ' "$0" | sed 's/^#  //'; exit 0 ;;
  all)
    echo -e "\n${BOLD}${BLUE}[sti] Reiniciando stack completo...${RESET}\n"
    dcc down --remove-orphans
    dcs down --remove-orphans
    dcs up -d --build --remove-orphans
    dcc up -d --build --remove-orphans
    ;;
  server)
    echo -e "\n${BOLD}${BLUE}[sti] Reiniciando backend...${RESET}\n"
    dcs down --remove-orphans
    dcs up -d --build --remove-orphans
    ;;
  client)
    echo -e "\n${BOLD}${BLUE}[sti] Reiniciando frontend...${RESET}\n"
    dcc down --remove-orphans
    dcc up -d --build --remove-orphans
    ;;
  sti-*)
    if ! docker ps --format '{{.Names}}' | grep -q "^${TARGET}$"; then
      die "El contenedor '${TARGET}' no esta corriendo."
    fi
    echo -e "\n${BOLD}${BLUE}[sti] Reiniciando contenedor ${TARGET}...${RESET}\n"
    docker restart "${TARGET}"
    ;;
  *)
    die "Argumento desconocido: $TARGET. Uso: [all|server|client|sti-<nombre>]"
    ;;
esac

echo ""
ok "Reinicio completado. Estado actual:"
echo ""
docker ps --filter "name=sti-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
