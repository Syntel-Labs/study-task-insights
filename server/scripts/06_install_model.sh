#!/usr/bin/env bash
# 06_install_model.sh — Install an Ollama model into sti-hermes
#
# Usage from HOST:
#   ./scripts/06_install_model.sh                     # installs default model from .env
#   ./scripts/06_install_model.sh mistral
#   ./scripts/06_install_model.sh qwen2.5:7b-instruct
#
# Usage from INSIDE the container:
#   sh /scripts/06_install_model.sh mistral
set -euo pipefail

_inside_container() {
  ! command -v docker > /dev/null 2>&1
}

if _inside_container; then
  MODEL="${1:-qwen2.5:7b-instruct}"
  echo "[sti-hermes] Checking model: ${MODEL}"

  if ollama list | grep -q "${MODEL}"; then
    echo "[sti-hermes] Model ${MODEL} already exists, skipping pull."
  else
    echo "[sti-hermes] Pulling model: ${MODEL}"
    ollama pull "${MODEL}"
    echo "[sti-hermes] Model ready: ${MODEL}"
  fi

  echo "[sti-hermes] Available models:"
  ollama list
else
  source "$(dirname "$0")/lib.sh"

  require_docker
  load_env

  MODEL="${1:-${LLM_MODEL:-qwen2.5:7b-instruct}}"

  if ! docker ps --format '{{.Names}}' | grep -q "^sti-hermes$"; then
    die "Container 'sti-hermes' is not running. Run ./scripts/01_start.sh first."
  fi

  echo -e "\n${BOLD}${BLUE}[sti] Installing model: ${MODEL}${RESET}\n"

  if docker exec sti-hermes ollama list | grep -q "${MODEL}"; then
    warn "Model ${MODEL} already installed in sti-hermes. Skipping pull."
  else
    docker exec sti-hermes ollama pull "${MODEL}"
    ok "Model installed: ${MODEL}"
  fi

  echo -e "\n${BLUE}[sti] Available models in sti-hermes:${RESET}"
  docker exec sti-hermes ollama list
fi
