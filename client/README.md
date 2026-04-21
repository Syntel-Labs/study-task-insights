# Study Task Insights - Frontend

SPA en React + Vite + Material UI. Consume la API del backend para gestionar tareas, visualizar metricas de productividad y conversar con el LLM local. Servida por Nginx en el contenedor `sti-nike`.

## Requisitos

| Componente | Version | Necesario |
| --- | --- | --- |
| Docker Engine | 24+ | Si |
| Docker Compose plugin | 2.20+ | Si |
| Node.js | 22.x | Solo para desarrollo local sin Docker |
| pnpm | 10+ | Solo para desarrollo local sin Docker |

## Servicio del compose

Definido en `docker-compose.yml`.

| Servicio | Contenedor | Imagen | Rol | Puerto host |
| --- | --- | --- | --- | --- |
| `nike` | `sti-nike` | build local (Nginx 1.27) | SPA compilada | `8080` |

El Dockerfile usa multi-stage: builder (Node 22 + pnpm + Vite) y runner (Nginx alpine). Las variables `VITE_*` se inyectan en build-time; modificarlas requiere rebuild.

## Variables de entorno

Copiar y ajustar:

```bash
cp .env.example .env
```

| Variable | Proposito | Default |
| --- | --- | --- |
| `VITE_BACKEND_BASE_URL` | Origen del backend visto desde el navegador | `http://localhost:3000` |
| `VITE_API_BASE_PATH` | Prefijo de rutas API | `/api/v1` |
| `VITE_HEALTH_PATH` | Ruta del healthcheck | `/healthz` |
| `VITE_GATE_BASE_PATH` | Ruta del gate | `/gate` |
| `VITE_SESSION_HOURS` | Duracion logica de la sesion | `2` |
| `VITE_SESSION_REVALIDATE_MARGIN_MIN` | Margen antes de revalidar | `5` |

> `VITE_API_BASE_PATH` debe coincidir con el prefijo real del backend (`/api/v1`). Usar `/api` sin version rompe todas las llamadas.

> Como se inyectan en build, cualquier cambio obliga a reconstruir: `docker compose up -d --build`.

## Arranque desde la raiz

Los scripts viven en `../scripts/`. Desde la raiz del monorepo:

```bash
./scripts/01_start.sh client    # levanta solo el frontend
./scripts/04_logs.sh sti-nike   # sigue logs de nginx
```

## Arranque manual desde `client/`

```bash
docker compose up -d --build
docker compose logs -f nike
docker compose down
```

Acceso:

- SPA: `http://localhost:8080`

## Integracion con el backend

El frontend corre en el navegador del usuario y llama al backend directamente; ambos contenedores no comparten red (dos compose separados). Por eso el frontend usa siempre `http://localhost:3000`, no `http://apollo:3000`.

Si se quisiera comunicacion via red docker interna (SSR, reverse proxy), habria que:

- Crear una red externa compartida en ambos compose
- Cambiar `VITE_BACKEND_BASE_URL` a `http://apollo:3000`

No se hace por defecto porque complica el proxy y no aporta en una SPA.

## Funcionalidades principales

| Modulo | Descripcion |
| --- | --- |
| Autenticacion | Gate de acceso con cookie persistente |
| Dashboard | Metricas de productividad y progreso semanal |
| Gestion de tareas | CRUD con filtros y paginacion |
| Chat LLM | Interaccion con el modelo local via el backend |

## Estructura

```bash
client/
|-- src/
|   |-- pages/              # Login, Dashboard, Tasks, LLM Chat
|   |-- components/         # reutilizables (forms, tables, dialogs)
|   |-- hooks/              # useApi, filtros, mutaciones
|   |-- context/            # AuthContext
|   |-- styles/             # SCSS modules
|   `-- utils/              # config runtime, helpers
|-- public/                 # estaticos
|-- docker/nginx.conf       # config SPA (fallback a index.html)
|-- Dockerfile
|-- docker-compose.yml
`-- vite.config.js
```

## Desarrollo local (sin Docker)

```bash
pnpm install
pnpm dev
```

Por defecto Vite arranca en `http://localhost:3001` (ajustable en `vite.config.js`). El backend debe estar corriendo en `http://localhost:3000`.

## Comandos utiles

```bash
pnpm build                      # genera dist/ de produccion
pnpm preview                    # preview local del build
docker compose up -d --build    # rebuild del contenedor
docker compose down             # detener
```
