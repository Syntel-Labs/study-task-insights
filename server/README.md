# Study Task Insights - Backend

API en Node.js + Express + Prisma + PostgreSQL con integracion LLM local via Ollama (Qwen2.5-7B-Instruct). La base de datos usa un esquema dedicado llamado `sti` en lugar de `public` para aislamiento.

Coleccion Postman: [Study Task Insights API](https://www.postman.com/devprojects-team/study-task-insights/collection/o74ljke/study-task-insights-api)

## Requisitos

| Componente | Version | Notas |
| --- | --- | --- |
| Docker Engine | 24+ | Requerido |
| Docker Compose plugin | 2.20+ | Requerido |
| Node.js | 22.x | Solo para desarrollo local fuera de Docker |
| pnpm | 10+ | Solo para desarrollo local fuera de Docker |

## Servicios del compose

Definidos en `docker-compose.yml`. Todos corren en la misma red interna de Docker y se referencian entre si por nombre de servicio.

| Servicio | Contenedor | Imagen | Rol | Puerto host |
| --- | --- | --- | --- | --- |
| `atlas` | `sti-atlas` | `postgres:16` | PostgreSQL (esquema `sti`) | `5433` |
| `hermes` | `sti-hermes` | `ollama/ollama:latest` | Servidor LLM | no expuesto |
| `prometheus` | `sti-prometheus` | `ollama/ollama:latest` | Descarga del modelo al primer arranque | no expuesto |
| `apollo` | `sti-apollo` | build local | Express + Prisma | `3000` |

El servicio `prometheus` verifica con `ollama list` si el modelo ya esta descargado; si no, ejecuta `ollama pull` y termina (`restart: no`). `apollo` depende de `atlas` healthy y `prometheus` completado.

## Variables de entorno

Copiar y ajustar:

```bash
cp .env.example .env
```

Variables principales:

| Variable | Proposito | Default |
| --- | --- | --- |
| `DB_HOST` | Host interno de PostgreSQL | `atlas` |
| `DB_PORT` | Puerto interno | `5432` |
| `DB_NAME` | Nombre de la base | `study_task_insights` |
| `DB_USER` | Usuario | `postgres` |
| `DB_PASS` | Contrasena | `postgres` |
| `DB_SCHEMA` | Esquema dedicado | `sti` |
| `DATABASE_URL` | URL completa para Prisma | derivada de las anteriores |
| `DB_HOST_PORT` | Puerto expuesto en host para MCP/psql | `5433` |
| `APP_PORT` | Puerto HTTP del API | `3000` |
| `NODE_ENV` | `development` o `production` | `development` |
| `ALLOWED_ORIGINS` | CORS (lista separada por coma) | `http://localhost:3001,http://localhost:5173,http://localhost:8080` |
| `ACCESS_ENABLED` | Activa el gate de acceso | `false` |
| `ACCESS_TOKEN` | Token del gate | requerido si `ACCESS_ENABLED=true` |
| `ACCESS_SESSION_HOURS` | Duracion de la cookie de sesion | `2` |
| `OLLAMA_URL` | Endpoint interno de Ollama | `http://hermes:11434` |
| `LLM_MODEL` | Modelo a usar | `qwen2.5:7b-instruct` |
| `LLM_TIMEOUT_MS` | Timeout de llamadas al LLM | `30000` |
| `LLM_TEMPERATURE` | Temperatura | `0.2` |

> `OLLAMA_URL` debe apuntar a `hermes` (nombre del servicio en el compose), no a `ollama`. El servicio se renombro para evitar colision con otros stacks de Ollama en la misma maquina.

## Base de datos

### Esquema `sti`

Todas las tablas viven en el esquema `sti`, no en `public`. El script `migrations/01_init_schema.sql` crea el esquema y todas las tablas, y `02_seed_catalogs.sql` siembra los catalogos iniciales. Ambos se ejecutan automaticamente por el entrypoint de Postgres en el primer arranque (montados en `/docker-entrypoint-initdb.d/`).

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

Postgres expone el puerto `5433` del host. El puerto interno (`5432`) queda para que el resto de contenedores use el nombre `atlas`.

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

Los scripts viven en `../scripts/`. Desde la raiz del monorepo:

```bash
./scripts/01_start.sh server    # levanta solo el backend
./scripts/04_logs.sh sti-apollo # sigue logs de la API
./scripts/07_status.sh          # estado + healthchecks
```

## Arranque manual desde `server/`

Si prefieres usar docker compose directamente:

```bash
docker compose up -d --build --remove-orphans
docker compose logs -f apollo
docker compose down
docker compose down -v          # ademas borra DB y modelo
```

## Verificacion rapida

```bash
curl http://localhost:3000/healthz
```

Respuesta esperada:

```json
{ "status": "ok", "service": "study-task-insights-api", ... }
```

## Endpoints principales

| Ruta | Proposito |
| --- | --- |
| `/healthz` | Healthcheck publico (no pasa por `accessGate`) |
| `/gate/login`, `/gate/logout` | Endpoints de autenticacion |
| `/api/v1/catalogs` | Catalogos (terms, statuses, priorities, types, tags) |
| `/api/v1/tasks` | CRUD de tareas |
| `/api/v1/task-tag-assignments` | Relacion N:M tareas-tags |
| `/api/v1/study-sessions` | Sesiones de estudio |
| `/api/v1/weekly-productivity` | Vista materializada de productividad semanal |
| `/api/v1/import/batch` | Ingesta por lotes |
| `/api/v1/llm` | Interaccion con el LLM |

## Desarrollo local (sin Docker)

```bash
pnpm install
pnpm exec prisma generate
pnpm dev
```

Requiere una instancia de PostgreSQL con el esquema `sti` accesible y `OLLAMA_URL` apuntando a un Ollama disponible.
