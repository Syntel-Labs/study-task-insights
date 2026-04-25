# Frontend (codigo)

Documentacion del codigo del SPA en `client/src/`. Cada subcarpeta refleja la estructura del proyecto.

## Stack

- React 18 con `react-router-dom` v7 para enrutado client-side.
- Vite como bundler (variables `VITE_*` se inyectan en build).
- TypeScript en archivos `.tsx` recientes; JS en hooks y context anteriores. Los tipos compartidos viven en `src/types/`.
- Material UI + utilidades shadcn/ui (`components/ui/`) para la base visual.
- `sonner` para toasts.
- `react-i18next` para i18n.

## Estructura

```bash
client/src/
|-- App.tsx                 # routing
|-- main.tsx                # bootstrap React + providers
|-- pages/                  # vistas top-level (1 por ruta)
|-- components/             # presentacionales y de dominio (catalogs, dashboard, tasks, ui)
|-- context/                # AuthContext, PreferencesContext
|-- hooks/                  # useApi, useTasksFilters, useTasksMutations, hooks/api/* por dominio
|-- lib/                    # utilidades transversales
|-- utils/                  # config (env), dates, tasksModel
|-- i18n/                   # configuracion y locales
|-- types/                  # shims y tipos compartidos
`-- index.css
```

## Documentos por modulo

- `pages/` — vistas y su data flow.
- `components/` — desglose por subcarpeta (`tasks`, `dashboard`, `catalogs`, `ui`).
- `context/auth.md` — `AuthContext` (gate, revalidacion, timers).
- `hooks/useApi.md` — cliente HTTP base (`fetch` + cookies).
- `hooks/api.md` — hooks por dominio que usan `useApi` para cada area de la API.
- `hooks/useTasksFilters.md` — estado de filtros y query builder.
- `hooks/useTasksMutations.md` — mutations CRUD con toasts.
- `utils/config.md` — lectura y validacion de `VITE_*`, helpers de URL.

## Como se conecta al backend

1. Build: Vite inyecta `VITE_BACKEND_BASE_URL`, `VITE_API_BASE_PATH`, `VITE_GATE_BASE_PATH`, etc.
2. `utils/config.js` valida (`requireEnv`) y compone bases (`apiBase`, `gateBase`, `healthUrl`).
3. `hooks/useApi.js` hace `fetch` con `credentials: "include"` (envia cookie `stia_session`).
4. `hooks/api/*` exponen una API por dominio que el resto de la app consume sin construir URLs.
5. `AuthContext` orquesta login/logout y revalida sesion contra `/healthz` con margen anticipado.
