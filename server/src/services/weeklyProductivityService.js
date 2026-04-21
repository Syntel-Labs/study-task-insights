import * as wpRepo from "#repositories/weeklyProductivityRepository.js";

const normalize_pagination = (limit, offset) => {
  const take =
    typeof limit === "number" && limit > 0 && limit <= 200 ? limit : 50;
  const skip = typeof offset === "number" && offset >= 0 ? offset : 0;
  return { take, skip };
};

const build_where = ({ year, week, yearFrom, yearTo, weekFrom, weekTo }) => {
  const where = [];
  const params = [];

  if (year !== undefined) { params.push(Number(year)); where.push(`iso_year = $${params.length}`); }
  if (week !== undefined) { params.push(Number(week)); where.push(`iso_week = $${params.length}`); }
  if (yearFrom !== undefined) { params.push(Number(yearFrom)); where.push(`iso_year >= $${params.length}`); }
  if (yearTo !== undefined) { params.push(Number(yearTo)); where.push(`iso_year <= $${params.length}`); }
  if (weekFrom !== undefined) { params.push(Number(weekFrom)); where.push(`iso_week >= $${params.length}`); }
  if (weekTo !== undefined) { params.push(Number(weekTo)); where.push(`iso_week <= $${params.length}`); }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params };
};

const build_order_by = (field = "iso_year", dir = "asc") => {
  const validFields = new Set([
    "iso_year", "iso_week", "tasks_created", "tasks_completed",
    "completion_rate", "planned_minutes", "actual_minutes",
    "avg_completion_time_min", "created_at", "updated_at",
  ]);
  const f = validFields.has(field) ? field : "iso_year";
  const d = String(dir).toLowerCase() === "desc" ? "desc" : "asc";
  return `ORDER BY ${f} ${d}`;
};

const SELECT_FIELDS = `
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
`;

export const listWeeklyProductivity = async (params = {}) => {
  const { year, week, yearFrom, yearTo, weekFrom, weekTo, limit, offset, orderByField, orderByDir } = params;

  const { whereSql, params: whereParams } = build_where({ year, week, yearFrom, yearTo, weekFrom, weekTo });
  const orderBySql = build_order_by(orderByField, orderByDir);
  const { take, skip } = normalize_pagination(limit, offset);

  const countSql = `SELECT COUNT(*)::int AS total FROM weekly_productivity ${whereSql};`;
  const itemsSql = `
    SELECT ${SELECT_FIELDS}
    FROM weekly_productivity
    ${whereSql}
    ${orderBySql}
    LIMIT $${whereParams.length + 1}
    OFFSET $${whereParams.length + 2};
  `;

  const [countRow] = await wpRepo.queryRaw(countSql, ...whereParams);
  const items = await wpRepo.queryRaw(itemsSql, ...whereParams, take, skip);

  return { items, total: countRow?.total ?? 0 };
};

export const getWeeklyProductivityByYearWeek = async (isoYear, isoWeek) => {
  const sql = `
    SELECT ${SELECT_FIELDS}
    FROM weekly_productivity
    WHERE iso_year = $1 AND iso_week = $2
    LIMIT 1;
  `;
  const rows = await wpRepo.queryRaw(sql, Number(isoYear), Number(isoWeek));
  if (!rows.length) {
    const err = new Error(`Not found: year=${isoYear}, week=${isoWeek}`);
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

export const refreshWeeklyProductivity = async () => {
  try {
    await wpRepo.executeRaw(`REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_productivity;`);
  } catch (err) {
    if (String(err.message ?? "").includes("CONCURRENTLY")) {
      await wpRepo.executeRaw(`REFRESH MATERIALIZED VIEW weekly_productivity;`);
    } else {
      throw err;
    }
  }
  return { refreshed: true, at: new Date().toISOString() };
};
