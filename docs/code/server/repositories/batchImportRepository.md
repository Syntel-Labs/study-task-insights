# Repository: batchImportRepository.js

## Introduccion

Soporte de transaccion para la ingesta por lotes (`POST /api/v1/import/batch`). No envuelve un modelo concreto: solo expone el wrapper `transaction(fn)` para que el service pueda combinar inserciones en `tasks`, `task-tag-assignments` y `study-sessions` dentro del mismo `prisma.$transaction`.

## Funciones exportadas

| Funcion | Firma | Proposito |
| --- | --- | --- |
| `transaction` | `(fn)` | Pasa por `prisma.$transaction(fn)`. `fn` recibe el cliente transaccional `tx` |

## Patron de uso desde el service

```js
import * as batchImportRepo from "#repositories/batchImportRepository.js";

await batchImportRepo.transaction(async (tx) => {
  for (const t of payload.tasks) await tx.task.create({ data: t });
  for (const a of payload.assignments) await tx.taskTagAssignment.create({ data: a });
  for (const s of payload.sessions) await tx.studySession.create({ data: s });
});
```

Por que en este repositorio no usamos los repositorios individuales: necesitamos la version `tx` del cliente para que las operaciones queden en la misma transaccion. Los repositorios CRUD operan contra el cliente global; mezclarlos aqui rompe la atomicidad.

## Dependencias

- `#config/prismaClient.js` — singleton de Prisma Client.
