# Configuracion de entorno

## Introduccion

`.env.example` (en `server/`) define las variables necesarias para ejecutar el backend. El archivo real `.env` se obtiene copiando el ejemplo y nunca se commitea con valores reales. El compose y los scripts esperan que `.env` exista; `scripts/lib.sh` aborta el arranque si falta.

## Creacion

```bash
cp server/.env.example server/.env
```

Luego ajustar los valores segun el entorno.

## Variables

### Base de datos

| Variable | Proposito |
| --- | --- |
| `DB_HOST` | Host de PostgreSQL. Dentro del compose es `atlas`; nativo es `localhost` |
| `DB_PORT` | Puerto interno de PostgreSQL (`5432`) |
| `DB_NAME` | Nombre de la base (`study_task_insights`) |
| `DB_USER` | Usuario (`postgres` por defecto) |
| `DB_PASS` | Contrasena |
| `DB_SCHEMA` | Esquema dedicado (`sti`). Prisma lo usa via `DATABASE_URL?schema=sti` |
| `DATABASE_URL` | URL completa para Prisma. Construida a partir de las anteriores |
| `DB_HOST_PORT` | Puerto expuesto en el host (default `5433`). Usado por psql, MCP y pgAdmin desde fuera del compose |
| `SEED_DEMO` | `true`/`false`. Si `true`, `migrations/00_setup_db.sh` ejecuta tambien `03_seed_demo.sql` en el primer arranque |

Ejemplo de `DATABASE_URL`:

```bash
postgresql://postgres:postgres@atlas:5432/study_task_insights?schema=sti
```

### Aplicacion (Express)

| Variable | Proposito |
| --- | --- |
| `APP_PORT` | Puerto interno del API (`3000`). Se expone al host con el mismo puerto |
| `NODE_ENV` | `development` o `production`. Afecta logs y flags de cookie |
| `ALLOWED_ORIGINS` | Whitelist CORS separada por coma. Sin coincidencia, la peticion es rechazada |

`ALLOWED_ORIGINS` para escenario local (`http://localhost:5173,http://localhost:8080`). Para Cloudflare Tunnel anade `https://sti-web.josuesay.com`.

### Gate de acceso

| Variable | Proposito |
| --- | --- |
| `ACCESS_ENABLED` | `true`/`false`. Si `false`, el middleware `accessGate` es passthrough |
| `ACCESS_TOKEN` | Token compartido para `POST /gate/login` y para autenticacion server-to-server via header `x-access-token` |
| `ACCESS_SESSION_HOURS` | Duracion de la cookie `stia_session` (default `2`) |
| `COOKIE_CROSS_SITE` | `true`/`false`. Si `true`, la cookie sale con `SameSite=None; Secure` (necesario cuando frontend y backend estan en hostnames distintos detras de Cloudflare) |

El flujo se inicia con `POST /gate/login` enviando `{"token": "<ACCESS_TOKEN>"}`. La respuesta emite la cookie firmada `stia_session`. Las peticiones siguientes a `/api/v1/*` la envian via `withCredentials`.

### LLM (Ollama)

| Variable | Proposito |
| --- | --- |
| `OLLAMA_URL` | Endpoint interno (`http://hermes:11434` en compose; `hermes` es alias valido tambien en perfil GPU) |
| `LLM_MODEL` | Modelo a usar; `prometheus` lo descarga si falta. Default actual del repo: `llama3.1:8b-instruct-q4_K_M` |
| `LLM_TIMEOUT_MS` | Timeout por llamada al LLM (default `30000`) |
| `LLM_TEMPERATURE` | Temperatura (default `0.2`) |
| `OLLAMA_KEEP_ALIVE` | TTL del modelo cargado en VRAM/RAM, en segundos. `-1` = infinito (default) |
| `OLLAMA_NUM_PARALLEL` | Peticiones concurrentes por modelo cargado (default `1`) |

`OLLAMA_KEEP_ALIVE=-1` mantiene el modelo cargado entre peticiones, evitando el costo de recarga. `OLLAMA_NUM_PARALLEL=1` es prudente para una GPU domestica (subirlo causa thrashing si el modelo no cabe replicado).

## Variables que el codigo lee

Mapa rapido de quien consume que:

| Variable | Consumidor |
| --- | --- |
| `DATABASE_URL` | `prisma/schema.prisma` (datasource), Prisma Client |
| `ALLOWED_ORIGINS`, `NODE_ENV` | `src/app.js` |
| `ACCESS_ENABLED`, `ACCESS_TOKEN`, `ACCESS_SESSION_HOURS`, `COOKIE_CROSS_SITE`, `NODE_ENV` | `src/middlewares/accessGate.js`, `src/controllers/gateController.js` |
| `OLLAMA_URL`, `LLM_MODEL`, `LLM_TIMEOUT_MS`, `LLM_TEMPERATURE` | `src/services/llmService.js` |
| `APP_PORT` | `src/server.js` |

`OLLAMA_KEEP_ALIVE` y `OLLAMA_NUM_PARALLEL` los consume el contenedor `hermes` directamente (variables de entorno de Ollama), no el codigo del backend.

## Buenas practicas

- No commitear `.env`. Commitear solo `.env.example` con valores neutros.
- Cuando agregues una variable nueva, sumala en `.env.example` con un valor por defecto sensato y documentala aqui y en `server/README.md`.
- Si el codigo requiere una variable obligatoriamente, validarla al boot (fail fast) en lugar de descubrirlo en runtime.
