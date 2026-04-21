# Study Task Insights 🧠

## 🚀 Descripción general

**Study Task Insights** es una plataforma completa para analizar hábitos de estudio y productividad académica.
Está compuesta por dos módulos principales:

| Módulo                             | Descripción                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 🧩 **Backend (`server/`)**         | API en Node.js + Express + Prisma + PostgreSQL con integración LLM (Ollama + Qwen2.5-7B-Instruct).             |
| 🧭 **Frontend (`client/`)**        | SPA construida con React + Vite + Material UI para gestionar tareas, visualizar métricas y chatear con el LLM. |

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
│   ├── src/
│   │   ├── controllers/        # Lógica HTTP (request/response)
│   │   ├── services/           # Lógica de negocio
│   │   ├── repositories/       # Acceso a datos (Prisma)
│   │   ├── routes/             # Definición de rutas Express
│   │   ├── middlewares/        # CORS, acceso, errores
│   │   └── utils/              # Helpers (response.js)
│   ├── scripts/                # Scripts de shell (lib.sh, install_model)
│   ├── migrations/             # SQL de inicialización y semilla
│   ├── prisma/                 # Schema Prisma
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
│
├── client/                     # Frontend (React + Vite + MUI)
│   ├── src/
│   │   ├── components/         # Componentes React reutilizables
│   │   ├── pages/              # Páginas principales
│   │   ├── hooks/              # Custom hooks (API, filtros, mutaciones)
│   │   ├── context/            # Contextos React (Auth)
│   │   ├── utils/              # Configuración y utilidades
│   │   └── styles/             # Estilos SCSS/módulos
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
│
└── docs/                       # Documentación adicional (opcional)
```

## 🐳 Contenedores Docker

Los contenedores usan el prefijo `sti-` y nombres griegos para evitar colisiones con otros proyectos:

| Servicio    | Contenedor      | Descripción                       |
| ----------- | --------------- | --------------------------------- |
| PostgreSQL  | `sti-atlas`     | Base de datos                     |
| Ollama      | `sti-hermes`    | Servidor LLM                      |
| Ollama init | `sti-prometheus`| Descarga del modelo (skip si ya existe) |
| API Backend | `sti-apollo`    | Servidor Express                  |
| Frontend    | `sti-nike`      | Nginx + React SPA                 |

## 🚀 Ejecución completa del entorno

### 1️⃣ Levantar el **backend**

Desde la carpeta `server/`:

```bash
cd server
docker compose up -d --build
```

El servicio `sti-prometheus` descarga automáticamente el modelo LLM al iniciar.
En reinicios posteriores detecta que el modelo ya existe y omite la descarga.

Verifica logs y estado de los servicios:

```bash
docker compose logs -f sti-atlas
docker compose logs -f sti-prometheus
docker compose logs -f sti-hermes
docker compose logs -f sti-apollo
```

La API queda disponible en `http://localhost:3000/api/v1/`.

### 2️⃣ Levantar el **frontend**

Desde la carpeta `client/`:

```bash
cd client
docker compose up -d --build
```

Verifica logs:

```bash
docker compose logs -f sti-nike
```

Accede en tu navegador a:

👉 **[http://localhost:8080](http://localhost:8080)**

## 🧱 Flujo general

1. **Backend** expone la API en `http://localhost:3000/api/v1/`.
2. **Frontend** consume esa API desde el navegador en `http://localhost:8080`.
3. El gateway de acceso está en `/gate/login` y `/gate/logout`.
4. El health check está en `/healthz`.

## 📘 Documentación individual

| Proyecto              | Enlace                               |
| --------------------- | ------------------------------------ |
| 🧩 **Backend (API)**  | [server/README.md](server/README.md) |
| 🧭 **Frontend (SPA)** | [client/README.md](client/README.md) |

## 🧹 Limpieza y mantenimiento

```bash
# Detener todos los contenedores (desde server/ o client/)
docker compose down

# Eliminar volúmenes persistentes (base de datos, modelo LLM)
docker compose down -v
```
