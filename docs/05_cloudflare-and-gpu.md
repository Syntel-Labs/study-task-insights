# Cloudflare Tunnel y perfiles GPU/CPU

Guia de los dos patrones que conviven en el stack de STI: tunel publico
por proyecto (sin pisar a otros) y perfiles `cpu`/`gpu` para el contenedor
Ollama.

## Cloudflare Tunnel aislado por proyecto

### El problema

`cloudflared` lee por defecto `~/.cloudflared/config.yml`. Si mas de un
proyecto en la misma maquina intenta usar ese archivo, el segundo sobrescribe
la config del primero y rompe su tunel.

Ejemplo real: el repo `lead-flow-ai` tiene su tunel `leadflow-dev`
configurado en `~/.cloudflared/config.yml`. Si otro script escribe ahi, el
tunel de lead-flow deja de funcionar.

### Nuestra solucion

Cada proyecto tiene:

- Un nombre de tunel unico (`sti-dev` en este repo).
- Un archivo propio `~/.cloudflared/config-<tunnel-name>.yml`.
- Scripts que se invocan siempre con `cloudflared tunnel --config <file>`
  en vez de depender del `config.yml` por defecto.

Resultado: `leadflow-dev` (archivo por defecto) y `sti-dev` (archivo con
sufijo) pueden correr en paralelo sin conflicto.

### Estructura de archivos

```bash
~/.cloudflared/
  cert.pem                    # certificado de autenticacion (compartido)
  config.yml                  # tunel del proyecto X (no tocar)
  config-sti-dev.yml          # tunel de STI (este repo)
  <uuid-sti>.json             # credenciales del tunel STI
  <uuid-otro>.json            # credenciales de otros proyectos
```

Ejemplo de `config-sti-dev.yml` que genera `08_tunnel_init.sh`:

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

### Scripts

- `scripts/08_tunnel_init.sh`: bootstrap idempotente del tunel STI. Instala
  `cloudflared`, autentica (abre navegador), crea el tunel, registra DNS y
  escribe el config propio. Jamas toca `config.yml`.
- `scripts/09_tunnel_up.sh`: levanta el tunel con
  `cloudflared tunnel --config ~/.cloudflared/config-sti-dev.yml run`.
- `scripts/10_dns_check.sh`: diagnostica NS, CNAME, resolucion local y
  HTTP publico.

### Guarda de seguridad

`scripts/lib.sh` expone `assert_cf_config_safe` que aborta si alguna
ruta termina en `config.yml` o `config.yaml`. Los scripts 08 y 09 la
invocan antes de leer/escribir. Asi es imposible romper el archivo
compartido por un typo.

### Como correr los dos tuneles en paralelo

Terminal A (proyecto vecino, con `config.yml` por defecto):

```bash
cloudflared tunnel run
# o el script del otro proyecto: make tunnel-up
```

Terminal B (STI):

```bash
./scripts/09_tunnel_up.sh
# o manual: cloudflared tunnel --config ~/.cloudflared/config-sti-dev.yml run
```

Cada proceso sirve hostnames distintos y no compiten.

### Lecciones que llevar a otros proyectos

Si tu script genera un tunel:

1. Nunca escribas a `~/.cloudflared/config.yml`. Usa
   `~/.cloudflared/config-<tunnel-name>.yml` y ejecuta con `--config`.
2. Parsea el UUID correctamente. Usa
   `cloudflared tunnel list | awk '$2 == "<name>" { print $1 }'` en vez
   de capturar toda la salida de `cloudflared tunnel create`.
3. Haz `cloudflared ingress validate --config <file>` tras escribir el
   archivo para detectar errores de sintaxis temprano.

## Perfiles CPU y GPU para Ollama

### Por que dos perfiles

El contenedor `sti-hermes` (Ollama) corre por defecto en CPU. Si la maquina
tiene GPU NVIDIA, queremos poder cambiarlo a GPU sin modificar el compose
en disco (para no ensuciar el repo con config local).

La solucion estandar en Compose son los **profiles**: un servicio solo
arranca cuando su perfil esta activo.

### Estructura

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

- **Mismo volumen** `sti_ollama`: los modelos descargados persisten entre
  cambios de perfil. Descargar `qwen2.5:7b-instruct` una vez en CPU y
  sigue disponible al pasar a GPU.
- **Alias de red `hermes`**: `sti-hermes-gpu` responde al hostname
  `hermes` dentro de la red Docker. `apollo` mantiene
  `OLLAMA_URL=http://hermes:11434` en ambos modos.
- **`required: false`** en `depends_on` de `prometheus` y `apollo`:
  Compose no se queja del servicio del perfil inactivo.

### Flag del script

```bash
./scripts/01_start.sh              # CPU (default)
./scripts/01_start.sh --gpu        # GPU (requiere nvidia-container-toolkit)
./scripts/01_start.sh server --gpu # solo backend en GPU
```

El script primero hace `down` de ambos perfiles (por si quedara
`sti-hermes` corriendo al pedir GPU o viceversa) y luego `up` del perfil
elegido.

### Regla de uso importante

Los contenedores `sti-hermes` y `sti-hermes-gpu` **pueden coexistir
levantados** (nadie impide levantar manualmente ambos), pero no hagas
inferencia contra los dos a la vez: comparten el directorio de modelos
(`/root/.ollama`) y escrituras concurrentes al KV cache corrompen el
estado del modelo cargado. En uso normal el script `01_start.sh` siempre
baja la variante contraria antes de levantar la pedida, asi que no
deberia ocurrir.

### Requisitos del host para el perfil GPU

- Driver NVIDIA (en Windows+WSL2: driver Windows, no linux)
- `nvidia-container-toolkit` en la distro WSL
- Docker con runtime `nvidia` registrado (aparece en `docker info`)
- Docker Compose >= 2.3 (para `deploy.resources.reservations.devices`)

Verificacion rapida:

```bash
nvidia-smi                               # en WSL
docker info | grep -i runtime            # debe listar 'nvidia'
docker exec sti-hermes-gpu nvidia-smi    # dentro del contenedor GPU
```
