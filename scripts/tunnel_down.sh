#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  tunnel_down.sh — Limpieza completa del Cloudflare Tunnel del proyecto
#
#  Acciones (todas sobre ${TUNNEL_NAME}, nunca sobre config.yml global):
#   1. Detiene el proceso cloudflared del tunel
#   2. Borra el tunel en Cloudflare (cloudflared tunnel delete)
#   3. Borra config per-proyecto ~/.cloudflared/${TUNNEL_NAME}.yml
#   4. Borra backups .bak asociados
#   5. Borra credenciales <UUID>.json
#
#  NUNCA toca cert.pem (compartido entre tuneles de la misma cuenta CF).
#
#  Uso:
#    ./scripts/tunnel_down.sh          # pide confirmacion
#    ./scripts/tunnel_down.sh --yes    # sin confirmacion
#    ./scripts/tunnel_down.sh --help
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

AUTO_YES=0
for arg in "$@"; do
  case "$arg" in
    --help) grep '^# ' "$0" | sed 's/^# //'; exit 0 ;;
    --yes|-y) AUTO_YES=1 ;;
    *) die "Argumento desconocido: $arg" ;;
  esac
done

command -v cloudflared >/dev/null 2>&1 || die "cloudflared no instalado."

CONFIG_FILE="$(tunnel_config_file)"
assert_cf_config_safe "${CONFIG_FILE}"

uuid="$(get_tunnel_uuid)"

echo -e "\n${BOLD}${YELLOW}[tunnel-down] Limpieza del tunel ${TUNNEL_NAME}${RESET}"
info "Tunel UUID: ${uuid:-no existe}"
info "Config:     ${CONFIG_FILE}"
info "NO se borrara cert.pem (es compartido por cuenta Cloudflare)."
echo ""

if [[ "${AUTO_YES}" -ne 1 ]]; then
  read -r -p "Confirmar limpieza (escribe 'si' para continuar): " reply
  [[ "${reply}" == "si" ]] || die "Cancelado."
fi

stop_cloudflared_process() {
  if pgrep -f "cloudflared.*${TUNNEL_NAME}" >/dev/null 2>&1; then
    info "Deteniendo proceso cloudflared para ${TUNNEL_NAME}..."
    pkill -f "cloudflared.*${TUNNEL_NAME}" || true
    sleep 1
    ok "Proceso detenido."
  else
    info "No hay proceso cloudflared corriendo para ${TUNNEL_NAME}."
  fi
}

delete_tunnel_cloud() {
  if [[ -z "${uuid}" ]]; then
    info "Tunel no existe en Cloudflare, nada que borrar."
    return
  fi
  info "Borrando tunel en Cloudflare..."
  if cloudflared tunnel delete -f "${TUNNEL_NAME}" >&2; then
    ok "Tunel borrado en Cloudflare."
  else
    warn "Fallo al borrar el tunel. Revisa manualmente: cloudflared tunnel list"
  fi
}

delete_local_config() {
  if [[ -f "${CONFIG_FILE}" ]]; then
    rm -f "${CONFIG_FILE}"
    ok "Borrado ${CONFIG_FILE}"
  fi
  local bak_pattern="${CONFIG_FILE}.*.bak"
  local found=0
  for bak in ${bak_pattern}; do
    [[ -f "${bak}" ]] || continue
    rm -f "${bak}"
    found=1
  done
  if (( found == 1 )); then
    ok "Backups .bak eliminados."
  fi
}

delete_credentials() {
  if [[ -z "${uuid}" ]]; then
    return
  fi
  local cred="${CLOUDFLARED_CONFIG_DIR}/${uuid}.json"
  if [[ -f "${cred}" ]]; then
    rm -f "${cred}"
    ok "Credenciales borradas: ${cred}"
  fi
}

remind_dns() {
  echo ""
  warn "Los CNAME en Cloudflare siguen existiendo como records huerfanos."
  warn "Eliminalos manualmente: Dashboard CF -> DNS -> borrar CNAME de:"
  while read -r hostname; do
    warn "  - ${hostname}"
  done < <(tunnel_hostnames)
}

main() {
  stop_cloudflared_process
  delete_tunnel_cloud
  delete_local_config
  delete_credentials
  remind_dns
  echo ""
  ok "Limpieza completa. Para recrear: make tunnel-init"
}

main "$@"
