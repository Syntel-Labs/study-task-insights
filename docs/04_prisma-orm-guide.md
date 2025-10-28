# Prisma ORM – Flujo de Trabajo

Este archivo documenta los pasos **obligatorios** y **recomendados** para mantener la integridad del ORM (Prisma) cuando se realicen cambios en el archivo `schema.prisma`.

## Archivo principal

- `prisma/schema.prisma`: Define los modelos de la base de datos (tablas, relaciones, enums, etc.)

## 1. Editar el archivo `schema.prisma`

Asegúrate de seguir las convenciones establecidas:

- Usa `@@map("nombre_tabla_sql")` para respetar nombres existentes en la base de datos.
- Usa `@db.VarChar(n)`, `@db.Timestamp(6)` y tipos explícitos para una base PostgreSQL.
- Los enums deben coincidir con los creados en la base de datos (si ya existen).

## 2. Generar el cliente de Prisma

> Obligatorio cada vez que se edita `schema.prisma`.

```bash
npx prisma generate
```

Esto actualiza los archivos dentro del directorio:

```bash
/generated/prisma
```

## 3. Aplicar los cambios a la base de datos

> Solo si se agregan/actualizan tablas, relaciones, campos o tipos.

```bash
npx prisma db push
```

> ⚠️ Esto **no elimina datos existentes** y es seguro en desarrollo.
> Para producción, usar migraciones.

### 🚫 ¿Cuándo **NO** usar `db push`?

- En entornos de producción, usa:

  ```bash
  npx prisma migrate dev
  ```

- Si ya hay una base de datos creada con datos importantes.

- Cuando hay que revisar cada migración explícitamente.

## Ejemplo de flujo completo

```bash
# Editas schema.prisma...
npx prisma generate
npx prisma db push
```

## Referencia oficial

- [https://www.prisma.io/docs](https://www.prisma.io/docs)
