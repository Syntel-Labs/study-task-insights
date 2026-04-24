#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  lib.sh — utilidades compartidas por todos los scripts de STI
#  NO ejecutar directamente. Se importa con: source "$(dirname "$0")/lib.sh"
# ─────────────────────────────────────────────

BLUE="\e[34m"; GREEN="\e[32m"; RED="\e[31m"
YELLOW="\e[33m"; BOLD="\e[1m"; RESET="\e[0m"

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPTS_DIR}/.." && pwd)"

SERVER_DIR="${PROJECT_DIR}/server"
CLIENT_DIR="${PROJECT_DIR}/client"

SERVER_COMPOSE="${SERVER_DIR}/docker-compose.yml"
CLIENT_COMPOSE="${CLIENT_DIR}/docker-compose.yml"

SERVER_ENV="${SERVER_DIR}/.env"
CLIENT_ENV="${CLIENT_DIR}/.env"

# Contenedores del stack (nombres fijos definidos en docker-compose).
# sti-hermes = perfil cpu; sti-hermes-gpu = perfil gpu. Nunca corren a la vez.
SERVER_CONTAINERS=(sti-atlas sti-hermes sti-hermes-gpu sti-prometheus sti-apollo)
CLIENT_CONTAINERS=(sti-nike)
ALL_CONTAINERS=("${SERVER_CONTAINERS[@]}" "${CLIENT_CONTAINERS[@]}")

# Cloudflare Tunnel (nombres y hostnames)
# Naming per skill cloudflare-tunnel-standards: <repo-slug>-<env> en kebab-case.
TUNNEL_NAME="sti-dev"
API_HOSTNAME="sti-api.josuesay.com"
WEB_HOSTNAME="sti-web.josuesay.com"
API_LOCAL_PORT="${APP_PORT:-3000}"
WEB_LOCAL_PORT="${CLIENT_HOST_PORT:-8080}"
CLOUDFLARED_CONFIG_DIR="${HOME}/.cloudflared"
# Convencion del skill: ~/.cloudflared/<tunnel-name>.yml (no prefijo 'config-').
CLOUDFLARED_CONFIG_FILE="${CLOUDFLARED_CONFIG_DIR}/${TUNNEL_NAME}.yml"

# Retorna el path del config per-proyecto. Centraliza el naming para que el
# script que escribe (tunnel_init) y el que lee (tunnel_up) siempre coincidan.
tunnel_config_file() {
  local name="${1:-$TUNNEL_NAME}"
  echo "${CLOUDFLARED_CONFIG_DIR}/${name}.yml"
}

# Guard contra escritura al config.yml global compartido. Normaliza el path
# (expande ~, resuelve relativos, colapsa //) antes de comparar para que no
# se pueda bypassear con `./config.yml` ni `~/.cloudflared//config.yml`.
assert_cf_config_safe() {
  local path="$1"
  path="${path/#\~/$HOME}"
  local parent filename
  parent="$(cd "$(dirname "${path}")" 2>/dev/null && pwd)" || parent="$(dirname "${path}")"
  filename="$(basename "${path}")"
  local normalized="${parent}/${filename}"

  if [[ "${normalized}" == "${CLOUDFLARED_CONFIG_DIR}/config.yml" || \
        "${normalized}" == "${CLOUDFLARED_CONFIG_DIR}/config.yaml" ]]; then
    die "Prohibido escribir en ${path}. Ese es el config por defecto de cloudflared y debe quedar libre. Usa un archivo por tunel (ej: ${CLOUDFLARED_CONFIG_DIR}/${TUNNEL_NAME}.yml)."
  fi
}

get_tunnel_uuid() {
  cloudflared tunnel list 2>/dev/null \
    | awk -v name="${TUNNEL_NAME}" '$2 == name { print $1 }'
}

tunnel_hostnames() {
  printf '%s\n' "${API_HOSTNAME}" "${WEB_HOSTNAME}"
}

die()  { echo -e "${RED}  $*${RESET}" >&2; exit 1; }
info() { echo -e "${BLUE}[sti]${RESET} $*"; }
ok()   { echo -e "${GREEN}OK${RESET} $*"; }
warn() { echo -e "${YELLOW}!!${RESET} $*"; }

require_docker() {
  command -v docker >/dev/null 2>&1 || die "Docker no esta instalado."
  docker info >/dev/null 2>&1      || die "El daemon de Docker no esta corriendo."
}

_require_env() {
  local env_path="$1"
  local example_path="${env_path}.example"
  if [[ ! -f "${env_path}" ]]; then
    warn "${env_path} no encontrado. Copiando desde .env.example..."
    [[ -f "${example_path}" ]] || die "Tampoco existe ${example_path}. Revisa la instalacion."
    cp "${example_path}" "${env_path}"
    warn "Revisa y ajusta ${env_path} antes de continuar."
    exit 1
  fi
}

require_env_files() {
  _require_env "${SERVER_ENV}"
  _require_env "${CLIENT_ENV}"
}

# Compose wrappers: uno por stack, ambos apuntan a su .env.
# dcs_profile permite pasar el perfil activo (cpu|gpu) como primer argumento.
dcs() { docker compose --env-file "${SERVER_ENV}" -f "${SERVER_COMPOSE}" "$@"; }
dcc() { docker compose --env-file "${CLIENT_ENV}" -f "${CLIENT_COMPOSE}" "$@"; }
dcs_profile() {
  local profile="$1"; shift
  docker compose --env-file "${SERVER_ENV}" -f "${SERVER_COMPOSE}" --profile "${profile}" "$@"
}

# Resuelve el compose wrapper a partir del nombre del contenedor
dc_for_container() {
  local name="$1"
  for c in "${CLIENT_CONTAINERS[@]}"; do
    [[ "$c" == "$name" ]] && { echo dcc; return; }
  done
  echo dcs
}
