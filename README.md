# Study Task Insights 🧠

## 🚀 Descripción general

**Study Task Insights** es una plataforma completa para analizar hábitos de estudio y productividad académica.
Está compuesta por dos módulos principales:

| Módulo                                            | Descripción                                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 🧩 **Backend (`server/`)**                        | API en Node.js + Express + Prisma + PostgreSQL con integración LLM (Ollama + Qwen2.5-7B-Instruct).             |
| 🧭 **Frontend (`study-task-insights-frontend/`)** | SPA construida con React + Vite + Material UI para gestionar tareas, visualizar métricas y chatear con el LLM. |

Ambos proyectos están **contenedorizados con Docker**.

## ⚙️ Requisitos previos

Asegúrate de tener instalado:

| Componente        | Versión mínima recomendada | Descripción                                 |
| ----------------- | -------------------------- | ------------------------------------------- |
| 🐳 Docker         | `>=24.x`                   | Necesario para ejecutar backend y frontend. |
| 🧩 Docker Compose | `>=2.20.x`                 | Orquestación de servicios.                  |

Verifica la instalación:

```bash
docker -v
docker compose version
```

## 📂 Estructura general del repositorio

```bash
study-task-insights/
├── server/                     # Backend (API + LLM + PostgreSQL)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
│
├── study-task-insights-frontend/  # Frontend (React + Vite + MUI)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
│
└── docs/                        # Documentación adicional (opcional)
```

## 🐳 Ejecución completa del entorno

### 1️⃣ Levantar el **backend**

Desde la carpeta `server/`:

```bash
cd server
docker compose up -d --build
docker compose exec ollama ollama pull qwen2.5:7b-instruct
docker compose exec ollama ollama list
```

* Inicia PostgreSQL, la API y el motor Ollama con el modelo Qwen2.5.
* Verifica logs y estado de los servicios:

```bash
docker compose logs -f db
docker compose logs -f ollama-init
docker compose logs -f ollama
docker compose logs -f api
```

### 2️⃣ Levantar el **frontend**

Desde la carpeta `study-task-insights-frontend/`:

```bash
cd client
docker compose up -d --build
```

* Verifica logs y estado de los servicios:

```bash
docker compose logs -f web
```

* Compila la aplicación React y la sirve con Nginx.
* Accede en tu navegador a:

👉 **[http://localhost:8080](http://localhost:8080)**

## 🧱 Flujo general

1. **Backend** expone la API en `http://localhost:3000`.
2. **Frontend** consume esa API desde `http://localhost:8080`.
3. Ambos pueden ejecutarse en redes Docker compartidas si se desea un entorno más integrado.

## 📘 Documentación individual

| Proyecto              | Enlace                                                                           |
| --------------------- | -------------------------------------------------------------------------------- |
| 🧩 **Backend (API)**  | [server/README.md](server/README.md)                                             |
| 🧭 **Frontend (SPA)** | [study-task-insights-frontend/README.md](study-task-insights-frontend/README.md) |

## 🧹 Limpieza y mantenimiento

```bash
# Detener todos los contenedores
docker compose down

# Eliminar volúmenes persistentes (base de datos, cache)
docker compose down -v
```
