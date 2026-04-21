# Study Task Insights

Plataforma full-stack para analizar habitos de estudio y productividad academica. El backend expone una API REST con integracion LLM local, y el frontend es una SPA que consume dicha API.

## Modulos

- `server/` - API en Node.js + Express + Prisma + PostgreSQL con LLM local via Ollama (Qwen2.5-7B-Instruct)
- `client/` - SPA en React + Vite + Material UI servida por Nginx
- `scripts/` - Scripts helper para levantar, detener y operar el stack completo desde la raiz

Ambos modulos corren en Docker Compose, con servicios independientes por carpeta.

## Requisitos

| Componente | Version minima | Verificacion |
| --- | --- | --- |
| Docker Engine | 24+ | `docker --version` |
| Docker Compose plugin | 2.20+ | `docker compose version` |
| WSL2 (en Windows) | Ubuntu 22.04+ | `wsl --version` |
| dos2unix (si editaste scripts en Windows) | cualquiera | `dos2unix --version` |

Node.js y pnpm solo son necesarios para desarrollo local fuera de Docker.

## Estructura

```bash
study-task-insights/
|-- server/                   # Backend (Express + Prisma + PostgreSQL + Ollama)
|   |-- src/                  # controllers, services, repositories, routes, middlewares
|   |-- prisma/               # schema.prisma (schema "sti")
|   |-- migrations/           # SQL de init y seed (ejecutados por postgres en primer arranque)
|   |-- scripts/              # helpers montados dentro de contenedores (install_model, lib)
|   |-- docker-compose.yml    # servicios: atlas, hermes, prometheus, apollo
|   |-- Dockerfile
|   |-- .env / .env.example
|
|-- client/                   # Frontend (React + Vite + MUI)
|   |-- src/                  # pages, components, hooks, context, utils, styles
|   |-- docker/nginx.conf
|   |-- docker-compose.yml    # servicio: nike
|   |-- Dockerfile
|   |-- .env / .env.example
|
|-- scripts/                  # Helpers del stack completo (se ejecutan desde la raiz)
|   |-- lib.sh                # utilidades compartidas
|   |-- 01_start.sh           # levantar stack (server + client)
|   |-- 02_stop.sh            # detener stack
|   |-- 03_restart.sh         # reiniciar todo, un stack o un contenedor
|   |-- 04_logs.sh            # seguir logs de un contenedor
|   |-- 05_shell.sh           # shell interactiva dentro de un contenedor
|   |-- 06_install_model.sh   # instalar/verificar modelo en Ollama
|   |-- 07_status.sh          # estado del stack + healthchecks basicos
|
|-- docs/                     # Documentacion adicional
`-- README.md
```

## Contenedores

Nombres con prefijo `sti-` y nombres griegos para evitar colision con otros stacks en la maquina.

| Servicio | Contenedor | Rol | Puerto host |
| --- | --- | --- | --- |
| PostgreSQL | `sti-atlas` | Base de datos (esquema `sti`) | `5433` |
| Ollama server | `sti-hermes` | Servidor LLM | no expuesto |
| Ollama init | `sti-prometheus` | Descarga modelo al primer arranque | no expuesto |
| API backend | `sti-apollo` | Express + Prisma | `3000` |
| Frontend SPA | `sti-nike` | Nginx sirviendo React | `8080` |

Puertos expuestos solo los estrictamente necesarios para acceso externo. `sti-hermes` queda en red interna porque solo lo consume `sti-apollo`.

## Preparar entorno

Copiar los archivos de ejemplo:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Editar `server/.env` con tus credenciales. Campos clave:

- `DB_USER`, `DB_PASS`, `DB_NAME` - credenciales de PostgreSQL
- `DB_SCHEMA=sti` - esquema dedicado (no usar `public`)
- `DB_HOST_PORT=5433` - puerto expuesto en el host para MCP/pgAdmin
- `ACCESS_ENABLED=false` - gate de acceso deshabilitado en dev
- `ALLOWED_ORIGINS` - debe incluir `http://localhost:8080`
- `OLLAMA_URL=http://hermes:11434` - nombre interno del servicio Ollama

En `client/.env` lo importante es que `VITE_API_BASE_PATH=/api/v1` coincida con el backend.

## Arranque rapido

Desde la raiz del repo:

```bash
./scripts/01_start.sh           # levanta todo (server + client)
./scripts/01_start.sh server    # solo backend
./scripts/01_start.sh client    # solo frontend
```

Verificar estado:

```bash
./scripts/07_status.sh
```

Acceso:

- Frontend: `http://localhost:8080`
- API: `http://localhost:3000/api/v1/`
- Healthcheck: `http://localhost:3000/healthz`
- Gate: `http://localhost:3000/gate/login`

## Scripts de operacion

| Comando | Descripcion |
| --- | --- |
| `./scripts/01_start.sh [server|client|all]` | Levanta el stack completo o una parte |
| `./scripts/02_stop.sh [server|client|all] [--volumes]` | Detiene; con `--volumes` borra DB y modelo LLM |
| `./scripts/03_restart.sh [all|server|client|sti-<nombre>]` | Reinicia el stack o un contenedor |
| `./scripts/04_logs.sh sti-<nombre> [tail]` | Sigue logs de un contenedor |
| `./scripts/05_shell.sh sti-<nombre>` | Shell interactiva dentro de un contenedor |
| `./scripts/06_install_model.sh [modelo]` | Instala/verifica modelo en `sti-hermes` |
| `./scripts/07_status.sh` | Tabla de contenedores + chequeos de salud |

## Primer arranque

1. `sti-atlas` arranca y ejecuta los SQL de `server/migrations/` (`01_init_schema.sql`, `02_seed_catalogs.sql`) que crean el esquema `sti` con tablas y catalogos iniciales.
2. `sti-hermes` inicia el servidor Ollama.
3. `sti-prometheus` verifica si el modelo `qwen2.5:7b-instruct` ya esta descargado; si no, lo descarga (primera vez ~4.7 GB) y termina.
4. `sti-apollo` arranca cuando `sti-atlas` esta healthy y `sti-prometheus` completado. Prisma abre conexion al esquema `sti`.
5. `sti-nike` arranca despues con el backend ya disponible.

## Esquema de base de datos

Todas las tablas viven en el esquema `sti` (no `public`). Esto permite coexistir con otras DBs en la misma instancia y facilita backups selectivos.

El schema incluye:

- Catalogos: `terms`, `task_statuses`, `task_priorities`, `task_types`, `task_tags`
- Tablas principales: `tasks`, `task_tag_assignments`, `study_sessions`
- Vista materializada: `weekly_productivity`
- Tipo enum: `term_status`

`prisma/schema.prisma` declara `schemas = ["sti"]` con `previewFeatures = ["multiSchema"]` y cada modelo usa `@@schema("sti")`.

Conexion desde herramientas externas (pgAdmin, psql, MCP):

```bash
psql -h localhost -p 5433 -U postgres -d study_task_insights
# luego dentro de psql: SET search_path TO sti;
```

## Limpieza y mantenimiento

```bash
./scripts/02_stop.sh                  # detener sin perder datos
./scripts/02_stop.sh --volumes        # detener y borrar DB y modelo
```

Para reinstalar el modelo LLM en caliente:

```bash
./scripts/06_install_model.sh qwen2.5:7b-instruct
```

## Documentacion detallada

- [server/README.md](server/README.md) - backend
- [client/README.md](client/README.md) - frontend
- [docs/](docs/) - documentacion tecnica adicional
