# Setup del proyecto

Guia de cero a sistema corriendo. Cubre las dos rutas habituales: solo en `localhost` y con Cloudflare Tunnel para exposicion publica. El stack es Docker-first; las opciones nativas se mencionan al final.

## Requisitos del host

| Componente | Version | Cuando |
| --- | --- | --- |
| Docker Engine | 24+ | Siempre |
| Docker Compose plugin | 2.20+ | Siempre |
| Node.js | 22.x | Solo desarrollo nativo (sin contenedor) |
| pnpm | 10+ | Solo desarrollo nativo |
| `cloudflared` | latest | Solo para tunel publico (lo instala `08_tunnel_init.sh` si falta) |
| `nvidia-container-toolkit` + driver NVIDIA | latest | Solo perfil GPU |
| Cuenta en Cloudflare con dominio gestionado | — | Solo tunel publico |

Plataforma de referencia: Windows 11 + WSL2 (Ubuntu). En WSL el driver NVIDIA va en Windows; en la distro va el `nvidia-container-toolkit` y el runtime registrado en Docker.

## Estructura del repo

```bash
study-task-insights/
|-- client/                  # SPA React + Vite + Nginx (sti-nike)
|-- server/                  # API Express + Prisma + Postgres + Ollama (atlas/hermes/prometheus/apollo)
|-- scripts/                 # ciclo de vida del stack y del tunel
|-- docs/                    # esta carpeta
|-- Makefile                 # atajos a los scripts
|-- .mcp.json                # MCP servers locales (postgres, github)
`-- README.md
```

## Variables de entorno

Cada subproyecto tiene su propio `.env.example`. La regla es: copiar y ajustar antes del primer arranque.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Detalles:

- Backend: `server/README.md` (seccion Variables de entorno).
- Frontend: `client/README.md` (seccion Variables de entorno).

Variables que cambian segun escenario:

| Variable | Localhost | Cloudflare Tunnel |
| --- | --- | --- |
| `ALLOWED_ORIGINS` (server) | `http://localhost:5173,http://localhost:8080` | anade `https://sti-web.josuesay.com` |
| `COOKIE_CROSS_SITE` (server) | `false` | `true` |
| `ACCESS_ENABLED` (server) | `false` para desarrollo | `true` recomendado para publico |
| `VITE_BACKEND_BASE_URL` (client) | `http://localhost:3000` | `https://sti-api.josuesay.com` |

Cualquier cambio en las `VITE_*` requiere rebuild del frontend (`docker compose up -d --build` en `client/`).

## Flujo A. Levantar solo en localhost (CPU)

Desde la raiz del repo:

```bash
make start
# equivalente: ./scripts/01_start.sh
```

Esto levanta `atlas`, `hermes`, `prometheus` (descarga el modelo si falta) y `apollo`. El frontend se levanta aparte:

```bash
./scripts/01_start.sh client
```

Verificacion:

```bash
make status
curl http://localhost:3000/healthz
```

Acceso: SPA en `http://localhost:8080`, API en `http://localhost:3000`.

## Flujo B. Levantar con perfil GPU

Requisitos previos: driver NVIDIA en Windows, `nvidia-container-toolkit` en WSL, runtime `nvidia` registrado (`docker info | grep -i runtime` debe listarlo).

```bash
./scripts/01_start.sh --gpu
# o solo backend en GPU:
./scripts/01_start.sh server --gpu
```

`01_start.sh` baja el perfil contrario antes del `up`, asi que no quedan `sti-hermes` y `sti-hermes-gpu` activos a la vez (compartirian `/root/.ollama`). Verificacion dentro del contenedor:

```bash
docker exec sti-hermes-gpu nvidia-smi
```

Mas detalle en `05_cloudflare-and-gpu.md` (seccion Perfiles CPU y GPU para Ollama).

## Flujo C. Exponer publicamente con Cloudflare Tunnel

Solo la primera vez por maquina:

```bash
make tunnel-init
# = ./scripts/08_tunnel_init.sh
```

El script:

1. Instala `cloudflared` si falta.
2. Abre el navegador para `cloudflared tunnel login` (selecciona el dominio gestionado en CF).
3. Crea el tunel `sti-dev` si no existe.
4. Escribe `~/.cloudflared/sti-dev.yml` con los hostnames `sti-api.josuesay.com` y `sti-web.josuesay.com`.
5. Registra DNS (`cloudflared tunnel route dns ... --overwrite-dns`).
6. Valida el ingress (`cloudflared tunnel ingress validate`).

