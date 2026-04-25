# Study Task Insights - Backend

API en Node.js + Express + Prisma + PostgreSQL con integracion LLM local via Ollama. La base de datos usa un esquema dedicado `sti` en lugar de `public` para aislamiento.

Coleccion Postman: [Study Task Insights API](https://www.postman.com/devprojects-team/study-task-insights/collection/o74ljke/study-task-insights-api)

## Requisitos

| Componente | Version | Notas |
| --- | --- | --- |
| Docker Engine | 24+ | Requerido |
| Docker Compose plugin | 2.20+ | Requerido (necesario para `deploy.resources.reservations.devices` en perfil GPU) |
| Node.js | 22.x | Solo para desarrollo local fuera de Docker |
| pnpm | 10+ | Solo para desarrollo local fuera de Docker |
| nvidia-container-toolkit | latest | Solo si se usa el perfil `gpu` |

## Servicios del compose

Definidos en `docker-compose.yml`. Todos corren en la misma red interna y se referencian por nombre de servicio. El compose declara dos perfiles (`cpu` y `gpu`) que activan variantes de `hermes`.

| Servicio | Contenedor | Perfil | Imagen | Rol | Puerto host |
| --- | --- | --- | --- | --- | --- |
| `atlas` | `sti-atlas` | `cpu`, `gpu` | `postgres:16` | PostgreSQL (esquema `sti`) | `${DB_HOST_PORT:-5433}` |
| `hermes` | `sti-hermes` | `cpu` | `ollama/ollama:latest` | Servidor LLM en CPU | no expuesto |
| `hermes-gpu` | `sti-hermes-gpu` | `gpu` | `ollama/ollama:latest` | Servidor LLM en GPU NVIDIA | no expuesto |
| `prometheus` | `sti-prometheus` | `cpu`, `gpu` | `ollama/ollama:latest` | Descarga del modelo al primer arranque | no expuesto |
| `apollo` | `sti-apollo` | `cpu`, `gpu` | build local | Express + Prisma | `${APP_PORT:-3000}` |

Detalles del perfil GPU:

- `hermes-gpu` comparte el volumen `sti_ollama` con `hermes` para que los modelos descargados persistan entre cambios de perfil.
- Tiene alias de red `hermes` en la red default, asi `apollo` mantiene `OLLAMA_URL=http://hermes:11434` sin tocar la configuracion.
- `prometheus` y `apollo` declaran `required: false` en su `depends_on` para que Compose no se queje del servicio inactivo segun el perfil seleccionado.
- Coexistir ambos contenedores levantados es posible, pero **no se debe** invocar inferencia simultanea: comparten `/root/.ollama` y la concurrencia corrompe el KV cache.

El servicio `prometheus` ejecuta `ollama list` y, si el modelo declarado en `LLM_MODEL` no esta presente, hace `ollama pull` y termina (`restart: no`). `apollo` depende de `atlas` healthy y `prometheus` con `service_completed_successfully`.

## Variables de entorno

Copiar y ajustar:

```bash
cp .env.example .env
```

### Base de datos

| Variable | Proposito | Default |
| --- | --- | --- |
| `DB_HOST` | Host interno de PostgreSQL | `atlas` |
| `DB_PORT` | Puerto interno | `5432` |
| `DB_NAME` | Nombre de la base | `study_task_insights` |
| `DB_USER` | Usuario | `postgres` |
| `DB_PASS` | Contrasena | `postgres` |
| `DB_SCHEMA` | Esquema dedicado | `sti` |
| `DATABASE_URL` | URL completa para Prisma | derivada |
| `DB_HOST_PORT` | Puerto expuesto en host (psql, MCP, pgAdmin) | `5433` |
| `SEED_DEMO` | Si `true`, el script `00_setup_db.sh` corre `03_seed_demo.sql` al inicializar la base | `false` |

### Servidor HTTP

| Variable | Proposito | Default |
| --- | --- | --- |
| `APP_PORT` | Puerto HTTP del API | `3000` |
| `NODE_ENV` | `development` o `production` | `development` |
| `ALLOWED_ORIGINS` | Lista CORS separada por coma | `http://localhost:3001,http://localhost:5173,http://localhost:8080` |

Para escenario con Cloudflare Tunnel anadir tambien los hostnames publicos:

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,https://sti-web.josuesay.com
```

### Gate de acceso

| Variable | Proposito | Default |
| --- | --- | --- |
| `ACCESS_ENABLED` | Activa el middleware `accessGate` | `false` |
| `ACCESS_TOKEN` | Token compartido para `/gate/login` y header `x-access-token` | requerido si `ACCESS_ENABLED=true` |
| `ACCESS_SESSION_HOURS` | Duracion de la cookie `stia_session` | `2` |
| `COOKIE_CROSS_SITE` | Si `true`, fija `SameSite=None; Secure` para escenario cross-site (Cloudflare Tunnel con frontend en otro dominio) | `false` |

Cuando el frontend corre detras de Cloudflare en `sti-web.josuesay.com` y el backend en `sti-api.josuesay.com`, fijar `COOKIE_CROSS_SITE=true` y asegurarse que `app.js` aplica `app.set("trust proxy", 1)` para que Express respete el `X-Forwarded-Proto` y emita la cookie como `Secure`.

### LLM (Ollama)

| Variable | Proposito | Default |
| --- | --- | --- |
| `OLLAMA_URL` | Endpoint interno de Ollama | `http://hermes:11434` |
| `LLM_MODEL` | Modelo a usar (`prometheus` lo descarga si falta) | `llama3.1:8b-instruct-q4_K_M` |
| `LLM_TIMEOUT_MS` | Timeout de llamadas al LLM | `30000` |
| `LLM_TEMPERATURE` | Temperatura | `0.2` |
| `OLLAMA_KEEP_ALIVE` | TTL del modelo cargado en memoria (segundos, `-1` = infinito) | `-1` |
| `OLLAMA_NUM_PARALLEL` | Peticiones paralelas que el motor procesa | `1` |

> `OLLAMA_URL` debe apuntar a `hermes` (alias de red, valido tambien para `hermes-gpu` por el `aliases: [hermes]`), no a `ollama`. El servicio se renombro para evitar colision con otros stacks de Ollama en la misma maquina.

## Base de datos

### Esquema `sti`

Todas las tablas viven en el esquema `sti`, no en `public`. El bootstrap de Postgres en el primer arranque ejecuta los archivos montados en `/docker-entrypoint-initdb.d/` en orden alfabetico:

| Archivo | Proposito |
| --- | --- |
| `migrations/00_setup_db.sh` | Verifica `SEED_DEMO`, arma el orden de ejecucion y orquesta los SQL siguientes |
| `migrations/01_init_schema.sql` | Crea el esquema `sti` y todas las tablas |
| `migrations/02_seed_catalogs.sql` | Siembra los catalogos iniciales (terms, statuses, priorities, types, tags) |
| `migrations/03_seed_demo.sql` | Datos demo opcionales (solo si `SEED_DEMO=true`) |

### Prisma

`prisma/schema.prisma` declara:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["sti"]
}
```

Cada modelo y enum incluye `@@schema("sti")`. `previewFeatures = ["multiSchema"]` esta activo en el generator.

### Acceso externo (psql, pgAdmin, MCP)

Postgres expone `${DB_HOST_PORT:-5433}` en el host. El puerto interno (`5432`) queda para que el resto de contenedores use el nombre `atlas`.

```bash
psql -h localhost -p 5433 -U postgres -d study_task_insights
# dentro de psql:
SET search_path TO sti;
```

Para el MCP `postgres-study-task-insights` configurado en `.mcp.json` usar:

```bash
postgresql://postgres:postgres@localhost:5433/study_task_insights?schema=sti
```

## Arranque desde la raiz

Desde la raiz del monorepo se gestiona el stack completo via `Makefile` o `scripts/`:

```bash
make start              # CPU (perfil por defecto)
make start -- --gpu     # GPU (delega a 01_start.sh --gpu)

