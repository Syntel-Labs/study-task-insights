# Hook: useTasksFilters.js

## Introduccion

Estado de filtros, orden y paginacion para la pagina de tareas. Centraliza la logica para no contaminar `TasksPage`. Maneja dos vistas del estado: el aplicado (que se envia a la API) y el draft (lo que el usuario edita en el panel de filtros antes de aplicar).

## Estado expuesto

| Estado | Tipo | Default |
| --- | --- | --- |
| `q` | `string` | `""` |
| `archived` | `boolean` | `false` |
| `sortBy` | `string` | `"dueAt"` |
| `sortOrder` | `"asc" \| "desc"` | `"asc"` |
| `page` | `number` | `1` |
| `pageSize` | `number` | `20` |
| `draft` | objeto con `statusId`, `priorityId`, `typeId`, `termId`, `tagIds`, `dueFrom`, `dueTo` | todos `null` salvo `tagIds: []` |
| `apiQuery` | objeto memoizado para pasar al hook de API | recomputado segun los filtros aplicados |

## Funciones

| Funcion | Proposito |
| --- | --- |
| `setQ` | Setter del termino de busqueda |
| `setArchived` | Setter del toggle de archivadas |
| `handleSort(field)` | Si el campo es el actual, alterna `asc`/`desc`. Si es nuevo, fija `asc` |
| `setPage` / `setPageSize` | Setters de paginacion |
| `setDraft` | Setter del draft |
| `syncDraftFromApplied` | Copia el aplicado al draft (al abrir el panel de filtros) |
| `applyFilters` | Promueve draft -> aplicado y resetea a `page: 1` |
| `clearDraft` | Resetea el draft a vacio |

## Patron draft vs aplicado

La distincion existe porque cambiar un filtro no debe disparar un fetch hasta que el usuario presione "Aplicar". Asi:

- El usuario edita el panel sin renders ni fetches innecesarios.
- Al aplicar, el `apiQuery` se recalcula una vez y desencadena el fetch.
- Cuando se cierra y se reabre el panel sin aplicar, `syncDraftFromApplied` lo deja consistente.

## `apiQuery`

Objeto memoizado que el `TasksPage` pasa a `tasksApi.list(query)`. Solo incluye los params no-nulos:

```js
{
  include: "all",
  pageSize, page, sortBy, sortOrder,
  archived: archived ? "true" : "false",
  q?, statusId?, priorityId?, typeId?, termId?,
  tagId?: [...], dueFrom?, dueTo?,
}
```

`tagId` se pasa como array; `buildApiUrl` (en `utils/config.js`) lo expande como `tagId=a&tagId=b&...`, formato esperado por el backend para multi-valor.

## Por que vive fuera de `TasksPage`

- La pagina renderiza tabla, kpis y filtros. Mezclar todo en un solo componente da React state spaghetti.
- Aislar facilita iterar sobre la UX de filtros sin tocar el resto.
- Un hook solo de mutations (`useTasksMutations`) y otro solo de filtros mantienen responsabilidades separadas.
