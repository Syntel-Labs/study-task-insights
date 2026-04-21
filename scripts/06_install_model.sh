#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  06_install_model.sh — Instala un modelo Ollama en sti-hermes
#
#  Uso desde el host:
#    ./scripts/06_install_model.sh                       # modelo default (LLM_MODEL)
#    ./scripts/06_install_model.sh qwen2.5:7b-instruct
#    ./scripts/06_install_model.sh mistral
# ─────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/lib.sh"

require_docker

# Cargar LLM_MODEL del .env del server sin exportarlo al shell padre
LLM_MODEL_DEFAULT="qwen2.5:7b-instruct"
if [[ -f "${SERVER_ENV}" ]]; then
  LLM_MODEL_DEFAULT="$(grep -E '^LLM_MODEL=' "${SERVER_ENV}" | head -1 | cut -d= -f2- || echo "qwen2.5:7b-instruct")"
  LLM_MODEL_DEFAULT="${LLM_MODEL_DEFAULT:-qwen2.5:7b-instruct}"
fi

MODEL="${1:-${LLM_MODEL_DEFAULT}}"

if ! docker ps --format '{{.Names}}' | grep -q "^sti-hermes$"; then
  die "Container 'sti-hermes' no esta corriendo. Ejecuta ./scripts/01_start.sh primero."
fi

echo -e "\n${BOLD}${BLUE}[sti] Instalando modelo: ${MODEL}${RESET}\n"

if docker exec sti-hermes ollama list | grep -q "${MODEL}"; then
  warn "Modelo ${MODEL} ya instalado en sti-hermes. Skip."
else
  docker exec sti-hermes ollama pull "${MODEL}"
  ok "Modelo instalado: ${MODEL}"
fi

echo -e "\n${BLUE}[sti] Modelos disponibles en sti-hermes:${RESET}"
docker exec sti-hermes ollama list
