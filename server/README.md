# Study Task Insights — Backend + Infraestructura 🧠

## 🚀 Introducción

**Study Task Insights** es una API desarrollada con **Node.js (Express)**, **Prisma ORM** y **PostgreSQL**, diseñada para analizar hábitos de estudio y productividad académica.
Incluye integración con un **LLM local (Ollama + Qwen2.5-7B-Instruct)** que genera recomendaciones semanales inteligentes a partir de los datos del usuario.

La API está **contenedorizada con Docker** y documentada en **Postman**:

- [Postman – Study Task Insights API](https://www.postman.com/devprojects-team/study-task-insights/collection/o74ljke/study-task-insights-api)

## ⚙️ Requisitos previos

Antes de iniciar el backend, asegúrate de tener instalado:

| Componente    | Versión mínima recomendada | Descripción                                       |
| ------------- | -------------------------- | ------------------------------------------------- |
| 🧩 Node.js    | `22.x`                     | Entorno de ejecución.                             |
| 📦 pnpm       | `>=9.x`                    | Gestor de dependencias rápido y reproducible.     |
| 🐳 Docker     | `>=24.x`                   | Para orquestar los contenedores de API, DB y LLM. |
| 🐘 PostgreSQL | `16`                       | Base de datos relacional usada por Prisma.        |

> **Nota:** En caso de usar docker unicamente tener instalado docker y docker-compose.

### Asegurar tener entorno preparado

```bash
node -v
pnpm -v
docker -v
```

## 📁 Estructura general del proyecto

```bash
study-task-insights/
├── server/                  # Backend (Express + Prisma + LLM)
│   ├── src/                 # Código fuente principal
│   ├── docker-compose.yml   # Orquestación de contenedores
│   ├── Dockerfile           # Imagen base Node.js 22
│   └── migrations/          # Scripts SQL de inicialización
└── docs/server              # Documentación técnica "backend"
```

## 🧩 Backend (API)

El backend está compuesto por tres servicios dentro de `server/docker-compose.yml`:

| Servicio   | Rol                             | Estado de red |
| ---------- | ------------------------------- | ------------- |
| **db**     | PostgreSQL 16 (persistencia)    | Red interna   |
| **api**    | Express + Prisma + lógica LLM   | Puerto xxxx   |
| **ollama** | Motor LLM (Qwen2.5-7B-Instruct) | Red interna   |

El contenedor `ollama-init` descarga el modelo de forma automática al inicio.
Una vez completado, la API puede comunicarse con el modelo vía `http://ollama:11434`.

## 🧱 Configuración de entorno

Copia el archivo de entorno base:

```bash
cd server
cp .env.example .env
```

Edita los valores en `.env` según tu entorno local o productivo, revisa la documentación sobre [variables de entorno](https://github.com/JosueSay/study-task-insights/blob/main/docs/code/server/env.md) para configurarlo.

## 🐳 Ejecución del entorno Docker

Todos los comandos deben ejecutarse desde la carpeta `server/`. Este flujo permite levantar el entorno completo (PostgreSQL + API + LLM).

### Ciclo de ejecución completo

```bash
# 1️⃣ Detener y eliminar todos los contenedores y volúmenes persistentes
docker compose down -v

# 2️⃣ Construir y levantar los contenedores
docker compose up -d

# 3️⃣ Descargar y verificar el modelo de Ollama (solo la primera vez)
docker compose exec ollama ollama pull qwen2.5:7b-instruct
docker compose exec ollama ollama list

# 4️⃣ Verificar logs de inicialización y estado
docker compose logs -f db
docker compose logs -f ollama-init
docker compose logs -f ollama
docker compose logs -f api
```

### Administración de contenedores

```bash
# Reiniciar un contenedor específico
docker compose restart api
docker compose restart ollama

# Eliminar contenedores específicos (manteniendo la red y los volúmenes)
docker compose rm -f ollama ollama-init api
```

### Operaciones dentro de los contenedores

```bash
# Ingresar al shell del contenedor de la API
docker compose exec api sh

# Listar modelos disponibles en Ollama
docker compose exec ollama ollama list

# Descargar manualmente un modelo (si fuera necesario)
docker compose exec ollama ollama pull qwen2.5:7b-instruct
```

### Finalizar ejecución

```bash
# Detener contenedor
docker compose stop

# Volver a encenderlos
docker compose start
```
