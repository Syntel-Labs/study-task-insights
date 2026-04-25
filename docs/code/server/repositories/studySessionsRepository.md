# Repository: studySessionsRepository.js

## Introduccion

Acceso a datos para `StudySession` (Prisma model `prisma.studySession`). CRUD basico, paginacion e includes, mas un helper de lectura con `select` proyectado.

## Funciones exportadas

| Funcion | Firma | Proposito |
| --- | --- | --- |
| `findMany` | `({ where, include, orderBy, take, skip })` | Listado con filtros, includes y paginacion |
| `count` | `(where)` | Conteo |
| `findById` | `(id, include)` | Lectura por PK con relaciones opcionales |
| `findByIdSelect` | `(id, select)` | Lectura por PK con projection (solo columnas especificas) |
| `create` | `(data)` | Insercion |
| `update` | `(id, data)` | Actualizacion por PK |
| `remove` | `(id)` | Eliminacion por PK |
| `transaction` | `(fn)` | Wrapper de `prisma.$transaction` (acepta callback interactivo) |

## `findByIdSelect`

A diferencia de `findById`, recibe `select` en vez de `include`. Usado por casos donde el service necesita verificar la existencia y leer solo unos campos (ej.: validar duenos antes de actualizar):

```js
const session = await studySessionsRepo.findByIdSelect(id, {
  studySessionId: true,
  taskId: true,
  durationMin: true,
});
```

`select` e `include` no se pueden mezclar en Prisma; por eso se ofrecen los dos lectores.

## Notas

- La conversion `String(id)` defiende contra ids numericos accidentales.
- `transaction(fn)` recibe un callback interactivo (`prisma.$transaction(async (tx) => {...})`), util cuando hay que leer y escribir en la misma transaccion. El otro overload (array de promesas) tambien funciona, pero el callback es mas claro para flujos secuenciales.

## Dependencias

- `#config/prismaClient.js` — singleton de Prisma Client.