**Nunca** toca `~/.cloudflared/config.yml`. Eso permite convivir con otros proyectos que usan ese archivo por defecto (ver `05_cloudflare-and-gpu.md`).

Verificacion:

```bash
make cf-verify
# = ./scripts/cloudflare_verify.sh
```

Levantar el tunel (foreground, Ctrl+C lo detiene):

```bash
make tunnel-up
# = ./scripts/09_tunnel_up.sh
```

Diagnostico DNS y propagacion:

```bash
make dns-check
# = ./scripts/10_dns_check.sh
```

Antes de levantar el tunel, asegurate de:

- Tener el stack Docker corriendo (`make start` o `make start -- --gpu`).
- Haber actualizado `server/.env` con `ALLOWED_ORIGINS` y `COOKIE_CROSS_SITE=true`.
- Haber reconstruido el frontend con `VITE_BACKEND_BASE_URL=https://sti-api.josuesay.com`.

Para desmontar todo el setup CF (borra tunel, DNS, config, credenciales):

```bash
make tunnel-down
# = ./scripts/tunnel_down.sh
```

## Inventario de scripts

Todos viven en `scripts/`. Cada uno tiene su contraparte como target en `Makefile`.

| Script | Make target | Proposito |
| --- | --- | --- |
| `01_start.sh` | `make start` | Levanta el stack Docker (perfil CPU por defecto, `--gpu` para GPU). Acepta `client` o `server` para subset |
| `02_stop.sh` | `make stop` | Detiene el stack |
| `03_restart.sh` | `make restart` | Reinicia el stack |
| `04_logs.sh` | `make logs` | Tail de logs |
| `05_shell.sh` | `make shell` | Shell interactiva en un contenedor |
| `06_install_model.sh` | `make install-model` | Fuerza `ollama pull` del modelo declarado en `LLM_MODEL` |
| `07_status.sh` | `make status` | Estado y healthchecks |
| `08_tunnel_init.sh` | `make tunnel-init` | Bootstrap del Cloudflare Tunnel (idempotente) |
| `09_tunnel_up.sh` | `make tunnel-up` | Levanta el tunel |
| `10_dns_check.sh` | `make dns-check` | Diagnostico DNS y HTTP publico |
| `cloudflare_verify.sh` | `make cf-verify` | Verifica setup CF (cloudflared, cert, tunel, config, ingress, DNS) |
| `tunnel_down.sh` | `make tunnel-down` | Desmonta tunel + DNS + config + credenciales |
| `lib.sh` | — | Helpers internos (colores, asserts, parsing) |

## MCP locales

`.mcp.json` declara dos servidores que ayudan a desarrollar contra este repo:

- `postgres-study-task-insights` — consultas SQL contra la base local (`localhost:5433`, schema `sti`).
- `github-syntel-labs` — operaciones GitHub sobre el monorepo.

Setup completo en sus respectivas carpetas; `.mcp.json` ya contiene los binarios y argumentos esperados.

## Comprobacion final

Con todo arriba (CPU o GPU + tunel opcional):

```bash
make status
curl http://localhost:3000/healthz
curl https://sti-api.josuesay.com/healthz   # solo si CF esta activo
```

Si el gate esta encendido (`ACCESS_ENABLED=true`):

```bash
curl -X POST http://localhost:3000/gate/login \
  -H "Content-Type: application/json" \
  -d '{"token":"<ACCESS_TOKEN>"}'
```

Y la SPA en `http://localhost:8080` (o `https://sti-web.josuesay.com`) debe poder loguear y consumir endpoints `/api/v1/...`.

## Desarrollo local sin Docker

Solo si necesitas iterar fuera del contenedor (`pnpm dev`):

```bash
# backend
cd server
pnpm install
pnpm exec prisma generate
pnpm dev      # asume Postgres + Ollama accesibles segun .env

# frontend
cd ../client
pnpm install
pnpm dev      # http://localhost:3001 por defecto
```

No hay tests automatizados todavia, asi que la verificacion es manual contra `/healthz` y la SPA.
