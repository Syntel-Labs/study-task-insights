import prisma from "#config/prismaClient.js";

/** Normaliza valores de paginación con límites seguros */
const normalizePagination = (limit, offset) => {
  const take =
    typeof limit === "number" && limit > 0 && limit <= 200 ? limit : 50;
  const skip = typeof offset === "number" && offset >= 0 ? offset : 0;
  return { take, skip };
};

/** Construye condiciones WHERE para la vista materializada */
const buildWhere = ({ year, week, yearFrom, yearTo, weekFrom, weekTo, q }) => {
  const where = [];
  const params = [];

  if (year !== undefined) {
    params.push(Number(year));
    where.push(`iso_year = $${params.length}`);
  }
  if (week !== undefined) {
    params.push(Number(week));
    where.push(`iso_week = $${params.length}`);
  }
  if (yearFrom !== undefined) {
    params.push(Number(yearFrom));
    where.push(`iso_year >= $${params.length}`);
  }
  if (yearTo !== undefined) {
    params.push(Number(yearTo));
    where.push(`iso_year <= $${params.length}`);
  }
  if (weekFrom !== undefined) {
    params.push(Number(weekFrom));
    where.push(`iso_week >= $${params.length}`);
  }
  if (weekTo !== undefined) {
    params.push(Number(weekTo));
    where.push(`iso_week <= $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params };
};

/** Genera ORDER BY seguro basado en lista blanca de campos */
const buildOrderBy = (field = "iso_year", dir = "asc") => {
  const validFields = new Set([
    "iso_year",
    "iso_week",
    "tasks_created",
    "tasks_completed",
    "completion_rate",
    "planned_minutes",
    "actual_minutes",
    "avg_completion_time_min",
    "created_at",
    "updated_at",
  ]);
  const f = validFields.has(field) ? field : "iso_year";
  const d = String(dir).toLowerCase() === "desc" ? "desc" : "asc";
  return `ORDER BY ${f} ${d}`;
};

/** Listado de productividad semanal con filtros, paginación y orden */
export const listWeeklyProductivity = async (params = {}) => {
  const {
    year,
    week,
    yearFrom,
    yearTo,
    weekFrom,
    weekTo,
    limit,
    offset,
    orderByField,
    orderByDir,
  } = params;

  const { whereSql, params: whereParams } = buildWhere({
    year,
    week,
    yearFrom,
    yearTo,
    weekFrom,
    weekTo,
  });
  const orderBySql = buildOrderBy(orderByField, orderByDir);
  const { take, skip } = normalizePagination(limit, offset);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM weekly_productivity
    ${whereSql};
  `;

  const itemsSql = `
    SELECT
      weekly_productivity_id,
      iso_year::int                AS iso_year,
      iso_week::int                AS iso_week,
      tasks_created::int           AS tasks_created,
      tasks_completed::int         AS tasks_completed,
      completion_rate::float8      AS completion_rate,
      planned_minutes::int         AS planned_minutes,
      actual_minutes::int          AS actual_minutes,
      COALESCE(avg_completion_time_min, 0)::int AS avg_completion_time_min,
      created_at,
      updated_at
    FROM weekly_productivity
    ${whereSql}
    ${orderBySql}
    LIMIT $${whereParams.length + 1}
    OFFSET $${whereParams.length + 2};
  `;

  const [countRow] = await prisma.$queryRawUnsafe(countSql, ...whereParams);
  const items = await prisma.$queryRawUnsafe(
    itemsSql,
    ...whereParams,
    take,
    skip
  );

  return { items, total: countRow?.total ?? 0 };
};

/** Obtiene un registro específico por año y semana */
export const getWeeklyProductivityByYearWeek = async (isoYear, isoWeek) => {
  const sql = `
    SELECT
      weekly_productivity_id,
      iso_year::int                AS iso_year,
      iso_week::int                AS iso_week,
      tasks_created::int           AS tasks_created,
      tasks_completed::int         AS tasks_completed,
      completion_rate::float8      AS completion_rate,
      planned_minutes::int         AS planned_minutes,
      actual_minutes::int          AS actual_minutes,
      COALESCE(avg_completion_time_min, 0)::int AS avg_completion_time_min,
      created_at,
      updated_at
    FROM weekly_productivity
    WHERE iso_year = $1 AND iso_week = $2
    LIMIT 1;
  `;
  const rows = await prisma.$queryRawUnsafe(
    sql,
    Number(isoYear),
    Number(isoWeek)
  );
  if (!rows.length) {
    const err = new Error(`No encontrado (year=${isoYear}, week=${isoWeek})`);
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

/** Refresca la vista materializada semanal */
export const refreshWeeklyProductivity = async () => {
  try {
    await prisma.$executeRawUnsafe(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_productivity;`
    );
  } catch (err) {
    if (String(err.message || "").includes("CONCURRENTLY")) {
      await prisma.$executeRawUnsafe(
        `REFRESH MATERIALIZED VIEW weekly_productivity;`
      );
    } else {
      throw err;
    }
  }
  return { ok: true, refreshed: true, at: new Date().toISOString() };
};
