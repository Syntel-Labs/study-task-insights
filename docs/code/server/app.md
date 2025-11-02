# Aplicación Express

## Introducción

El módulo `app.js` configura la aplicación **Express** que sirve como backend HTTP de **Study Task Insights**.
Define los middlewares globales, autenticación por cookies, montaje de rutas API y manejo de errores.
Este archivo representa el núcleo funcional del servidor sin encargarse del arranque (delegado a `server.js`).

## Descripción general

- Inicializa middlewares de **seguridad y serialización** (`cors`, `express.json`, `cookieParser`).
- Implementa un sistema de **autenticación mínima por token secreto** (endpoints `/gate/login` y `/gate/logout`).
- Aplica el middleware global `accessGate` para proteger todas las rutas bajo `/api/*`.
- Monta los módulos de rutas de catálogos, tareas, sesiones, productividad y LLM.
- Expone un endpoint `/healthz` para verificación de estado y monitoreo.

## Diagrama de flujo

```mermaid
flowchart TD
  A[Cliente HTTP] --> B[Express app.js]
  B --> C[cors / cookieParser / requestLogger]
  C --> D[/gate/login y /gate/logout]
  D --> E[accessGate]
  E --> F[/api/* Routes]
  F -->|catálogos| G[catalogsRoutes]
  F -->|tareas| H[tasksRoutes]
  F -->|sesiones| I[studySessionsRoutes]
  F -->|productividad| J[weeklyProductivityRoutes]
  F -->|importación| K[batchImportRoutes]
  F -->|llm| L[llmRoutes]
  B --> M[/healthz (status check)]
  B --> N[errorHandler]
```

## Endpoints principales

| Método | Ruta           | Descripción                                                              |
| ------ | -------------- | ------------------------------------------------------------------------ |
| `POST` | `/gate/login`  | Genera una cookie de sesión (`stia_session`) firmada con `ACCESS_TOKEN`. |
| `POST` | `/gate/logout` | Elimina la cookie de sesión.                                             |
| `GET`  | `/healthz`     | Devuelve estado del servicio, `uptime` y entorno (`NODE_ENV`).           |

## Autenticación (`gate`)

- Usa `ACCESS_TOKEN` (definido en `.env`) para firmar y validar sesiones.
- La cookie se crea con los atributos `httpOnly`, `secure` (en producción) y `sameSite: strict`.
- El tiempo de vida de la sesión se controla con `ACCESS_SESSION_HOURS`.

## Manejo global de rutas

Todas las rutas `/api/*` pasan por `accessGate`, garantizando acceso autorizado.
El `errorHandler` captura errores no gestionados y devuelve respuestas JSON uniformes.

## Dependencias internas

- `#middlewares/accessGate.js` — validación de sesión por cookie.
- `#middlewares/logger.js` — registra peticiones entrantes.
- `#middlewares/errorHandler.js` — manejo de errores global.
- Controladores: `catalogsController`, `tasksController`, `studySessionsController`, `weeklyProductivityController`, `llmController`, entre otros.
