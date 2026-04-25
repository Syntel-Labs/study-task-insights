# Repository: tasksRepository.js

## Introduccion

Acceso a datos para la entidad `Task` (Prisma model `prisma.task`). Proporciona CRUD basico con soporte de filtros, paginacion, includes anidados y un wrapper de transaccion.

## Funciones exportadas

| Funcion | Firma | Proposito |
| --- | --- | --- |
| `findMany` | `({ where, include, orderBy, take, skip })` | Listado con filtros, includes (relaciones) y paginacion (`take`/`skip`) |
| `count` | `(where)` | Conteo total para `paginationMeta` |
| `findById` | `(taskId, include)` | Lectura por PK; convierte el id a `String` por defensa |
| `create` | `(data)` | Insercion |
| `update` | `(taskId, data)` | Actualizacion por PK |
| `remove` | `(taskId)` | Eliminacion por PK |
| `transaction` | `(ops)` | Pasa por `prisma.$transaction` |

Todas son one-liners que delegan en `prisma.task`. La conversion `String(taskId)` blinda contra ids numericos accidentales.

## Ejemplo de uso desde el service

```js
import * as tasksRepo from "#repositories/tasksRepository.js";

const where = { termId: filters.termId, statusId: filters.statusId };
const [items, total] = await tasksRepo.transaction([
  tasksRepo.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
  tasksRepo.count(where),
]);
```

`tasksRepo.transaction([a, b])` envuelve un array de promesas Prisma como una unica transaccion (read-consistent snapshot).

## Dependencias

- `#config/prismaClient.js` — singleton de Prisma Client.
