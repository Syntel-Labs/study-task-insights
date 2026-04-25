# Hook: useTasksMutations.js

## Introduccion

Centraliza las mutaciones CRUD y bulk de tareas: crear, actualizar, completar, archivar, eliminar (uno o muchos) y cambiar estado en lote. Maneja el flag `mutating`, los toasts de exito/error y dispara el refresh tras cada operacion.

## Firma

```js
const {
  mutating,
  handleCreate, handleUpdate,
  completeOne, archiveOne, deleteOne,
  bulkComplete, bulkArchive, bulkDelete, bulkChangeStatus,
} = useTasksMutations({ tasksApi, tagAssignApi, onRefresh });
```

| Parametro | Proposito |
| --- | --- |
| `tasksApi` | Hook `useTasksApi()` (CRUD de tareas) |
| `tagAssignApi` | Hook `useTaskTagAssignmentsApi()` (tags por tarea) |
| `onRefresh` | Callback para recargar la lista despues de mutar |

## Funciones

| Funcion | Que hace |
| --- | --- |
| `handleCreate(payload)` | Crea la tarea. Si `payload.tagIds` viene, dispara `tagAssignApi.add` por cada uno tras la creacion |
| `handleUpdate(payload, taskId?)` | Actualiza. Determina el id desde `payload.taskId` o el segundo arg. Stripping de `tagIds` (eso va por otro endpoint) |
| `completeOne(task, opts)` | Marca completada (`completedAt = now`); opcionalmente fija `actualMin` |
| `archiveOne(task)` | Marca `archivedAt = now` |
| `deleteOne(task)` | Valida UUID antes de borrar; tira un Error explicito si no matchea |
| `bulkComplete(selectedIds, opts)` | Bulk version de complete |
| `bulkArchive(selectedIds)` | Bulk version de archive |
| `bulkDelete(selectedIds)` | Bulk version de delete |
| `bulkChangeStatus(ids, statusId, statuses)` | Cambia estado en lote; si el nuevo estado es `isFinal`, fija tambien `completedAt` |

## Flujo comun

```js
async function fn(...) {
  setMutating(true);
  try {
    await tasksApi.X(...);
    toast.success("Mensaje");
    await onRefresh();
  } catch (e) {
    toast.error("Mensaje", { description: msg(e, "Error") });
  } finally {
    setMutating(false);
  }
}
```

`msg(e, fallback)` lee el mensaje del backend (`e.payload.message`) si existe; si no, el del `Error` JS; si no, el fallback. El backend devuelve `code` y `message`; este hook usa `message` para el toast.

## `mutating`

Flag boolean que la pagina puede usar para deshabilitar UI durante la operacion. Las mutaciones individuales y bulk comparten el mismo flag, asi que solo una operacion mutante esta activa a la vez por la UI consumer.

## Por que vive fuera de `TasksPage`

Aislar las mutations hace que `TasksPage` quede orientada a layout y composicion. Toda la logica de optimistic UI, error handling y toasts permanece en un lugar testeable y reutilizable.
