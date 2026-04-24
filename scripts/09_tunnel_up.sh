#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  09_tunnel_up.sh — Levanta el Cloudflare Tunnel en primer plano
#
#  Usa ~/.cloudflared/${TUNNEL_NAME}.yml (per-proyecto) para no colisionar
#  con otros tuneles en la misma maquina. Ctrl+C para detener.
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

for arg in "$@"; do
  case "$arg" in
    --help) grep '^# ' "$0" | sed 's/^# //'; exit 0 ;;
    *)      die "Argumento desconocido: $arg" ;;
  esac
done

command -v cloudflared >/dev/null 2>&1 || die "cloudflared no instalado. Ejecuta: ./scripts/08_tunnel_init.sh"

CONFIG_FILE="$(tunnel_config_file)"
# Guarda: nunca ejecutar con ~/.cloudflared/config.yml (archivo compartido).
assert_cf_config_safe "${CONFIG_FILE}"

uuid="$(get_tunnel_uuid)"
[[ -n "${uuid}" ]] || die "Tunel ${TUNNEL_NAME} no existe. Ejecuta: ./scripts/08_tunnel_init.sh (o make tunnel-init)"
[[ -f "${CONFIG_FILE}" ]] || die "No existe ${CONFIG_FILE}. Ejecuta: ./scripts/08_tunnel_init.sh (o make tunnel-init)"

echo -e "\n${BOLD}${BLUE}[tunnel] Levantando ${TUNNEL_NAME}${RESET}\n"
info "UUID:   ${uuid}"
info "Config: ${CONFIG_FILE}"
info "Hostnames publicos:"
while read -r hostname; do
  info "  https://${hostname}"
done < <(tunnel_hostnames)
info "Ctrl+C para detener."
echo ""

exec cloudflared tunnel --config "${CONFIG_FILE}" run "${TUNNEL_NAME}"
