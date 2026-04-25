# Study Task Insights

Plataforma full-stack para analizar habitos de estudio y productividad academica. El backend expone una API REST con integracion LLM local, y el frontend es una SPA que consume dicha API. Soporta despliegue local (CPU o GPU) y exposicion publica via Cloudflare Tunnel.

## Modulos

- `server/` — API en Node.js + Express + Prisma + PostgreSQL con LLM local via Ollama
- `client/` — SPA en React + Vite + Material UI servida por Nginx
- `scripts/` — Scripts helper para levantar, detener y operar el stack desde la raiz
- `Makefile` — Atajo unificado a los scripts mas usados

Ambos modulos corren en Docker Compose, con servicios independientes por carpeta.

## Requisitos

| Componente | Version minima | Verificacion |
| :--- | :--- | :--- |
| Docker Engine | 24+ | `docker --version` |
| Docker Compose plugin | 2.20+ | `docker compose version` |
| WSL2 (en Windows) | Ubuntu 22.04+ | `wsl --version` |
| make | 4+ | `make --version` |
| dos2unix (si editaste scripts en Windows) | cualquiera | `dos2unix --version` |

Para perfil GPU, adicionalmente:

| Componente | Verificacion |
| :--- | :--- |
| Driver NVIDIA (Windows) | `nvidia-smi` (en WSL) |
| `nvidia-container-toolkit` | `dpkg -l \| grep nvidia-container-toolkit` |
| Docker runtime `nvidia` | `docker info \| grep -i runtime` |

Node.js y pnpm solo son necesarios para desarrollo local fuera de Docker.

## Estructura

```bash
study-task-insights/
|-- server/                   # Backend (Express + Prisma + PostgreSQL + Ollama)
|   |-- src/                  # controllers, services, repositories, routes, middlewares, utils
|   |-- prisma/               # schema.prisma (schema "sti")
|   |-- migrations/           # 00_setup_db.sh + SQL de init/seed
|   |-- docker-compose.yml    # servicios: atlas, hermes (cpu), hermes-gpu (gpu), prometheus, apollo
|   |-- Dockerfile
|   |-- .env / .env.example
|
|-- client/                   # Frontend (React + Vite + MUI)
|   |-- src/                  # pages, components, hooks, context, utils, lib
|   |-- docker/nginx.conf
|   |-- docker-compose.yml    # servicio: nike
|   |-- Dockerfile
|   |-- .env / .env.example
|
|-- scripts/                  # Helpers del stack (se ejecutan desde la raiz)
|   |-- lib.sh                # utilidades compartidas
|   |-- 01_start.sh           # levantar stack (cpu | --gpu)
|   |-- 02_stop.sh            # detener stack
|   |-- 03_restart.sh         # reiniciar todo, un stack o un contenedor
|   |-- 04_logs.sh            # seguir logs de un contenedor
|   |-- 05_shell.sh           # shell interactiva dentro de un contenedor
|   |-- 06_install_model.sh   # instalar/verificar modelo en Ollama
|   |-- 07_status.sh          # estado del stack + healthchecks basicos
|   |-- 08_tunnel_init.sh     # bootstrap del Cloudflare Tunnel (una sola vez)
|   |-- 09_tunnel_up.sh       # levantar tunel en foreground
|   |-- 10_dns_check.sh       # diagnostico DNS / propagacion
|   |-- cloudflare_verify.sh  # verifica que el setup CF este completo
|   |-- tunnel_down.sh        # limpieza completa del tunel
|
|-- Makefile                  # atajos: start, stop, tunnel-init, tunnel-up, dns-check, ...
|-- docs/                     # documentacion adicional
`-- README.md
```

## Contenedores

Nombres con prefijo `sti-` y nombres griegos para evitar colision con otros stacks en la maquina.

| Servicio | Contenedor | Perfil | Rol | Puerto host |
| :--- | :--- | :--- | :--- | :--- |
| PostgreSQL | `sti-atlas` | cpu, gpu | Base de datos (esquema `sti`) | `5433` |
| Ollama (CPU) | `sti-hermes` | cpu | Servidor LLM en CPU | no expuesto |
| Ollama (GPU) | `sti-hermes-gpu` | gpu | Servidor LLM en GPU NVIDIA | no expuesto |
| Ollama init | `sti-prometheus` | cpu, gpu | Descarga del modelo si no existe | no expuesto |
| API backend | `sti-apollo` | cpu, gpu | Express + Prisma | `3000` |
| Frontend SPA | `sti-nike` | (cliente) | Nginx sirviendo React | `8080` |

`sti-hermes` y `sti-hermes-gpu` comparten el alias de red `hermes`, asi `sti-apollo` usa la misma URL `http://hermes:11434` en ambos perfiles. El volumen `sti_ollama` persiste los modelos descargados entre cambios de perfil.

