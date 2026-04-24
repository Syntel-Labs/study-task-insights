#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  cloudflare_verify.sh — Verifica que el setup Cloudflare este completo
#
#  Checks:
#   1. cloudflared instalado
#   2. cert.pem presente (login hecho)
#   3. Tunel ${TUNNEL_NAME} existe en Cloudflare
#   4. Config per-proyecto ~/.cloudflared/${TUNNEL_NAME}.yml existe
#   5. Ingress YAML valida (cloudflared tunnel ingress validate)
#   6. Rutas DNS resueltas para cada hostname
#
#  Uso:
#    ./scripts/cloudflare_verify.sh
#    ./scripts/cloudflare_verify.sh --help
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

for arg in "$@"; do
  case "$arg" in
    --help) grep '^# ' "$0" | sed 's/^# //'; exit 0 ;;
    *)      die "Argumento desconocido: $arg" ;;
  esac
done

CONFIG_FILE="$(tunnel_config_file)"
CERT_FILE="${CLOUDFLARED_CONFIG_DIR}/cert.pem"

failures=0

check_cloudflared_installed() {
  echo -e "\n${BOLD}${BLUE}[1/6] cloudflared instalado${RESET}"
  if command -v cloudflared >/dev/null 2>&1; then
    ok "cloudflared: $(cloudflared --version 2>&1 | head -1)"
    return 0
  fi
  warn "cloudflared no instalado. make tunnel-init"
  return 1
}

check_cert_present() {
  echo -e "\n${BOLD}${BLUE}[2/6] Certificado de autenticacion${RESET}"
  if [[ -f "${CERT_FILE}" ]]; then
    ok "cert.pem presente en ${CERT_FILE}"
    return 0
  fi
  warn "cert.pem ausente. Ejecuta: cloudflared tunnel login"
  return 1
}

check_tunnel_exists() {
  echo -e "\n${BOLD}${BLUE}[3/6] Tunel ${TUNNEL_NAME} en Cloudflare${RESET}"
  local uuid
  uuid="$(get_tunnel_uuid)"
  if [[ -n "${uuid}" ]]; then
    ok "Tunel existe (UUID: ${uuid})"
    return 0
  fi
  warn "Tunel ${TUNNEL_NAME} no existe. make tunnel-init"
  return 1
}

check_config_file() {
  echo -e "\n${BOLD}${BLUE}[4/6] Config per-proyecto${RESET}"
  if [[ -f "${CONFIG_FILE}" ]]; then
    ok "Config presente: ${CONFIG_FILE}"
    return 0
  fi
  warn "Config ausente: ${CONFIG_FILE}. make tunnel-init"
  return 1
}

check_ingress_validate() {
  echo -e "\n${BOLD}${BLUE}[5/6] Ingress validate${RESET}"
  if [[ ! -f "${CONFIG_FILE}" ]]; then
    warn "Config ausente, salto validacion."
    return 1
  fi
  if cloudflared tunnel --config "${CONFIG_FILE}" ingress validate >/dev/null 2>&1; then
    ok "YAML valido segun cloudflared."
    return 0
  fi
  warn "Ingress validate fallo:"
  cloudflared tunnel --config "${CONFIG_FILE}" ingress validate || true
  return 1
}

check_dns_routes() {
  echo -e "\n${BOLD}${BLUE}[6/6] Rutas DNS${RESET}"
  local any_fail=0
  while read -r hostname; do
    # Con proxy activado (naranja), Cloudflare responde con IPs anycast en vez
    # del CNAME original. Aceptamos ambos casos: cfargotunnel.com (DNS only) o
    # IPs de CF (proxied).
    local cname a_record
    cname="$(dig @1.1.1.1 "${hostname}" CNAME +short 2>/dev/null)"
    a_record="$(dig @1.1.1.1 "${hostname}" A +short 2>/dev/null | head -1)"
    if [[ "${cname}" == *"cfargotunnel.com"* ]]; then
      ok "${hostname} -> ${cname} (DNS only)"
    elif [[ -n "${a_record}" && "${a_record}" =~ ^(104\.|172\.|162\.|173\.) ]]; then
      ok "${hostname} -> ${a_record} (proxied via Cloudflare)"
    else
      warn "${hostname} sin ruta DNS valida (CNAME: ${cname:-vacio}, A: ${a_record:-vacio})"
      any_fail=1
    fi
  done < <(tunnel_hostnames)
  return "${any_fail}"
}

main() {
  echo -e "\n${BOLD}${BLUE}=== Cloudflare verify (${TUNNEL_NAME}) ===${RESET}"

  check_cloudflared_installed || ((failures++))
  check_cert_present          || ((failures++))
  check_tunnel_exists         || ((failures++))
  check_config_file           || ((failures++))
  check_ingress_validate      || ((failures++))
  check_dns_routes            || ((failures++))

  echo ""
  if (( failures == 0 )); then
    echo -e "${GREEN}${BOLD}[ok] Setup Cloudflare completo.${RESET}"
    exit 0
  fi
  echo -e "${RED}${BOLD}[error] ${failures} check(s) fallaron.${RESET}"
  exit 1
}

main "$@"
