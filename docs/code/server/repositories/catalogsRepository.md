# Repository: catalogsRepository.js

## Introduccion

Acceso a datos para los cinco catalogos del esquema `sti`: `terms`, `task-statuses`, `task-priorities`, `task-types`, `task-tags`. Centraliza el mapeo entidad publica -> delegate de Prisma para que el service no tenga que conocer los nombres internos.

## Funciones exportadas

| Funcion | Firma | Proposito |
| --- | --- | --- |
| `modelFor` | `(entity)` | Devuelve el delegate de Prisma para el nombre publico (`terms`, `task-tags`, etc.) o `null` si no existe |
| `findMany` | `(model, { where, orderBy, take, skip })` | Listado generico aplicado al delegate ya resuelto |
| `count` | `(model, where)` | Conteo |
| `findById` | `(model, idKey, id)` | Lectura por PK con nombre de columna dinamico |
| `create` | `(model, data)` | Insercion |
| `update` | `(model, idKey, id, data)` | Actualizacion por PK |
| `remove` | `(model, idKey, id)` | Eliminacion por PK |
| `transaction` | `(ops)` | Wrapper de `prisma.$transaction` |

## Mapping

```js
const map = {
  terms: prisma.term,
  "task-statuses": prisma.taskStatus,
  "task-priorities": prisma.taskPriority,
  "task-types": prisma.taskType,
  "task-tags": prisma.taskTag,
};
```

El service recibe el `entity` desde la URL (`/api/v1/catalogs/:entity`), llama a `modelFor(entity)`, y si es `null` responde `404`. Esto evita switch/case en cada operacion.

## Por que `idKey` es parametro

Cada catalogo tiene su PK con nombre propio (`termId`, `taskTagId`, etc.). En vez de hardcodear un `id`, el service inyecta el nombre real de la columna. Asi el repositorio sigue siendo agnostico al esquema.

```js
catalogsRepo.findById(catalogsRepo.modelFor("task-tags"), "taskTagId", id);
```

## Dependencias

- `#config/prismaClient.js` — singleton de Prisma Client.
