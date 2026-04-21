import { recommendFromWeeklyStats } from "#services/llmService.js";
import { listWeeklyProductivity } from "#services/weeklyProductivityService.js";
import { ok } from "#utils/response.js";

const parse_int_or_null = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

/** GET /api/v1/llm/recommendations */
export async function getRecommendations(req, res, next) {
  try {
    const year = parse_int_or_null(req.query.year);
    const week = parse_int_or_null(req.query.week);
    const limitWeeks = parse_int_or_null(req.query.limitWeeks) ?? 8;

    const filters = {
      year: year ?? undefined,
      week: week ?? undefined,
      limit: limitWeeks,
      offset: 0,
    };

    const result = await listWeeklyProductivity(filters);
    const weeklyStats = result?.items ?? [];

    if (!weeklyStats.length) {
      const e = new Error("No weekly metrics available to generate recommendations");
      e.statusCode = 400;
      throw e;
    }

    const latest = weeklyStats[0];
    const summary =
      `Latest available week: ${latest.iso_year ?? latest.year}-W${latest.iso_week ?? latest.week}. ` +
      `Tasks created: ${latest.tasks_created ?? 0}. ` +
      `Completed: ${latest.tasks_completed ?? 0}. ` +
      `Planned/actual minutes: ${latest.planned_minutes ?? 0}/${latest.actual_minutes ?? 0}.`;

    const text = await recommendFromWeeklyStats({ weeklyStats, summary });

    return ok(res, "llm_recommendations", {
      inputWeeks: weeklyStats.length,
      text,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/v1/llm/chat */
export async function chatRaw(req, res, next) {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      const e = new Error("messages array is required");
      e.statusCode = 400;
      throw e;
    }

    const { chat } = await import("#services/llmService.js");
    const text = await chat(messages);

    return ok(res, "llm_chat", { text });
  } catch (err) {
    return next(err);
  }
}
