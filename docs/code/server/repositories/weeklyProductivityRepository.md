# Repository: weeklyProductivityRepository.js

## Introduccion

Acceso a la vista materializada `sti.weekly_productivity`. A diferencia del resto de repositorios, no usa modelos Prisma sino consultas raw, porque la vista no esta declarada como modelo en el schema (es solo un objeto SQL).

## Funciones exportadas

| Funcion | Firma | Proposito |
| --- | --- | --- |
| `queryRaw` | `(sql, ...params)` | Pasa por `prisma.$queryRawUnsafe`. Devuelve filas como objetos planos |
| `executeRaw` | `(sql)` | Pasa por `prisma.$executeRawUnsafe`. Para statements sin filas (`REFRESH MATERIALIZED VIEW`) |

## Por que `Unsafe`

`queryRawUnsafe` recibe el SQL como string y los params posicionales (`$1`, `$2`, ...). El service compone el SQL dinamicamente segun los filtros (`year`, `week`, `range`) y pasa los valores por parametro. **Nunca** concatena valores del usuario al string SQL: eso seria injection. La parte concatenada es solo de los nombres de columnas y operadores, controlada por whitelist en el service.

Si en el futuro la vista se declara como modelo (`prisma.weeklyProductivity`), este repositorio se reemplaza por la forma estandar (`findMany`/`count`).

## Operaciones tipicas

Lectura filtrada:

```js
const rows = await weeklyProductivityRepo.queryRaw(
  `SELECT * FROM sti.weekly_productivity WHERE year = $1 AND week = $2`,
  year, week
);
```

Refresh de la vista (lo invoca `POST /api/v1/weekly-productivity/refresh`):

```js
await weeklyProductivityRepo.executeRaw(
  `REFRESH MATERIALIZED VIEW CONCURRENTLY sti.weekly_productivity`
);
```

`CONCURRENTLY` exige un indice unico sobre la vista; el service decide si usarlo o no segun el SQL definido en `01_init_schema.sql`.

## Dependencias

- `#config/prismaClient.js` — singleton de Prisma Client (solo para acceso a `$queryRawUnsafe`/`$executeRawUnsafe`).
