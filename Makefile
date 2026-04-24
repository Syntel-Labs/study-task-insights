# Makefile raiz de STI (study-task-insights).
#
# Doble interfaz obligatoria por el skill cloudflare-tunnel-standards: cada
# operacion del tunel existe como script (logica) + target make (atajo).
# Los targets solo delegan; no agregan logica.

SCRIPTS := ./scripts

.DEFAULT_GOAL := help

.PHONY: help tunnel-init tunnel-up dns-check cf-verify tunnel-down \
        start stop restart logs shell status install-model

help: ## Lista los targets disponibles
	@awk 'BEGIN{FS=":.*## "}/^[a-zA-Z0-9_-]+:.*## /{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

tunnel-init: ## Bootstrap del Cloudflare Tunnel (una sola vez)
	@$(SCRIPTS)/08_tunnel_init.sh

tunnel-up: ## Levanta el tunel en foreground (Ctrl+C para detener)
	@$(SCRIPTS)/09_tunnel_up.sh

dns-check: ## Diagnostico de DNS, propagacion y estado del tunel
	@$(SCRIPTS)/10_dns_check.sh

cf-verify: ## Verifica que el setup Cloudflare este completo
	@$(SCRIPTS)/cloudflare_verify.sh

tunnel-down: ## Elimina tunel, config y credenciales (pide confirmacion)
	@$(SCRIPTS)/tunnel_down.sh

start: ## Levanta el stack Docker (perfil cpu por defecto; usa --gpu para GPU)
	@$(SCRIPTS)/01_start.sh

stop: ## Detiene el stack Docker
	@$(SCRIPTS)/02_stop.sh

restart: ## Reinicia el stack Docker
	@$(SCRIPTS)/03_restart.sh

logs: ## Muestra logs del stack
	@$(SCRIPTS)/04_logs.sh

shell: ## Abre shell interactiva en un contenedor
	@$(SCRIPTS)/05_shell.sh

install-model: ## Descarga el modelo LLM activo en Ollama
	@$(SCRIPTS)/06_install_model.sh

status: ## Estado de los contenedores
	@$(SCRIPTS)/07_status.sh
