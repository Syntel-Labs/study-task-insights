# Repository: taskTagAssignmentsRepository.js

## Introduccion

Acceso a datos para la relacion N:M entre `Task` y `TaskTag`, modelada explicitamente como `TaskTagAssignment` (Prisma model `prisma.taskTagAssignment`). Es una tabla de union con su propia PK (`taskTagAssignmentId`), no un implicit join, para poder agregar columnas adicionales si el dominio lo pide.

## Funciones exportadas

| Funcion | Firma | Proposito |
| --- | --- | --- |
| `findMany` | `({ where, include, orderBy, take, skip })` | Listado de asignaciones con filtros e includes (`task`, `tag`) |
| `count` | `(where)` | Conteo para paginacion |
| `findById` | `(id, include)` | Lectura por PK |
| `create` | `(data)` | Insercion (asignar un tag a una tarea) |
| `remove` | `(id)` | Eliminacion (desasignar) |
| `transaction` | `(ops)` | Wrapper de `prisma.$transaction` |

No hay `update`: cambiar el `taskId` o `tagId` equivale a borrar y crear, asi que el service no necesita esa operacion.

## Patrones de uso comunes

Listar tags de una tarea con join:

```js
taskTagAssignmentsRepo.findMany({
  where: { taskId },
  include: { tag: true },
  orderBy: { createdAt: "asc" },
});
```

Crear varias asignaciones en una transaccion (no bypasses unique constraint):

```js
await taskTagAssignmentsRepo.transaction(
  payload.assignments.map((a) => taskTagAssignmentsRepo.create(a))
);
```

## Dependencias

- `#config/prismaClient.js` — singleton de Prisma Client.
