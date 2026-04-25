# Cloudflare Tunnel y perfiles GPU/CPU

Documenta los dos patrones que conviven en el stack de STI: tunel publico aislado por proyecto y perfiles `cpu`/`gpu` para el contenedor Ollama.

## Cloudflare Tunnel aislado por proyecto

### El problema

`cloudflared` lee por defecto `~/.cloudflared/config.yml`. Si dos proyectos en la misma maquina quieren escribir ahi, el segundo pisa la config del primero y rompe su tunel.

Ejemplo real: el repo `lead-flow-ai` ya tiene su tunel `leadflow-dev` configurado en `~/.cloudflared/config.yml`. Si otro script escribiera en ese archivo, ese tunel deja de funcionar.

### La solucion en este repo

Cada proyecto tiene:

- Un nombre de tunel unico (`sti-dev` aqui).
- Un archivo propio `~/.cloudflared/<tunnel-name>.yml` (sin prefijo `config-`, naming directo por nombre del tunel).
- Scripts que invocan siempre `cloudflared tunnel --config <file>` en vez de depender del `config.yml` por defecto.

Resultado: `leadflow-dev` (en `config.yml` por defecto) y `sti-dev` (en `sti-dev.yml`) pueden correr en paralelo sin conflicto.

### Estructura de archivos

```bash
~/.cloudflared/
  cert.pem                    # certificado de autenticacion (compartido entre tuneles)
  config.yml                  # tunel del proyecto X (no tocar)
  sti-dev.yml                 # tunel de STI (este repo)
  <uuid-sti>.json             # credenciales del tunel STI
  <uuid-otro>.json            # credenciales de otros proyectos
```

Ejemplo de `sti-dev.yml` que genera `08_tunnel_init.sh`:

```yaml
tunnel: sti-dev
credentials-file: /home/josue/.cloudflared/<uuid>.json

ingress:
  - hostname: sti-api.josuesay.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
  - hostname: sti-web.josuesay.com
    service: http://localhost:8080
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
  - service: http_status:404
```

### Doble interfaz: scripts + Makefile

Cada operacion existe como script (logica) y como target de `Makefile` (atajo). Los targets solo delegan, no agregan logica.

| Operacion | Script | Make target |
| --- | --- | --- |
| Bootstrap del tunel | `scripts/08_tunnel_init.sh` | `make tunnel-init` |
| Levantar el tunel | `scripts/09_tunnel_up.sh` | `make tunnel-up` |
| Diagnostico DNS y HTTP | `scripts/10_dns_check.sh` | `make dns-check` |
| Verificar setup completo | `scripts/cloudflare_verify.sh` | `make cf-verify` |
| Desmontar tunel + DNS + config | `scripts/tunnel_down.sh` | `make tunnel-down` |

### Bootstrap: que hace `tunnel-init`

`08_tunnel_init.sh` es idempotente. En orden:

1. Instala `cloudflared` si falta (en WSL/Debian usa el repo apt oficial).
2. Si no hay `cert.pem`, ejecuta `cloudflared tunnel login` y abre el navegador para autorizar el dominio.
3. Si el tunel `sti-dev` no existe, lo crea con `cloudflared tunnel create sti-dev`.
4. Parsea el UUID del tunel con `cloudflared tunnel list | awk '$2 == "sti-dev" { print $1 }'` (no captura toda la salida del create, que es fragil).
5. Escribe `~/.cloudflared/sti-dev.yml` con el ingress de los dos hostnames.
6. Registra DNS con `cloudflared tunnel route dns sti-dev <hostname> --overwrite-dns` para que la rerunada no falle si el registro ya existia.
7. Valida con `cloudflared tunnel --config ~/.cloudflared/sti-dev.yml ingress validate`.

Jamas escribe en `~/.cloudflared/config.yml`.

### Guarda anti-pisada

`scripts/lib.sh` expone `assert_cf_config_safe` que aborta si alguna ruta termina en `config.yml` o `config.yaml`, normalizando el path antes (expande `~`, resuelve relativos, colapsa `//`). Asi no se puede bypassear con `./config.yml` ni `~/.cloudflared//config.yml`. Los scripts 08, 09 y `tunnel_down` la invocan antes de leer/escribir.

### Que valida `cf-verify`

`scripts/cloudflare_verify.sh` corre seis chequeos en orden y devuelve exit code igual al numero de fallos:

1. `cloudflared` instalado.
2. `cert.pem` presente en `~/.cloudflared/`.
3. Tunel `sti-dev` existe en Cloudflare (`cloudflared tunnel list`).
4. Config per-proyecto presente (`~/.cloudflared/sti-dev.yml`).
5. Ingress YAML valida (`cloudflared tunnel --config ... ingress validate`).
6. Rutas DNS resueltas para cada hostname. Acepta dos formas:
   - CNAME a `*.cfargotunnel.com` (DNS only).
   - Registro A en rangos de Cloudflare anycast (104., 172., 162., 173.) cuando el proxy naranja esta activo.

### Correr dos tuneles en paralelo

Terminal A (proyecto vecino, con `~/.cloudflared/config.yml` por defecto):

```bash
cloudflared tunnel run
# o el script del otro proyecto
```

Terminal B (STI):

