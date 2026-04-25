# Documentacion de Study Task Insights

Indice de la carpeta `docs/`. Cada archivo documenta un area distinta del sistema; este README solo orienta donde mirar segun la pregunta.

## Setup y operacion

- `01_project-setup.md` — Levantar el stack de cero (Docker, env, perfiles CPU/GPU, Cloudflare Tunnel opcional, scripts y `Makefile`).
- `05_cloudflare-and-gpu.md` — Cloudflare Tunnel aislado por proyecto y perfiles `cpu`/`gpu` para Ollama. Cubre la convivencia con otros tuneles del host y la guarda anti-pisada de `~/.cloudflared/config.yml`.

## Modelo de datos

- `00_data-model/data-model_v1.md` — Esquema `sti`, tablas de catalogos y entidades de negocio, reglas e invariantes.

## Backend (codigo)

Bajo `code/server/` cada subcarpeta refleja la estructura de `server/src/`. Cada README local detalla el modulo.

- `code/server/server.md` — punto de entrada (boot del servidor HTTP).
- `code/server/app.md` — middlewares globales (helmet, CORS, trust proxy, gate, logger, error handler) y montaje de rutas.
- `code/server/env.md` — variables de entorno reales que el codigo lee.
- `code/server/docker.md` — composicion de contenedores (atlas, hermes, hermes-gpu, prometheus, apollo).
- `code/server/config/` — `db.md`, `prismaClient.md`.
- `code/server/middlewares/` — `accessGate.md`, `errorHandler.md`, `logger.md`.
- `code/server/controllers/` — capa HTTP por dominio.
- `code/server/services/` — logica de negocio por dominio.
- `code/server/repositories/` — acceso a datos via Prisma por dominio.
- `code/server/routes/` — rutas Express por dominio.
- `code/server/utils/response.md` — contrato uniforme de respuestas (`ok`, `created`, `noContent`, errores) y helpers de paginacion.

## Frontend (codigo)

Bajo `code/client/`. Cubre `pages`, `components`, `context`, `hooks`, `lib`, `utils`, `i18n` y la integracion con el backend.

## ORM

- `04_prisma-orm-guide.md` — Como esta usado Prisma en este repo: multi-schema, migrations, Prisma Client en repositorios.

## Convenciones

- Lenguaje: espanol.
- Markdown sin emojis.
- Listados con `-`, nunca `*`.
- Solo un `#` por archivo (titulo principal).
- Cuando un documento es derivado u opcional, enlazar al recurso oficial al inicio.
