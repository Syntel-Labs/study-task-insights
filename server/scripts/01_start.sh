#!/usr/bin/env bash
# 01_start.sh — Start the STI backend stack (atlas, hermes, prometheus, apollo)
set -euo pipefail

source "$(dirname "$0")/lib.sh"

require_docker
load_env

info "Starting STI backend stack..."
dc up -d --build

ok "Stack started. Services:"
dc ps
