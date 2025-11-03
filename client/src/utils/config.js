// valida que existan las variables de entorno requeridas en tiempo de build
function requireEnv(v, key) {
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

const {
  VITE_BACKEND_BASE_URL,
  VITE_API_BASE_PATH,
  VITE_HEALTH_PATH,
  VITE_GATE_BASE_PATH,
  VITE_SESSION_HOURS,
  VITE_SESSION_REVALIDATE_MARGIN_MIN,
} = import.meta.env;

// lectura y validación de variables principales
const backendBaseUrl = requireEnv(
  VITE_BACKEND_BASE_URL,
  "VITE_BACKEND_BASE_URL"
);
const apiBasePath = requireEnv(VITE_API_BASE_PATH, "VITE_API_BASE_PATH");
const healthPath = requireEnv(VITE_HEALTH_PATH, "VITE_HEALTH_PATH");
const gateBasePath = requireEnv(VITE_GATE_BASE_PATH, "VITE_GATE_BASE_PATH");

// une rutas evitando slashes duplicados
function joinUrl(base, path) {
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return p ? `${b}/${p}` : b;
}

// bases públicas
export const backendBase = backendBaseUrl;
export const apiBase = joinUrl(backendBaseUrl, apiBasePath);
export const healthUrl = joinUrl(backendBaseUrl, healthPath);
export const gateBase = joinUrl(backendBaseUrl, gateBasePath);

// rutas de la API agrupadas por módulo (relativas a apiBase)
export const apiPaths = {
  catalogs: "catalogs",
  tasks: "tasks",
  taskTagAssignments: "task-tag-assignments",
  studySessions: "study-sessions",
  weeklyProductivity: "weekly-productivity",
  importBatch: "import/batch",
  llm: "llm",
};

// arma una URL completa agregando query params si se proporcionan
export function buildApiUrl(path = "", query) {
  const url = new URL(joinUrl(apiBase, path));
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;

      if (Array.isArray(v)) {
        // agrega un param por cada elemento del array
        v.forEach((val) => url.searchParams.append(k, String(val)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }

  return url.toString();
}

// genera URL para gateway según el path recibido
export function buildGateUrl(path = "") {
  return joinUrl(gateBase, path);
}

/* configuración de sesión usada en el frontend.
   se usa para controlar tiempos de expiración y revalidación */
const SESSION_HOURS = Number(VITE_SESSION_HOURS ?? "2");
const REVALIDATE_MARGIN_MIN = Number(VITE_SESSION_REVALIDATE_MARGIN_MIN ?? "5");

export const session = {
  hours: Number.isFinite(SESSION_HOURS) ? SESSION_HOURS : 2,
  revalidateMs:
    (Number.isFinite(REVALIDATE_MARGIN_MIN) ? REVALIDATE_MARGIN_MIN : 5) *
    60 *
    1000,
};
