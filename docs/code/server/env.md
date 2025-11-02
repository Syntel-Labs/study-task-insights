# Configuración de Entorno

## Introducción

El archivo `.env.example` define todas las variables necesarias para ejecutar el backend de **Study Task Insights** en modo local o producción.
Estas variables se copian a un archivo real `.env` para uso interno del contenedor y nunca deben incluirse en commits con valores sensibles.

## Creación del archivo `.env`

Antes de levantar el entorno, crea tu `.env` basado en el ejemplo:

```bash
cp .env.example .env
```

Luego edita `.env` y ajusta los valores según tu entorno (base de datos, puerto, modelo LLM, etc.).

## Variables de entorno

### 1. Base de datos PostgreSQL

Variables utilizadas por Prisma y Docker para la conexión a PostgreSQL.

| Variable       | Descripción                                                                           |
| -------------- | ------------------------------------------------------------------------------------- |
| `DB_HOST`      | Host o servicio Docker de la base de datos (por defecto `db`).                        |
| `DB_PORT`      | Puerto de PostgreSQL, típicamente `5432`.                                             |
| `DB_NAME`      | Nombre de la base de datos.                                                           |
| `DB_USER`      | Usuario con permisos de lectura y escritura.                                          |
| `DB_PASS`      | Contraseña del usuario configurado.                                                   |
| `DB_SCHEMA`    | Esquema de trabajo (`public` o personalizado).                                        |
| `DATABASE_URL` | URL completa que Prisma usa para conectar; se construye con las variables anteriores. |

> Ejemplo:
> `postgresql://user:password@db:5432/study_db?schema=public`

### 2. Aplicación (Express)

| Variable   | Descripción                                                                             |
| ---------- | --------------------------------------------------------------------------------------- |
| `APP_PORT` | Puerto interno del servidor Express. Se expone al host por Docker (`3000` por defecto). |

### 3. Ambiente

| Variable   | Descripción                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV` | Define el modo de ejecución (`development` o `production`). Afecta logs, cookies seguras, y comportamiento general del entorno. |

### 4. Gate de acceso (autenticación mínima por cookie)

| Variable               | Descripción                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `ACCESS_ENABLED`       | Activa o desactiva el middleware de autenticación (`true` o `false`).    |
| `ACCESS_TOKEN`         | Clave privada usada para firmar sesiones y validar `/gate/login`.        |
| `ACCESS_SESSION_HOURS` | Duración de la sesión (en horas) almacenada en la cookie `stia_session`. |

> El flujo se activa con `POST /gate/login` enviando `{"secret": "<ACCESS_TOKEN>"}`.
> Genera una cookie firmada y valida automáticamente el acceso a todos los endpoints.

### 5. LLM (Ollama)

Configuración para el servicio de modelo de lenguaje embebido (`ollama`), usado por `llmService.js`.

| Variable          | Descripción                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| `OLLAMA_URL`      | URL interna del contenedor Ollama. En Docker siempre es `http://ollama:11434`.     |
| `LLM_MODEL`       | Nombre del modelo a utilizar (ej. `qwen2.5:7b-instruct`).                          |
| `LLM_TIMEOUT_MS`  | Tiempo máximo de espera en milisegundos para una respuesta del modelo.             |
| `LLM_TEMPERATURE` | Controla la variabilidad del texto generado (0 = determinista, >0 = más creativo). |

> Todas estas variables son leídas directamente por el backend; si alguna falta, el servicio LLM lanzará error al inicializar.
