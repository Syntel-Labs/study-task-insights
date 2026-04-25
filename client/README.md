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

`utils/config.js` valida estas variables con `requireEnv` al cargar el bundle: cualquier ausencia detiene el arranque con un error claro en la consola del navegador.

> `VITE_API_BASE_PATH` debe coincidir con el prefijo real del backend (`/api/v1`). Usar `/api` sin version rompe todas las llamadas.

> Como se inyectan en build, cualquier cambio obliga a reconstruir: `docker compose up -d --build`.

## Escenarios de despliegue

### A. Local todo en localhost

```env
VITE_BACKEND_BASE_URL=http://localhost:3000
VITE_API_BASE_PATH=/api/v1
VITE_GATE_BASE_PATH=/gate
```

SPA en `http://localhost:8080`, API en `http://localhost:3000`. Mismo dominio padre (`localhost`), no hace falta nada cross-site.

### B. Cloudflare Tunnel (frontend y backend en hostnames distintos)

Cuando el tunel de STI expone:

- `https://sti-web.josuesay.com` -> contenedor `nike` (puerto 8080)
- `https://sti-api.josuesay.com` -> contenedor `apollo` (puerto 3000)

la SPA debe apuntar al hostname publico del API:

```env
VITE_BACKEND_BASE_URL=https://sti-api.josuesay.com
VITE_API_BASE_PATH=/api/v1
VITE_GATE_BASE_PATH=/gate
```

Y el backend debe quedar configurado para cookies cross-site (`COOKIE_CROSS_SITE=true`, `ALLOWED_ORIGINS` incluye `https://sti-web.josuesay.com`, `app.set("trust proxy", 1)`). Detalles en `../docs/05_cloudflare-and-gpu.md`.

Cualquier cambio en `.env` requiere `docker compose up -d --build` para que Vite reinyecte los valores en el bundle.

## Arranque desde la raiz

Los scripts viven en `../scripts/`. Desde la raiz del monorepo:

```bash
./scripts/01_start.sh client    # levanta solo el frontend
./scripts/04_logs.sh sti-nike   # sigue logs de nginx
```

O usando `make` desde la raiz para ciclos completos del stack (cliente + servidor + LLM).

## Arranque manual desde `client/`

```bash
docker compose up -d --build
docker compose logs -f nike
docker compose down
```

Acceso:

- SPA: `http://localhost:8080`

## Integracion con el backend

El frontend corre en el navegador del usuario y llama al backend directamente; ambos contenedores no comparten red (dos compose separados). Por eso el frontend usa siempre `http://localhost:3000` o el hostname publico del tunel, nunca `http://apollo:3000`.

Si se quisiera comunicacion via red docker interna (SSR, reverse proxy), habria que:

- Crear una red externa compartida en ambos compose
- Cambiar `VITE_BACKEND_BASE_URL` a `http://apollo:3000`

No se hace por defecto porque complica el proxy y no aporta en una SPA.

## Funcionalidades principales

| Modulo | Descripcion |
| --- | --- |
| Autenticacion | Gate de acceso con cookie persistente (`stia_session`) |
| Dashboard | Metricas de productividad y progreso semanal |
| Gestion de tareas | CRUD con filtros y paginacion (hooks dedicados de filtros y mutaciones) |
| Chat LLM | Interaccion con el modelo local via el backend |
| i18n | Etiquetas con `react-i18next` |

## Estructura

```bash
client/
|-- src/
|   |-- pages/              # Login, Dashboard, Tasks, LLM Chat
|   |-- components/         # reutilizables (forms, tables, dialogs)
|   |-- context/            # AuthContext
|   |-- hooks/              # api, filtros, mutaciones
|   |-- i18n/               # traducciones
|   |-- lib/                # cliente HTTP centralizado
|   |-- styles/             # SCSS modules
|   |-- types/              # contratos compartidos
|   `-- utils/              # config runtime (apiPaths, session), helpers
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
pnpm lint                       # ESLint sobre src/
docker compose up -d --build    # rebuild del contenedor
docker compose down             # detener
```
