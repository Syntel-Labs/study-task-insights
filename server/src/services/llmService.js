import "dotenv/config";

const OLLAMA_URL = process.env.OLLAMA_URL;
const LLM_MODEL = process.env.LLM_MODEL;
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS);
const LLM_TEMPERATURE = Number(process.env.LLM_TEMPERATURE);

/** Verifica la presencia y validez de las variables de entorno */
function ensureEnv() {
  const missing = [];
  if (!OLLAMA_URL) missing.push("OLLAMA_URL");
  if (!LLM_MODEL) missing.push("LLM_MODEL");
  if (!Number.isFinite(LLM_TIMEOUT_MS)) missing.push("LLM_TIMEOUT_MS");
  if (!Number.isFinite(LLM_TEMPERATURE)) missing.push("LLM_TEMPERATURE");
  if (missing.length) {
    const err = new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
    err.statusCode = 500;
    throw err;
  }
}
ensureEnv();

/** Envía una petición POST con JSON al servidor de Ollama con manejo de timeout */
async function postJson(path, payload, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`OLLAMA ${res.status}: ${text || res.statusText}`);
      err.statusCode = 503;
      throw err;
    }

    return await res.json();
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error("Timeout al invocar LLM");
      err.statusCode = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

/* Envía una conversación al modelo LLM y devuelve el texto generado con formato (role, content) */
export async function chat(messages) {
  const payload = {
    model: LLM_MODEL,
    messages,
    stream: false,
    options: { temperature: LLM_TEMPERATURE },
  };

  const data = await postJson("/api/chat", payload, LLM_TIMEOUT_MS);
  const text = data?.message?.content ?? data?.response ?? "";
  return String(text || "").trim();
}

/* Genera recomendaciones de estudio basadas en métricas semanales. */
export async function recommendFromWeeklyStats({ weeklyStats, summary = "" }) {
  const compact = (weeklyStats || []).map((w) => ({
    year: w.iso_year ?? w.year ?? w.isoYear ?? null,
    week: w.iso_week ?? w.week ?? w.isoWeek ?? null,
    created: w.tasks_created ?? w.tasksCreated ?? 0,
    completed: w.tasks_completed ?? w.tasksCompleted ?? 0,
    completionRate: w.completion_rate ?? w.completionRate ?? 0,
    plannedMin: w.planned_minutes ?? w.plannedMin ?? 0,
    actualMin: w.actual_minutes ?? w.actualMin ?? 0,
  }));

  // contexto del modelo: tono, idioma y objetivo del análisis
  const systemMsg = {
    role: "system",
    content:
      "Eres un analista académico. Responde en español, claro y conciso. Entrega entre 3 y 6 recomendaciones accionables y priorizadas para mejorar la productividad de estudio. Usa viñetas.",
  };

  // instrucción del usuario con resumen y datos compactos
  const userMsg = {
    role: "user",
    content:
      `Resumen: ${summary || "sin resumen"}\n` +
      `Métricas (JSON compacto): ${JSON.stringify(compact).slice(0, 12000)}`,
  };

  return await chat([systemMsg, userMsg]);
}
