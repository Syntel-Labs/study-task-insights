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

# Contenedores del stack (nombres fijos definidos en docker-compose)
SERVER_CONTAINERS=(sti-atlas sti-hermes sti-prometheus sti-apollo)
CLIENT_CONTAINERS=(sti-nike)
ALL_CONTAINERS=("${SERVER_CONTAINERS[@]}" "${CLIENT_CONTAINERS[@]}")

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

# Compose wrappers: uno por stack, ambos apuntan a su .env
dcs() { docker compose --env-file "${SERVER_ENV}" -f "${SERVER_COMPOSE}" "$@"; }
dcc() { docker compose --env-file "${CLIENT_ENV}" -f "${CLIENT_COMPOSE}" "$@"; }

# Resuelve el compose wrapper a partir del nombre del contenedor
dc_for_container() {
  local name="$1"
  for c in "${CLIENT_CONTAINERS[@]}"; do
    [[ "$c" == "$name" ]] && { echo dcc; return; }
  done
  echo dcs
}
