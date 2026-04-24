#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  10_dns_check.sh — Diagnostico de DNS / propagacion del tunel sti-dev
#
#  Uso:
#    ./scripts/10_dns_check.sh
#    ./scripts/10_dns_check.sh sti-api.josuesay.com
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

DOMAIN_ROOT="josuesay.com"
EXPECTED_NS="cloudflare"

check_single_hostname=""
for arg in "$@"; do
  case "$arg" in
    --help) grep '^# ' "$0" | sed 's/^# //'; exit 0 ;;
    *.josuesay.com) check_single_hostname="$arg" ;;
    *) die "Argumento desconocido: $arg" ;;
  esac
done

command -v dig  >/dev/null 2>&1 || die "dig requerido (apt install dnsutils)"
command -v curl >/dev/null 2>&1 || die "curl requerido"

check_root_nameservers() {
  echo -e "\n${BOLD}${BLUE}[1/5] Nameservers de ${DOMAIN_ROOT}${RESET}"
  local ns_cf ns_google ns_local
  ns_cf="$(dig @1.1.1.1 NS "${DOMAIN_ROOT}" +short 2>/dev/null | sort | tr '\n' ' ')"
  ns_google="$(dig @8.8.8.8 NS "${DOMAIN_ROOT}" +short 2>/dev/null | sort | tr '\n' ' ')"
  ns_local="$(dig NS "${DOMAIN_ROOT}" +short 2>/dev/null | sort | tr '\n' ' ')"
  printf "  %-18s %s\n" "Cloudflare 1.1.1.1:" "${ns_cf:-(sin respuesta)}"
  printf "  %-18s %s\n" "Google 8.8.8.8:"     "${ns_google:-(sin respuesta)}"
  printf "  %-18s %s\n" "Resolver local:"     "${ns_local:-(sin respuesta)}"
  if echo "${ns_cf}" | grep -q "${EXPECTED_NS}"; then
    ok "Nameservers globales apuntan a Cloudflare."
  else
    warn "Nameservers globales NO apuntan a Cloudflare -- revisa el registrador."
    return 1
  fi
  if ! echo "${ns_local}" | grep -q "${EXPECTED_NS}"; then
    warn "Tu resolver local ve NS viejos (cache TTL). sudo resolvectl flush-caches"
  fi
  return 0
}

check_hostname_cname() {
  local hostname="$1"
  echo -e "\n${BOLD}${BLUE}[2/5] Resolucion DNS de ${hostname}${RESET}"
  local cname_cf a_cf
  cname_cf="$(dig @1.1.1.1 "${hostname}" CNAME +short 2>/dev/null)"
  a_cf="$(dig @1.1.1.1 "${hostname}" A +short 2>/dev/null | head -1)"
  if [[ -n "${cname_cf}" ]]; then
    printf "  %-18s %s\n" "CNAME (CF):" "${cname_cf}"
    if [[ "${cname_cf}" == *"cfargotunnel.com"* ]]; then
      ok "CNAME apunta al tunel (proxied=off)."
    else
      warn "CNAME apunta a otro destino: ${cname_cf}"
    fi
    return 0
  fi
  if [[ -n "${a_cf}" ]]; then
    printf "  %-18s %s\n" "A record (CF):" "${a_cf}"
    ok "Hostname resuelve via proxy de Cloudflare."
    return 0
  fi
  warn "${hostname} no resuelve en DNS publicos."
  warn "Ejecuta: cloudflared tunnel route dns ${TUNNEL_NAME} ${hostname}"
  return 1
}

check_local_resolution() {
  local hostname="$1"
  echo -e "\n${BOLD}${BLUE}[3/5] Resolucion local de ${hostname}${RESET}"
  local ip
  ip="$(dig "${hostname}" +short 2>/dev/null | tail -1)"
  if [[ -z "${ip}" ]]; then
    warn "Resolver local no resuelve ${hostname}. sudo resolvectl flush-caches"
    return 1
  fi
  printf "  %-18s %s\n" "IP resuelta:" "${ip}"
  ok "Resolucion local funcionando."
  return 0
}

check_http_endpoint() {
  local hostname="$1"
  local probe_path="/healthz"
  [[ "${hostname}" == "${WEB_HOSTNAME}" ]] && probe_path="/"
  echo -e "\n${BOLD}${BLUE}[4/5] HTTP response de https://${hostname}${probe_path}${RESET}"
  local code
  code="$(curl -sS -o /dev/null -m 10 -w '%{http_code}' \
    "https://${hostname}${probe_path}" 2>/dev/null || true)"
  code="${code:-000}"
  printf "  %-18s %s\n" "HTTP status:" "${code}"
  case "${code}" in
    200|301|302|401|404|405) ok "Endpoint publico responde (HTTP ${code})." ;;
    522) warn "HTTP 522 — tunel activo pero backend no responde (puerto equivocado o app caida). ./scripts/04_logs.sh" ;;
    530) warn "HTTP 530 — cloudflared no corre. ./scripts/09_tunnel_up.sh (o make tunnel-up)" ;;
    1003) warn "HTTP 1003 — CNAME huerfano apunta a otro tunel. cloudflared tunnel route dns --overwrite-dns ${TUNNEL_NAME} ${hostname}" ;;
    1033) warn "HTTP 1033 — tunel offline o desconectado. make tunnel-up" ;;
    000) warn "Sin conexion. ${hostname} no resuelve o red bloqueada." ;;
    *)   warn "HTTP ${code} inesperado." ;;
  esac
  [[ "${code}" =~ ^(200|301|302|401|404|405)$ ]]
}

check_tunnel_status() {
  echo -e "\n${BOLD}${BLUE}[5/5] Estado del tunel ${TUNNEL_NAME}${RESET}"
  if ! command -v cloudflared >/dev/null 2>&1; then
    warn "cloudflared no instalado. ./scripts/08_tunnel_init.sh"
    return 1
  fi
  local uuid
  uuid="$(get_tunnel_uuid)"
  if [[ -z "${uuid}" ]]; then
    warn "Tunel no existe. ./scripts/08_tunnel_init.sh"
    return 1
  fi
  printf "  %-18s %s\n" "UUID:" "${uuid}"
  if pgrep -f "cloudflared.*${TUNNEL_NAME}" >/dev/null 2>&1; then
    ok "Proceso cloudflared corriendo para ${TUNNEL_NAME}."
    return 0
  fi
  warn "Proceso cloudflared NO corriendo. ./scripts/09_tunnel_up.sh"
  return 1
}

main() {
  echo -e "\n${BOLD}${BLUE}=== DNS / Tunnel Diagnostic (${TUNNEL_NAME}) ===${RESET}"

  local -a hostnames
  if [[ -n "${check_single_hostname}" ]]; then
    hostnames=("${check_single_hostname}")
  else
    mapfile -t hostnames < <(tunnel_hostnames)
  fi

  local failures=0
  check_root_nameservers || ((failures++))
  for hostname in "${hostnames[@]}"; do
    check_hostname_cname "${hostname}" || ((failures++))
    check_local_resolution "${hostname}" || ((failures++))
    check_http_endpoint "${hostname}" || ((failures++))
  done
  check_tunnel_status || ((failures++))

  echo ""
  if (( failures == 0 )); then
    echo -e "${GREEN}${BOLD}[ok] Todos los checks pasaron.${RESET}"
    exit 0
  fi
  echo -e "${RED}${BOLD}[error] ${failures} check(s) fallaron. Revisa arriba.${RESET}"
  exit 1
}

main "$@"
