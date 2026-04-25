# Repositories

## Introduccion

Capa de acceso a datos. Cada repositorio es un modulo delgado que envuelve operaciones Prisma de un agregado. La logica de negocio (validacion, composicion de filtros, mapeo de DTOs) vive en `services/`; los repositorios solo traducen llamadas semanticas a queries Prisma.

## Convencion

Todos exportan funciones puras (sin `this`, sin estado), y reciben/retornan objetos planos. La forma habitual:

| Funcion | Proposito |
| --- | --- |
| `findMany({ where, include, orderBy, take, skip })` | Listado con filtros y paginacion |
| `count(where)` | Conteo (para meta de paginacion) |
| `findById(id, include?)` | Lectura puntual por ID |
| `create(data)` | Insercion |
| `update(id, data)` | Actualizacion |
| `remove(id)` | Eliminacion |
| `transaction(ops)` | Wrapper de `prisma.$transaction` |

No todos los modulos implementan todo el conjunto: solo lo que el dominio necesita.

## Inventario

- `tasksRepository.md` — entidad `Task`. CRUD completo + transaction.
- `catalogsRepository.md` — multi-modelo (terms, statuses, priorities, types, tags) via `modelFor(entity)`. Resuelve el delegate de Prisma a partir del nombre publico de la entidad.
- `studySessionsRepository.md` — entidad `StudySession`. CRUD + `findByIdSelect` (lecturas con projection ad hoc).
- `taskTagAssignmentsRepository.md` — relacion N:M entre `Task` y `TaskTag`. CRUD parcial (sin update).
- `weeklyProductivityRepository.md` — solo helpers raw (`$queryRawUnsafe`, `$executeRawUnsafe`) para hablar con la vista materializada.
- `batchImportRepository.md` — solo expone `transaction(fn)` para envolver multiples operaciones de la importacion por lotes.

## Por que existen

Mantener Prisma fuera de los services tiene tres beneficios concretos:

1. **Tests**: si en el futuro se introducen tests, mockear el repositorio es trivial; mockear Prisma directo es ruido.
2. **Cambios de orm**: si se cambia el cliente, solo los repositorios se reescriben.
3. **Composicion**: los services pueden combinar varios repositorios sin ensuciar el dominio con detalles de la query.

## Dependencias

Todos importan `prisma` desde `#config/prismaClient.js` (un singleton, nunca se instancia el cliente en el repositorio).
