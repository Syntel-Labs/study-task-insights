#!/usr/bin/env bash
# lib.sh — shared utilities for all scripts. Source with: source "$(dirname "$0")/lib.sh"

BLUE="\e[34m"; GREEN="\e[32m"; RED="\e[31m"
YELLOW="\e[33m"; BOLD="\e[1m"; RESET="\e[0m"

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPTS_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
ENV_FILE="${PROJECT_DIR}/.env"

die()  { echo -e "${RED}❌  $*${RESET}" >&2; exit 1; }
info() { echo -e "${BLUE}[sti]${RESET} $*"; }
ok()   { echo -e "${GREEN}✔  $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠  $*${RESET}"; }

require_docker() {
  command -v docker >/dev/null 2>&1 || die "Docker not installed."
  docker info >/dev/null 2>&1      || die "Docker daemon is not running."
}

require_env_file() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    warn ".env not found. Copying from .env.example..."
    [[ -f "${PROJECT_DIR}/.env.example" ]] \
      || die ".env.example not found either. Check your installation."
    cp "${PROJECT_DIR}/.env.example" "${ENV_FILE}"
    warn "Review and update ${ENV_FILE} before continuing."
    exit 1
  fi
}

load_env() {
  require_env_file
  # shellcheck disable=SC2046
  export $(grep -v '^\s*#' "${ENV_FILE}" | grep -v '^\s*$' | xargs)
}

dc() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}