## Preparar entorno

Copiar los archivos de ejemplo:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Editar `server/.env` con tus credenciales. Campos clave:

- `DB_USER`, `DB_PASS`, `DB_NAME` — credenciales de PostgreSQL
- `DB_SCHEMA=sti` — esquema dedicado (no usar `public`)
- `DB_HOST_PORT=5433` — puerto expuesto en el host para MCP/pgAdmin
- `ACCESS_ENABLED=true` y `ACCESS_TOKEN=...` — gate de acceso (recomendado en produccion)
- `COOKIE_CROSS_SITE=true` — si frontend y backend viven en dominios distintos (Cloudflare)
- `ALLOWED_ORIGINS` — debe incluir `http://localhost:8080` y los hostnames publicos de CF
- `OLLAMA_URL=http://hermes:11434` — alias compartido por las dos variantes de hermes
- `LLM_MODEL` — modelo activo (`llama3.1:8b-instruct-q4_K_M` o `qwen2.5:7b-instruct`)
- `SEED_DEMO=true` — sembrar datos demo en el primer arranque

En `client/.env`:

- `VITE_BACKEND_BASE_URL` — `http://localhost:3000` para dev, hostname CF en produccion
- `VITE_API_BASE_PATH=/api/v1` debe coincidir con el backend

## Arranque rapido

Desde la raiz:

```bash
make start                  # levanta el stack completo en CPU
make start-gpu              # equivalente con perfil GPU
make stop                   # detiene
make status                 # estado de los contenedores
```

O directamente con los scripts:

```bash
./scripts/01_start.sh                   # cpu (default)
./scripts/01_start.sh --gpu             # gpu
./scripts/01_start.sh server            # solo backend
./scripts/01_start.sh client            # solo frontend
```

Acceso local:

- Frontend: <http://localhost:8080>
- API: <http://localhost:3000/api/v1/>
- Healthcheck: <http://localhost:3000/healthz>
- Gate: `POST http://localhost:3000/gate/login` con `{"secret":"<ACCESS_TOKEN>"}`

## Exposicion publica via Cloudflare Tunnel

El proyecto incluye scripts para exponer el stack bajo subdominios reales sin abrir puertos del router. Una sola vez por maquina:

```bash
make tunnel-init            # instala cloudflared, autentica, crea el tunel, escribe config
```

Dia a dia (en una terminal aparte, mientras el stack corre con `make start`):

```bash
make tunnel-up              # foreground; Ctrl+C para detener
```

Verificacion:

```bash
make cf-verify              # cert, tunel, config, ingress validate, DNS
make dns-check              # diagnostico de propagacion + estado HTTP
```

Limpieza:

```bash
make tunnel-down            # borra tunel, config y credenciales (con confirmacion)
```

Hostnames por defecto: `sti-api.josuesay.com` y `sti-web.josuesay.com`. Configurables en `scripts/lib.sh` (`API_HOSTNAME`, `WEB_HOSTNAME`).

Detalles tecnicos en [`docs/05_cloudflare-and-gpu.md`](docs/05_cloudflare-and-gpu.md).

