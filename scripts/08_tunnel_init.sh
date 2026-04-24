#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  08_tunnel_init.sh — Bootstrap del Cloudflare Tunnel (una sola vez)
#
#  1. Instala cloudflared si no existe
#  2. Autentica la CLI con tu cuenta Cloudflare (abre navegador)
#  3. Crea el tunel ${TUNNEL_NAME} (idempotente)
#  4. Enruta los hostnames API_HOSTNAME y WEB_HOSTNAME
#  5. Escribe ~/.cloudflared/config-${TUNNEL_NAME}.yml (no toca otros tuneles)
#
#  Uso:
#    ./scripts/08_tunnel_init.sh
#    ./scripts/08_tunnel_init.sh --help
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

for arg in "$@"; do
  case "$arg" in
    --help) grep '^# ' "$0" | sed 's/^# //'; exit 0 ;;
    *)      die "Argumento desconocido: $arg" ;;
  esac
done

CLOUDFLARED_BIN="/usr/local/bin/cloudflared"
CONFIG_FILE="$(tunnel_config_file)"
CERT_FILE="${CLOUDFLARED_CONFIG_DIR}/cert.pem"

# Guard global: aborta si el path resuelto apunta al config.yml compartido.
assert_cf_config_safe "${CONFIG_FILE}"

install_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    info "cloudflared ya instalado: $(cloudflared --version | head -1)"
    return
  fi
  info "Instalando cloudflared..."
  command -v curl >/dev/null 2>&1 || die "curl requerido."
  local tmp_bin="/tmp/cloudflared"
  curl -fsSL \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" \
    -o "${tmp_bin}"
  chmod +x "${tmp_bin}"
  sudo mv "${tmp_bin}" "${CLOUDFLARED_BIN}"
  ok "cloudflared instalado: $(cloudflared --version | head -1)"
}

ensure_login() {
  if [[ -f "${CERT_FILE}" ]]; then
    info "Certificado ya presente en ${CERT_FILE}"
    return
  fi
  info "Autenticando con Cloudflare (se abrira una URL en el navegador)..."
  info "Selecciona 'josuesay.com' en la pagina de autorizacion."
  cloudflared tunnel login
  ok "Autenticacion completada."
}

ensure_tunnel() {
  local uuid
  uuid="$(get_tunnel_uuid)"
  if [[ -n "${uuid}" ]]; then
    info "Tunel '${TUNNEL_NAME}' ya existe (UUID: ${uuid})" >&2
  else
    info "Creando tunel '${TUNNEL_NAME}'..." >&2
    # Redirigir stdout a stderr: 'tunnel create' imprime mensajes informativos
    # (credentials path, id, etc.) que si quedan en stdout contaminan el UUID
    # capturado por la funcion padre (uuid="$(ensure_tunnel)").
    cloudflared tunnel create "${TUNNEL_NAME}" >&2
    uuid="$(get_tunnel_uuid)"
    [[ -n "${uuid}" ]] || die "No se pudo obtener el UUID despues de crear el tunel."
    ok "Tunel creado (UUID: ${uuid})" >&2
  fi
  echo "${uuid}"
}

ensure_dns_route() {
  local hostname="$1"
  info "Configurando ruta DNS: ${hostname}"
  # --overwrite-dns hace idempotente el CNAME: si un record apuntaba a otro
  # tunel (huerfano de un init previo o de otro proyecto), lo reasigna al
  # tunel actual en vez de fallar con "record already exists" (→ 1003).
  if cloudflared tunnel route dns --overwrite-dns "${TUNNEL_NAME}" "${hostname}" >&2; then
    ok "Ruta DNS configurada: ${hostname}"
    return
  fi
  die "Fallo al crear ruta DNS para ${hostname}"
}

backup_config_if_exists() {
  local target="$1"
  [[ -f "${target}" ]] || return 0
  local backup="${target}.$(date +%Y%m%d-%H%M%S).bak"
  cp "${target}" "${backup}"
  warn "Backup de config anterior: ${backup}"
}

validate_config_ingress() {
  local target="$1"
  if cloudflared tunnel --config "${target}" ingress validate >/dev/null 2>&1; then
    ok "Config YAML validado por cloudflared."
    return
  fi
  warn "El YAML generado no paso la validacion de cloudflared:"
  cloudflared tunnel --config "${target}" ingress validate || true
  die "Aborta: corrige ${target} o borralo y re-ejecuta."
}

write_config_file() {
  local uuid="$1"
  mkdir -p "${CLOUDFLARED_CONFIG_DIR}"
  # Nunca tocar ~/.cloudflared/config.yml: ese archivo es el por-defecto global
  # y puede pertenecer a otros proyectos. Este proyecto escribe siempre a
  # ${TUNNEL_NAME}.yml y levanta con --config explicito.
  assert_cf_config_safe "${CONFIG_FILE}"
  backup_config_if_exists "${CONFIG_FILE}"
  cat > "${CONFIG_FILE}" <<EOF
tunnel: ${TUNNEL_NAME}
credentials-file: ${CLOUDFLARED_CONFIG_DIR}/${uuid}.json

ingress:
  - hostname: ${API_HOSTNAME}
    service: http://localhost:${API_LOCAL_PORT}
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
  - hostname: ${WEB_HOSTNAME}
    service: http://localhost:${WEB_LOCAL_PORT}
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
  - service: http_status:404
EOF
  ok "Config escrita en ${CONFIG_FILE}"
}

main() {
  echo -e "\n${BOLD}${BLUE}[tunnel-init] Bootstrap Cloudflare Tunnel (${TUNNEL_NAME})${RESET}\n"

  install_cloudflared
  ensure_login

  local uuid
  uuid="$(ensure_tunnel)"

  while read -r hostname; do
    ensure_dns_route "${hostname}"
  done < <(tunnel_hostnames)

  write_config_file "${uuid}"
  validate_config_ingress "${CONFIG_FILE}"

  echo ""
  ok "Setup completo. Ejecuta './scripts/09_tunnel_up.sh' para levantar el tunel."
  echo ""
  info "Hostnames configurados:"
  while read -r hostname; do
    info "  https://${hostname}"
  done < <(tunnel_hostnames)
  echo ""
  info "Para diagnosticar DNS o propagacion: ./scripts/10_dns_check.sh"
}

main "$@"
