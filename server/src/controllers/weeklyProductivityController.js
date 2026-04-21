import {
  listWeeklyProductivity,
  getWeeklyProductivityByYearWeek,
  refreshWeeklyProductivity,
} from "#services/weeklyProductivityService.js";
import { ok, paginationMeta } from "#utils/response.js";

/** GET /api/v1/weekly-productivity */
export const getList = async (req, res, next) => {
  try {
    const {
      year,
      week,
      yearFrom,
      yearTo,
      weekFrom,
      weekTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = req.query;

    const parsedPage = page !== undefined ? Math.max(1, Number(page)) : 1;
    const parsedPageSize =
      pageSize !== undefined ? Math.min(200, Math.max(1, Number(pageSize))) : 50;
    const offset = (parsedPage - 1) * parsedPageSize;

    const result = await listWeeklyProductivity({
      year: year !== undefined ? Number(year) : undefined,
      week: week !== undefined ? Number(week) : undefined,
      yearFrom: yearFrom !== undefined ? Number(yearFrom) : undefined,
      yearTo: yearTo !== undefined ? Number(yearTo) : undefined,
      weekFrom: weekFrom !== undefined ? Number(weekFrom) : undefined,
      weekTo: weekTo !== undefined ? Number(weekTo) : undefined,
      limit: parsedPageSize,
      offset,
      orderByField: sortBy?.toString(),
      orderByDir: sortOrder?.toString(),
    });

    return ok(
      res,
      "weekly_productivity_list",
      result.items,
      paginationMeta(parsedPage, parsedPageSize, result.total)
    );
  } catch (err) {
    return next(err);
  }
};

/** GET /api/v1/weekly-productivity/:year/:week */
export const getOne = async (req, res, next) => {
  try {
    const { year, week } = req.params;
    const item = await getWeeklyProductivityByYearWeek(
      Number(year),
      Number(week)
    );
    return ok(res, "weekly_productivity_found", item);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/v1/weekly-productivity/refresh */
export const refresh = async (_req, res, next) => {
  try {
    const result = await refreshWeeklyProductivity();
    return ok(res, "weekly_productivity_refreshed", result);
  } catch (err) {
    return next(err);
  }
};
