# Context: AuthContext.jsx

## Introduccion

Provee el estado y las acciones de autenticacion al arbol React. Encapsula login, logout, revalidacion silenciosa y dura, y reaccion a eventos externos (401 desde `useApi`, focus/visibility de la ventana).

## API expuesta

`useAuth()` retorna:

| Campo | Tipo | Proposito |
| --- | --- | --- |
| `isAuthenticated` | `boolean` | True si la cookie sigue siendo valida segun la ultima revalidacion |
| `loading` | `boolean` | True mientras corre la revalidacion inicial |
| `login(secret)` | funcion | Llama al gate, espera a que la sesion este lista, fija el flag local y arranca timers |
| `logout()` | funcion | Llama al gate logout, limpia flag, detiene timers |
| `refreshSession({ silent })` | funcion | Revalida explicitamente |

## Estado local

- `isAuthenticated`, `loading` — public state.
- `softTimerRef`, `hardTimerRef` — timers de revalidacion.
- `lastFocusCheckRef` — debounce del refresco al volver el foco (cada 30s max).

## Flag `stia_auth` en localStorage

Usado solo como hint del cliente para saber si tiene sentido revalidar al cargar. La verdad ultima esta en la cookie (que vive en el browser y la maneja el navegador). Si el flag dice "1" pero la cookie expiro, la revalidacion devuelve 401 y se limpia.

```js
function hasClientSessionFlag() {
  return localStorage.getItem("stia_auth") === "1";
}
```

## Timers

`scheduleSessionTimers()` programa dos timeouts a partir de `session.hours` y `session.revalidateMs` (ambos vienen de `utils/config.js`):

| Timer | Cuando dispara | Que hace |
| --- | --- | --- |
| Soft | `hours * 3600s - revalidateMs` | `refreshSession({ silent: true })` |
| Hard | `hours * 3600s` | Si la revalidacion falla, `logout()`. Si pasa, reagenda timers |

Soft existe para dar margen: si la cookie esta proxima a expirar, intenta renovarla en silencio antes de que el usuario note.

## Eventos externos

`AuthContext` escucha:

- `stia:unauthorized` — emitido por `useApi` cuando un fetch responde 401/403. Limpia el flag y desautentica.
- `window.focus` / `document.visibilitychange` — al recobrar el foco, revalida si han pasado mas de 30s desde la ultima.

## Login flow

```js
const login = useCallback(async (secret) => {
  await gateLogin({ secret });           // POST /gate/login -> set cookie
  const ready = await waitForSession();  // poll /healthz hasta tener cookie efectiva
  if (!ready) throw Error("...");
  localStorage.setItem("stia_auth", "1");
  setIsAuthenticated(true);
  scheduleSessionTimers();
}, [...]);
```

`waitForSession` hace hasta 8 polls con backoff exponencial (100, 200, 400, ... ms, max 1600). El backoff existe porque algunas implementaciones de cookies tardan un tick antes de aparecer en peticiones siguientes (especialmente cross-site con `SameSite=None`).

## Logout flow

```js
await gateLogout();              // POST /gate/logout
localStorage.removeItem("stia_auth");
setIsAuthenticated(false);
clearTimers();
```

El `try/finally` garantiza que el state local se limpia incluso si el backend falla en el logout.

## Por que revalida contra `/healthz`

`/healthz` es un endpoint barato (no toca DB ni LLM) y esta protegido por `accessGate` solo cuando `ACCESS_ENABLED=true`. En realidad **no** esta detras del gate (vive antes del middleware), asi que el cliente lo usa solo como ping con la cookie. Si en el futuro hay un endpoint dedicado para revalidar (`/gate/check`), este hook seria el unico lugar a tocar.

## Provider

`AuthProvider` se monta una vez en la raiz de la app (en `main.tsx` o equivalente). `App.tsx` usa `PrivateRoute`, que consume `useAuth` para redirigir a `/login` si `!isAuthenticated`.
