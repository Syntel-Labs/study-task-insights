# Study Task Insights — Frontend 🧭

## 🚀 Introducción

**Study Task Insights — Frontend** es una aplicación **SPA (Single Page Application)** desarrollada con **React + Vite + Material UI**, diseñada para gestionar tareas académicas, visualizar métricas de productividad y comunicarse con el motor de recomendaciones **LLM (Ollama + Qwen2.5-7B-Instruct)**.

Permite autenticarse, acceder al **dashboard de rendimiento**, crear, editar y eliminar tareas (*to-do list*), y mantener conversaciones inteligentes con el asistente integrado.

La interfaz está completamente **contenedorizada con Docker**, por lo que no se requiere tener Node.js o pnpm instalados localmente.

## ⚙️ Requisitos previos

Antes de iniciar el frontend, asegúrate de tener instalado:

| Componente              | Versión mínima recomendada | Descripción                                                  |
| ----------------------- | -------------------------- | ------------------------------------------------------------ |
| 🐳 Docker               | `>=24.x`                   | Ejecuta el entorno del frontend sin dependencias locales.    |
| 🧩 Node.js *(opcional)* | `22.x`                     | Solo si deseas ejecutar el entorno de desarrollo localmente. |
| 📦 pnpm *(opcional)*    | `>=10.x`                   | Gestor de dependencias usado internamente por Vite.          |

> 💡 Si usas Docker, **solo necesitas Docker y Docker Compose**.
> Node y pnpm no son necesarios para construir ni ejecutar el cliente.

### Verificar entorno

```bash
docker -v
node -v       # opcional
pnpm -v       # opcional
```

## 📁 Estructura general del proyecto

```bash
study-task-insights-frontend/
├── Dockerfile              # Imagen base (Vite + Nginx)
├── docker-compose.yml      # Orquestación del contenedor web
├── .dockerignore           # Exclusiones del build
├── docker/
│   └── nginx.conf          # Configuración SPA de Nginx
│
├── public/                 # Recursos estáticos
├── src/
│   ├── pages/              # Vistas principales (Login, Dashboard, Tasks, LLM Chat)
│   ├── components/         # Componentes reutilizables
│   ├── styles/             # SCSS y variables de color
│   └── utils/              # Config y helpers
├── vite.config.js          # Configuración de Vite
└── package.json
```

## 💡 Funcionalidades principales

| Módulo                   | Descripción                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| 🔐 **Autenticación**     | Inicio de sesión y persistencia de sesión local.                                   |
| 📊 **Dashboard**         | Muestra métricas de productividad y progreso semanal.                              |
| ✅ **Gestión de tareas**  | Crear, editar, eliminar y filtrar tareas tipo *to-do list*.                        |
| 💬 **Chat LLM (Ollama)** | Interacción natural con el modelo local para obtener recomendaciones o asistencia. |

## ⚙️ Configuración de entorno

Copia las variables base del entorno y ajusta los valores según tu backend:

```bash
cp .env.example .env
```

### Ejemplo `.env`

```bash
VITE_BACKEND_BASE_URL=http://localhost:3000
VITE_API_BASE_PATH=/api
VITE_HEALTH_PATH=/healthz
VITE_GATE_BASE_PATH=/gate

VITE_SESSION_HOURS=1000
VITE_SESSION_REVALIDATE_MARGIN_MIN=2
```

> Estas variables se **inyectan durante el build** de la imagen Docker, por lo que si cambian debes reconstruir el contenedor (`--build`).

## 🐳 Ejecución del entorno Docker

Todos los comandos deben ejecutarse desde la carpeta raíz del proyecto `study-task-insights-frontend/`.

### Ciclo de ejecución completo

```bash
# 1️⃣ Detener y eliminar cualquier contenedor previo
docker compose down -v

# 2️⃣ Construir y levantar el frontend
docker compose up -d --build

# 3️⃣ Abrir la aplicación en el navegador
# 👉 http://localhost:8080
```

### Administración del contenedor

```bash
# Ver logs del frontend
docker compose logs -f web

# Reiniciar contenedor
docker compose restart web

# Detener contenedor
docker compose stop

# Eliminar contenedor
docker compose down
```

## 🧱 Integración con el backend

El frontend se comunica con la API de **Study Task Insights** a través de las variables `VITE_BACKEND_BASE_URL` y `VITE_API_BASE_PATH`.

Si el backend corre en Docker y ambos comparten una red, puedes usar:

```bash
VITE_BACKEND_BASE_URL=http://api:3000
```

Y definir en `docker-compose.yml`:

```yaml
networks:
  default:
    name: study_network
    external: true
```

## 🧩 Ejecución local (modo desarrollo)

Si prefieres usar tu entorno Node.js local:

```bash
pnpm install
pnpm dev
```

Luego abre:

```bash
http://localhost:3001
```

## 🧠 Comandos útiles

```bash
# Construir producción (salida en dist/)
pnpm build

# Vista previa local del build
pnpm preview

# Ejecutar el contenedor con build limpio
docker compose up -d --build

# Detener el contenedor
docker compose down
```
