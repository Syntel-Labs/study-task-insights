import {
  listWeeklyProductivity,
  getWeeklyProductivityByYearWeek,
  refreshWeeklyProductivity,
} from "#services/weeklyProductivityService.js";

/** Listado de productividad semanal con filtros y paginación */
export const getList = async (req, res, next) => {
  try {
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
    } = req.query;

    const result = await listWeeklyProductivity({
      year: year !== undefined ? Number(year) : undefined,
      week: week !== undefined ? Number(week) : undefined,
      yearFrom: yearFrom !== undefined ? Number(yearFrom) : undefined,
      yearTo: yearTo !== undefined ? Number(yearTo) : undefined,
      weekFrom: weekFrom !== undefined ? Number(weekFrom) : undefined,
      weekTo: weekTo !== undefined ? Number(weekTo) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      orderByField: orderByField?.toString(),
      orderByDir: orderByDir?.toString(),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Obtiene un registro de productividad semanal específico por año y semana */
export const getOne = async (req, res, next) => {
  try {
    const { year, week } = req.params;
    const item = await getWeeklyProductivityByYearWeek(
      Number(year),
      Number(week)
    );
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/** Refresca la vista materializada de productividad semanal */
export const refresh = async (_req, res, next) => {
  try {
    const result = await refreshWeeklyProductivity();
    res.json(result);
  } catch (err) {
    next(err);
  }
};
