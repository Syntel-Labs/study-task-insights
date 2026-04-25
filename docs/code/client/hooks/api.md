# Hooks: hooks/api/

## Introduccion

Carpeta con hooks por dominio que encapsulan las llamadas a la API. Cada hook usa `useApi` y referencia `apiPaths.*` desde `utils/config.js`. El barrel `hooks/api/index.js` re-exporta todos.

## Modulos

| Hook | Dominio | Path |
| --- | --- | --- |
| `useTasksApi` | Tareas | `apiPaths.tasks` |
| `useTaskTagAssignmentsApi` | Asignaciones tarea-tag | `apiPaths.taskTagAssignments` |
| `useStudySessionsApi` | Sesiones de estudio | `apiPaths.studySessions` |
| `useWeeklyProductivityApi` | Productividad semanal | `apiPaths.weeklyProductivity` |
| `useImportBatchApi` | Ingesta por lotes | `apiPaths.importBatch` |
| `useLlmApi` | LLM (recomendaciones, chat) | `apiPaths.llm` |
| `useCatalogsApi` | Catalogos (terms, statuses, ...) | `apiPaths.catalogs` |
| `useHealthApi` | Healthcheck | `healthUrl` |
| `useGateApi` | Login/logout | `gateBase` |

## Forma comun

Cada hook expone un objeto memoizado con `list`, `get`, `create`, `update`, `remove` segun aplique:

```js
export function useTasksApi() {
  const { get, post, put, del } = useApi();
  const base = apiPaths.tasks;

  return React.useMemo(() => ({
    list:   (query) => get(base, query),
    get:    ({ id, include } = {}) => get(`${base}/${id}`, include ? { include } : undefined),
    create: (payload) => post(base, bulkify(payload)),
    update: (payload) => put(base, bulkify(payload)),
    remove: (ids) => del(base, { body: { ids } }),
  }), [get, post, put, del]);
}
```

Patrones que se repiten:

- `bulkify(payload)` en `create`/`update` para que el caller pueda mandar uno o varios.
- `remove` recibe un array de ids y pasa `{ ids }` en el body (el backend hace `DELETE` masivo).
- `get` puntual acepta `{ id, include }` para incluir relaciones bajo demanda.

## Caso especial: `useGateApi`

El gate **no** pasa por `useApi` porque vive fuera de `apiBase`. Hace `fetch` directo a `buildGateUrl("login")` y `buildGateUrl("logout")`, igualmente con `credentials: "include"` para que la cookie se establezca/limpie. Detalle en el modulo de gate.

## Caso especial: `useHealthApi`

Apunta a `healthUrl` (no a `apiBase`). Usado por `AuthContext` para revalidar la sesion: si `/healthz` responde con la cookie, la sesion sigue viva.

## Por que un hook por dominio en lugar de un cliente unico

Mantener cada dominio aparte permite:

- Importar solo lo que la pagina usa (tree-shaking).
- Modificar los paths/comportamientos por dominio sin tocar al resto.
- Testear cada hook independientemente cuando se introduzcan tests.

## Convenciones para nuevos hooks

1. Recibir paths desde `apiPaths`, no hardcodear strings.
2. Memoizar el objeto con `React.useMemo` para que los consumers no provoquen renders innecesarios.
3. Aceptar tanto objeto unico como array en mutaciones (`bulkify`).
4. No agregar logica de UI (toasts, navegacion); eso vive en mutations hooks como `useTasksMutations`.
