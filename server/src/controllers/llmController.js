import { recommendFromWeeklyStats } from "#services/llmService.js";
import { listWeeklyProductivity } from "#services/weeklyProductivityService.js";

function parseIntOrNull(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

/** Controlador que obtiene métricas semanales y genera recomendaciones del modelo LLM */
export async function getRecommendations(req, res, next) {
  try {
    const year = parseIntOrNull(req.query.year);
    const week = parseIntOrNull(req.query.week);
    const limitWeeks = parseIntOrNull(req.query.limitWeeks) ?? 8;

    // se consultan las métricas semanales con los filtros recibidos
    const filters = {
      year: year ?? undefined,
      week: week ?? undefined,
      limit: limitWeeks,
      offset: 0,
    };
    const result = await listWeeklyProductivity(filters);
    const weeklyStats = result?.items ?? [];

    if (!weeklyStats.length) {
      return res.status(400).json({
        error: true,
        message: "No hay métricas disponibles para generar recomendaciones.",
      });
    }

    // se genera un resumen simple para contextualizar al modelo
    const latest = weeklyStats[0];
    const summary =
      `Última semana disponible: ${latest.iso_year ?? latest.year}-W${
        latest.iso_week ?? latest.week
      }. ` +
      `Tareas creadas: ${latest.tasks_created ?? 0}. ` +
      `Completadas: ${latest.tasks_completed ?? 0}. ` +
      `Min. planificados/actuales: ${latest.planned_minutes ?? 0}/${
        latest.actual_minutes ?? 0
      }.`;

    // se solicita la recomendación al servicio LLM
    const text = await recommendFromWeeklyStats({ weeklyStats, summary });

    return res.json({
      ok: true,
      model: process.env.LLM_MODEL,
      inputWeeks: weeklyStats.length,
      text,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    return next(err);
  }
}

/** Controlador de chat raw con el modelo LLM (passthrough controlado) */
export async function chatRaw(req, res, next) {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      return res
        .status(400)
        .json({ error: true, message: "messages requerido" });
    }

    // se delega la llamada al servicio del LLM
    const { chat } = await import("#services/llmService.js");
    const text = await chat(messages);

    return res.json({ ok: true, model: process.env.LLM_MODEL, text });
  } catch (err) {
    return next(err);
  }
}
