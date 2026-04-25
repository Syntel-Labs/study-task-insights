# Hook: useApi.js

## Introduccion

Cliente HTTP base. Envuelve `fetch` con manejo uniforme de cookies (`credentials: "include"`), serializacion JSON, parseo de la respuesta y propagacion de errores con shape coherente. Todos los hooks de `hooks/api/*` lo usan.

## API

`useApi()` devuelve cinco metodos:

| Metodo | Firma |
| --- | --- |
| `request(path, options)` | base; los siguientes son atajos |
| `get(path, query?)` | `GET` con query opcional |
| `post(path, body, query?)` | `POST` con body JSON |
| `put(path, body, query?)` | `PUT` con body JSON |
| `patch(path, body, query?)` | `PATCH` con body JSON |
| `del(path, opts?)` | `DELETE` (acepta `body` para bulk delete) |

`path` es relativo a `apiBase`; `query` se pasa a `buildApiUrl` para construir la URL final.

## Detalles del request

```js
resp = await fetch(url, {
  method,
  headers: finalHeaders,
  body: useJson && body ? JSON.stringify(body) : body,
  credentials: "include",
});
```

- `credentials: "include"` envia la cookie `stia_session` en cross-site (necesario en el escenario CF).
- Si `useJson=true` (default), agrega `Content-Type: application/json` automaticamente cuando hay body.
- `useJson=false` permite enviar `FormData` o `Blob` sin que el hook fuerce JSON.

## Manejo de 401/403

```js
if (resp.status === 401 || resp.status === 403) {
  window.dispatchEvent(new CustomEvent("stia:unauthorized"));
}
```

Cuando el backend rechaza por sesion invalida, se emite un evento global que `AuthContext` escucha para limpiar el flag local y forzar re-login. Asi un 401 en cualquier hook propaga al state de auth sin acoplar el cliente HTTP a React Context.

## Parseo de respuesta

- Lee el body **una vez** via `clone()` para poder reintentar el parseo.
- Si `Content-Type: application/json`: `JSON.parse`.
- Si no: devuelve el texto crudo.
- Si la respuesta no es OK, lanza un `Error` con `status` y `payload` del backend para que el llamador acceda al codigo y mensaje uniformes.

## `bulkify`

Helper exportado por el hook:

```js
export function bulkify(input) {
  return Array.isArray(input) ? input : [input];
}
```

Los endpoints CUD del backend aceptan tanto un objeto como un array (bulk). `bulkify` normaliza al lado del cliente para que los hooks de dominio siempre manden array.

## Ejemplo

```js
const { get } = useApi();
const result = await get("tasks", { include: "all", page: 1 });
// result tiene shape { code, message, data, meta }
```
