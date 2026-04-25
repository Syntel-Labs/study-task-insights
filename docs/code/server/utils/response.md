# Utils: response.js

## Introduccion

Helpers que estandarizan la forma de las respuestas HTTP. El backend tiene un contrato uniforme: cada respuesta lleva `code` (machine-readable) y `message`, opcionalmente `data` y `meta`. Esta utilidad evita repetir ese shape en cada controlador.

## Funciones exportadas

| Funcion | Status default | Cuerpo |
| --- | --- | --- |
| `ok(res, code, data?, meta?, status=200)` | `200` | `{ code, message: code, data?, meta? }` |
| `created(res, code, data)` | `201` | `{ code, message: code, data }` |
| `noContent(res)` | `204` | (cuerpo vacio) |
| `paginationMeta(page, pageSize, totalItems)` | — | `{ pagination: { page, pageSize, totalItems, totalPages } }` |

`message` arranca igual que `code` (fallback util cuando el front todavia no internacionaliza el codigo). Si en el futuro hace falta mensajes humanos por endpoint, es trivial extender la firma para aceptar un `message` separado sin romper a los consumidores actuales.

## Ejemplos

Listado paginado:

```js
import { ok, paginationMeta } from "#utils/response.js";

const [items, total] = await tasksRepo.transaction([
  tasksRepo.findMany({ where, take, skip }),
  tasksRepo.count(where),
]);

return ok(res, "tasks_listed", items, paginationMeta(page, pageSize, total));
```

Respuesta:

```json
{
  "code": "tasks_listed",
  "message": "tasks_listed",
  "data": [/* ... */],
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 117, "totalPages": 6 }
  }
}
```

Creacion:

```js
return created(res, "task_created", task);
```

Respuesta `201`:

```json
{ "code": "task_created", "message": "task_created", "data": { /* ... */ } }
```

Eliminacion:

```js
await tasksRepo.remove(id);
return noContent(res);
```

Respuesta `204` sin cuerpo.

## Errores

`response.js` no cubre errores; estos los emite `errorHandler` con un shape compatible (`{ code, message, ... }`). El controlador llama a `next(err)` y el middleware decide el status segun el tipo de error.

## Buenas practicas

- Usar codigos `snake_case` con verbo+sustantivo: `task_created`, `tasks_listed`, `session_not_found`.
- Reservar `meta` para metadata del listado o de la respuesta (paginacion, totales agregados); no meter ahi data del recurso.
- No agregar campos top-level adicionales: si la respuesta necesita algo mas, ponerlo dentro de `data` o `meta`.
- Para flujos sin payload, preferir `noContent` (`204`) en vez de `ok` con `data: null`.
