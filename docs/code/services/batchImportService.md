# Controller: batchImportController.js

## Introducción

Controlador HTTP para la importación por lotes. Delegación directa al servicio y manejo de errores centralizado.

## Funciones expuestas

- `importBatchCtrl(req, res, next)` → ejecuta la importación y devuelve `taskIdMap`.

## Diagrama de flujo

```mermaid
flowchart TD
  A[Request POST /api/import/batch] --> B[importBatchCtrl]
  B --> C[batchImportService.importBatch]
  C --> D[Prisma / PostgreSQL]
```

## Formatos de respuesta

- Éxito: `{ ok: true, created: {…}, taskIdMap: {…} }`
- Error: `next(err)` → manejado por `errorHandler`.
