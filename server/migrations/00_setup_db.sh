#!/bin/sh
set -e

GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
DIM="\033[2m"
RESET="\033[0m"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${CYAN}Inicializando base de datos PostgreSQL...${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SEED_DEMO="${SEED_DEMO:-false}"

for f in /docker-entrypoint-initdb.d/*.sql; do
  [ -f "$f" ] || continue
  base="$(basename "$f")"

  # Si es el seed demo y SEED_DEMO != true, lo saltamos
  case "$base" in
    03_seed_demo.sql)
      if [ "$SEED_DEMO" != "true" ]; then
        echo "${DIM}Omitido (SEED_DEMO=false):${RESET} $base"
        echo ""
        continue
      fi
      ;;
  esac

  echo "${YELLOW}Ejecutando:${RESET} $base"
  psql -v ON_ERROR_STOP=1 \
       --username "$POSTGRES_USER" \
       --dbname "$POSTGRES_DB" \
       -f "$f" > /dev/null
  echo "   ${GREEN}✔ Completado:${RESET} $base"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}Inicialización completada con éxito.${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