## Targets de Makefile

| Target | Descripcion |
| :--- | :--- |
| `make start` | Levanta el stack completo (perfil CPU) |
| `make stop` | Detiene el stack |
| `make restart` | Reinicia el stack |
| `make logs` | Sigue logs |
| `make shell` | Shell interactiva en un contenedor |
| `make install-model` | Descarga el modelo LLM activo en Ollama |
| `make status` | Estado de contenedores + healthchecks |
| `make tunnel-init` | Bootstrap del Cloudflare Tunnel (una sola vez) |
| `make tunnel-up` | Levanta el tunel en foreground |
| `make dns-check` | Diagnostico DNS y propagacion |
| `make cf-verify` | Verifica que el setup CF este completo |
| `make tunnel-down` | Elimina tunel, config y credenciales |

## Scripts de operacion

| Comando | Descripcion |
| :--- | :--- |
| `./scripts/01_start.sh [server\|client\|all] [--gpu]` | Levanta el stack completo o una parte; `--gpu` activa el perfil GPU |
| `./scripts/02_stop.sh [server\|client\|all] [--volumes]` | Detiene; con `--volumes` borra DB y modelos |
| `./scripts/03_restart.sh [all\|server\|client\|sti-<nombre>]` | Reinicia el stack o un contenedor |
| `./scripts/04_logs.sh sti-<nombre> [tail]` | Sigue logs de un contenedor |
| `./scripts/05_shell.sh sti-<nombre>` | Shell interactiva dentro de un contenedor |
| `./scripts/06_install_model.sh [modelo]` | Instala/verifica modelo en Ollama |
| `./scripts/07_status.sh` | Tabla de contenedores + chequeos de salud |
| `./scripts/08_tunnel_init.sh` | Bootstrap del tunel: instala, autentica, crea, enruta, valida |
| `./scripts/09_tunnel_up.sh` | Levanta el tunel con `--config` per-proyecto |
| `./scripts/10_dns_check.sh` | Diagnostico de NS, CNAME, resolucion y HTTP |
| `./scripts/cloudflare_verify.sh` | Verifica cert, tunel, config, ingress y DNS |
| `./scripts/tunnel_down.sh` | Limpieza completa del tunel |

## Primer arranque

1. `sti-atlas` arranca y ejecuta los scripts de `server/migrations/` (`00_setup_db.sh`, `01_init_schema.sql`, `02_seed_catalogs.sql`, opcionalmente `03_seed_demo.sql`).
2. `sti-hermes` o `sti-hermes-gpu` inicia el servidor Ollama segun el perfil.
3. `sti-prometheus` verifica si el `LLM_MODEL` ya esta descargado; si no, lo baja (~5 GB la primera vez) y termina.
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

Detalles del modelo en [`docs/00_data-model/data-model_v1.md`](docs/00_data-model/data-model_v1.md).

## Limpieza y mantenimiento

```bash
./scripts/02_stop.sh                  # detener sin perder datos
./scripts/02_stop.sh --volumes        # detener y borrar DB y modelos
```

Para reinstalar el modelo LLM en caliente:

```bash
./scripts/06_install_model.sh llama3.1:8b-instruct-q4_K_M
```

## Documentacion

- [`docs/01_project-setup.md`](docs/01_project-setup.md) — flujo de cero a levantado
- [`docs/04_prisma-orm-guide.md`](docs/04_prisma-orm-guide.md) — flujo de cambios al schema Prisma
- [`docs/05_cloudflare-and-gpu.md`](docs/05_cloudflare-and-gpu.md) — Cloudflare Tunnel y perfiles CPU/GPU
- [`docs/00_data-model/data-model_v1.md`](docs/00_data-model/data-model_v1.md) — modelo de datos
- [`docs/code/`](docs/code/) — documentacion por archivo del codigo fuente
- [`server/README.md`](server/README.md) — backend
- [`client/README.md`](client/README.md) — frontend
