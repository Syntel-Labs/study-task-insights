# Utils: config.js

## Introduccion

`src/utils/config.js` valida y centraliza la configuracion runtime del frontend. Lee variables `VITE_*` (inyectadas por Vite en build), aborta si falta alguna requerida y compone las bases de URL que el resto de la app consume.

## Variables que valida

`requireEnv(value, key)` lanza error si el valor es falsy. Variables obligatorias:

- `VITE_BACKEND_BASE_URL` — origen del backend (ej. `http://localhost:3000` o `https://sti-api.josuesay.com`).
- `VITE_API_BASE_PATH` — prefijo de rutas de negocio (`/api/v1`).
- `VITE_HEALTH_PATH` — ruta del healthcheck (`/healthz`).
- `VITE_GATE_BASE_PATH` — ruta del gate (`/gate`).

Variables opcionales con default:

- `VITE_SESSION_HOURS` (default `2`) — horas que dura la sesion logica antes del hard-revalidate.
- `VITE_SESSION_REVALIDATE_MARGIN_MIN` (default `5`) — minutos de margen antes del expiry para hacer soft-revalidate.

Si una variable obligatoria falta, el bundle falla al ejecutar (error en la consola del navegador). Es deliberado: mejor descubrir un `.env` mal copiado al cargar la SPA que en runtime cuando ya hay usuarios.

## Exports

| Export | Tipo | Proposito |
| --- | --- | --- |
| `backendBase` | `string` | Origen del backend (sin path) |
| `apiBase` | `string` | `backendBase` + `apiBasePath` |
| `gateBase` | `string` | `backendBase` + `gateBasePath` |
| `healthUrl` | `string` | URL absoluta del healthcheck |
| `apiPaths` | `object` | Mapa logico de paths relativos por dominio |
| `buildApiUrl(path, query?)` | funcion | Compone URL absoluta sobre `apiBase`, soporta query params (incluye arrays) |
| `buildGateUrl(path)` | funcion | Compone URL absoluta sobre `gateBase` |
| `session` | `{ hours, revalidateMs }` | Config de sesion derivada |

## `apiPaths`

```js
export const apiPaths = {
  catalogs: "catalogs",
  tasks: "tasks",
  taskTagAssignments: "task-tag-assignments",
  studySessions: "study-sessions",
  weeklyProductivity: "weekly-productivity",
  importBatch: "import/batch",
  llm: "llm",
};
```

Los hooks de `hooks/api/*` referencian `apiPaths.*` en vez de strings literales para que un cambio futuro de prefijo se propague desde un solo lugar.

## `buildApiUrl`

```js
buildApiUrl("tasks", { include: "all", page: 1, tagId: ["a", "b"] });
// => https://sti-api.josuesay.com/api/v1/tasks?include=all&page=1&tagId=a&tagId=b
```

Detalles:

- Acepta arrays y los expande como params repetidos (compatible con la convencion del backend para multi-valor).
- Ignora valores `undefined` o `null`.
- Convierte todo a `String` antes de pasar a `URLSearchParams`.

## `joinUrl`

Helper interno que une `base` y `path` evitando slashes duplicados. Normaliza casos como `https://x.com/`/`/api/v1`.

## `session`

```js
export const session = {
  hours: 2,
  revalidateMs: 5 * 60 * 1000,
};
```

Usado por `AuthContext` para programar dos timers:

- Soft: `(hours * 3600 - revalidateMs) ms` -> intenta refrescar la sesion en silencio.
- Hard: `hours * 3600 * 1000 ms` -> al expirar, revalida o desloguea.
