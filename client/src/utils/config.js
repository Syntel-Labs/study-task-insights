function requireEnv(v, key) {
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

const {
  VITE_BACKEND_BASE_URL,
  VITE_API_BASE_PATH,
  VITE_HEALTH_PATH,
  VITE_GATE_BASE_PATH,
} = import.meta.env;

// valida que las variables necesarias estén definidas
const backendBaseUrl = requireEnv(
  VITE_BACKEND_BASE_URL,
  "VITE_BACKEND_BASE_URL"
);
const apiBasePath = requireEnv(VITE_API_BASE_PATH, "VITE_API_BASE_PATH");
const healthPath = requireEnv(VITE_HEALTH_PATH, "VITE_HEALTH_PATH");
const gateBasePath = requireEnv(VITE_GATE_BASE_PATH, "VITE_GATE_BASE_PATH");

/* Concatenar url */
function joinUrl(base, path) {
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return p ? `${b}/${p}` : b;
}

export const backendBase = backendBaseUrl;
export const apiBase = joinUrl(backendBaseUrl, apiBasePath);
export const healthUrl = joinUrl(backendBaseUrl, healthPath);
export const gateBase = joinUrl(backendBaseUrl, gateBasePath);

// rutas conocidas de la API agrupadas por módulo
export const apiPaths = {
  catalogs: "catalogs",
  tasks: "tasks",
  taskTagAssignments: "task-tag-assignments",
  studySessions: "study-sessions",
  weeklyProductivity: "weekly-productivity",
  importBatch: "import/batch",
  llm: "llm",
};

// construye una URL completa agregando query params si se pasan
export function buildApiUrl(path = "", query) {
  const url = new URL(joinUrl(apiBase, path));
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

// genera URL para el gateway según el path indicado
export function buildGateUrl(path = "") {
  return joinUrl(gateBase, path);
}