make logs               # tail de todos los contenedores
make status             # estado + healthchecks
make stop               # detiene el stack
```

Equivalente directo con scripts:

```bash
./scripts/01_start.sh                 # CPU
./scripts/01_start.sh --gpu           # GPU
./scripts/01_start.sh server --gpu    # solo backend en GPU
./scripts/04_logs.sh sti-apollo       # sigue logs de la API
./scripts/07_status.sh                # estado + healthchecks
./scripts/06_install_model.sh         # fuerza descarga del modelo declarado en LLM_MODEL
```

`01_start.sh` baja el perfil contrario antes de levantar el pedido para evitar coexistencia accidental de `sti-hermes` y `sti-hermes-gpu`.

## Arranque manual desde `server/`

Si prefieres usar docker compose directamente, recuerda pasar el perfil:

```bash
docker compose --profile cpu up -d --build --remove-orphans
docker compose --profile gpu up -d --build --remove-orphans
docker compose logs -f apollo
docker compose --profile cpu down
docker compose --profile gpu down
docker compose down -v               # ademas borra DB y modelo
```

Sin `--profile`, los servicios con perfiles declarados no arrancan.

## Verificacion rapida

```bash
curl http://localhost:3000/healthz
```

Respuesta esperada:

```json
{ "status": "ok", "service": "study-task-insights-api", ... }
```

## Endpoints principales

Todos los endpoints de negocio van bajo el prefijo `/api/v1`. El gate y el healthcheck quedan fuera del prefijo.

| Ruta | Proposito |
| --- | --- |
| `/healthz` | Healthcheck publico (no pasa por `accessGate`) |
| `/gate/login`, `/gate/logout` | Endpoints de autenticacion del gate |
| `/api/v1/catalogs` | Catalogos (terms, statuses, priorities, types, tags) |
| `/api/v1/tasks` | CRUD de tareas |
| `/api/v1/task-tag-assignments` | Relacion N:M tareas-tags |
| `/api/v1/study-sessions` | Sesiones de estudio |
| `/api/v1/weekly-productivity` | Vista materializada de productividad semanal |
| `/api/v1/import/batch` | Ingesta por lotes |
| `/api/v1/llm` | Interaccion con el LLM |

Todas las respuestas siguen el contrato uniforme implementado en `src/utils/response.js` (`ok`, `created`, `noContent`, errores con `code` y `message`).

## Desarrollo local (sin Docker)

```bash
pnpm install
pnpm exec prisma generate
pnpm dev
```

Requiere una instancia de PostgreSQL con el esquema `sti` accesible y `OLLAMA_URL` apuntando a un Ollama disponible (puede ser un Ollama nativo en el host).

## Documentacion adicional

- Setup de extremo a extremo, incluido Cloudflare Tunnel: `../docs/01_project-setup.md`
- Cloudflare Tunnel y perfiles GPU/CPU: `../docs/05_cloudflare-and-gpu.md`
- Documentacion del codigo (controladores, servicios, repositorios, utilidades): `../docs/code/server/`
