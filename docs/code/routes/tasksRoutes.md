# Rutas: Tasks (`tasksRoutes.js`)

## Introducción

Define el router de **tasks** y lo asocia con el controlador. Expone un CRUD RESTful con filtros, paginación y proyección opcional.

## Rutas

| Método | Ruta            | Controlador        |
|-------:|-----------------|--------------------|
| GET    | /api/tasks      | `getList`          |
| GET    | /api/tasks/:id  | `getOne`           |
| POST   | /api/tasks      | `createMany`       |
| PUT    | /api/tasks      | `updateManyCtrl`   |
| DELETE | /api/tasks      | `deleteManyCtrl`   |

## Filtros y proyección

- **Filtros:** `q`, `statusId`, `priorityId`, `typeId`, `termId`, `tagId`, `dueFrom`, `dueTo`, `archived` (por defecto `false`: solo activas).
- **Include:**  
  - `include=lookups` → añade catálogos (`status`, `priority`, `type`, `term`)  
  - `include=tags` → añade etiquetas (`taskTagAssignments.taskTag`)  
  - `include=all` → ambos

## Ejemplos

- **Listar próximas tareas del periodo 1 con etiquetas incluidas:**

```json
GET /api/tasks?termId=1&archived=false&dueFrom=2026-01-01&include=all&limit=20
```

- **Crear varias tareas:**

```json
POST /api/tasks
[
  { "title": "Lectura", "taskStatusId": 1, "taskPriorityId": 2, "taskTypeId": 3, "termId": 1 },
  { "title": "Proyecto", "taskStatusId": 1, "taskPriorityId": 3, "taskTypeId": 2, "termId": 1 }
]
```

- **Eliminar varias:**

```json
DELETE /api/tasks
{ "ids": ["uuid-1","uuid-2","uuid-3"] }
```

## Errores esperados

- `400`: body inválido/ausente, parámetros inconsistentes.
- `404`: no encontrado (GET :id).
- `409`: conflicto de unicidad (tareas activas duplicadas) o FK.