```bash
make tunnel-up
# = cloudflared tunnel --config ~/.cloudflared/sti-dev.yml run
```

Cada proceso sirve hostnames distintos y no compiten.

### Desmontar el setup

`make tunnel-down` (`scripts/tunnel_down.sh`) pide confirmacion y luego:

1. Borra los registros DNS asociados al tunel.
2. Elimina el tunel en Cloudflare.
3. Borra `~/.cloudflared/sti-dev.yml` y el `<uuid>.json` correspondiente.

`cert.pem` queda intacto porque otros tuneles del mismo dominio lo necesitan.

### Cookies cross-site (cuando hay dos hostnames)

Cuando el frontend va a `https://sti-web.josuesay.com` y el backend a `https://sti-api.josuesay.com`, el navegador trata la peticion como cross-site. Para que la cookie del gate (`stia_session`) se envie:

- Backend: `COOKIE_CROSS_SITE=true` para que Express emita `SameSite=None; Secure`.
- Backend: `app.set("trust proxy", 1)` en `app.js` para que respete `X-Forwarded-Proto: https` y considere la conexion como segura.
- Backend: `ALLOWED_ORIGINS` debe incluir el origen exacto del frontend publico.
- Frontend: `VITE_BACKEND_BASE_URL=https://sti-api.josuesay.com`, y la SPA llama al API con `credentials: "include"` (ya configurado en `lib/`).

Sin estos tres, el login pasa pero la siguiente peticion sale sin cookie y el gate la rechaza.

### Lecciones reutilizables

Si tu script genera un tunel propio:

1. Nunca escribas a `~/.cloudflared/config.yml`. Usa `~/.cloudflared/<tunnel-name>.yml` y ejecuta con `--config`.
2. Parsea el UUID con `cloudflared tunnel list | awk '$2 == "<name>" { print $1 }'`. Capturar la salida de `create` se rompe entre versiones.
3. Registra DNS con `--overwrite-dns` para que la segunda ejecucion no falle.
4. Valida con `cloudflared tunnel --config <file> ingress validate` antes de levantar.

## Perfiles CPU y GPU para Ollama

### Por que dos perfiles

`sti-hermes` (Ollama) corre en CPU por defecto. Si la maquina tiene GPU NVIDIA, queremos cambiarlo a GPU sin tocar el compose en disco. La solucion estandar son los **profiles** de Compose: un servicio solo arranca cuando su perfil esta activo.

### Estructura del compose

`server/docker-compose.yml`:

```yaml
# Anchor base que ambos servicios heredan.
x-hermes-base: &hermes-base
  image: ollama/ollama:latest
  volumes:
    - sti_ollama:/root/.ollama
  environment:
    - OLLAMA_KEEP_ALIVE=${OLLAMA_KEEP_ALIVE:--1}
    - OLLAMA_NUM_PARALLEL=${OLLAMA_NUM_PARALLEL:-1}
  ...

services:
  hermes:
    <<: *hermes-base
    container_name: sti-hermes
    profiles: ["cpu"]

  hermes-gpu:
    <<: *hermes-base
    container_name: sti-hermes-gpu
    profiles: ["gpu"]
    networks:
      default:
        aliases: [hermes]     # mismo DNS, apollo no cambia su URL
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

Puntos clave:

- **Mismo volumen `sti_ollama`**: los modelos descargados persisten entre cambios de perfil. Descargar `llama3.1:8b-instruct-q4_K_M` una vez en CPU y sigue disponible al pasar a GPU.
- **Alias de red `hermes`**: `sti-hermes-gpu` responde al hostname `hermes` dentro de la red Docker. `apollo` mantiene `OLLAMA_URL=http://hermes:11434` en ambos modos.
- **`required: false`** en `depends_on` de `prometheus` y `apollo`: Compose no se queja del servicio del perfil inactivo.

### Flag del script

```bash
./scripts/01_start.sh              # CPU (default)
./scripts/01_start.sh --gpu        # GPU (requiere nvidia-container-toolkit)
./scripts/01_start.sh server --gpu # solo backend en GPU
```

`01_start.sh` primero hace `down` de ambos perfiles (por si quedara `sti-hermes` corriendo al pedir GPU o viceversa) y luego `up` del perfil elegido.

### Regla de uso importante

`sti-hermes` y `sti-hermes-gpu` **pueden coexistir** levantados (nadie impide levantar manualmente ambos), pero **no hagas inferencia contra los dos a la vez**: comparten `/root/.ollama` y las escrituras concurrentes al KV cache corrompen el estado del modelo cargado. En uso normal `01_start.sh` siempre baja la variante contraria antes de levantar la pedida, asi que no deberia ocurrir.

### Requisitos del host para el perfil GPU

- Driver NVIDIA (en Windows+WSL2: driver Windows, no linux).
- `nvidia-container-toolkit` en la distro WSL.
- Docker con runtime `nvidia` registrado (aparece en `docker info`).
- Docker Compose >= 2.3 (para `deploy.resources.reservations.devices`).

Verificacion rapida:

```bash
nvidia-smi                               # en WSL
docker info | grep -i runtime            # debe listar 'nvidia'
docker exec sti-hermes-gpu nvidia-smi    # dentro del contenedor GPU
```
