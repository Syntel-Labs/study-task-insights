# Pages

## Introduccion

Vistas top-level del SPA. Cada archivo en `client/src/pages/` corresponde a una ruta declarada en `App.tsx`. Las paginas componen layout, kpis, tablas y dialogos a partir de `components/` y orquestan llamadas via los hooks de `hooks/api/` y los hooks de UI (`useTasksFilters`, `useTasksMutations`).

## Inventario

| Pagina | Ruta | Proposito |
| --- | --- | --- |
| `LoginPage.tsx` | `/login` | Formulario del gate. Llama a `useAuth().login(secret)` |
| `DashboardPage.tsx` | `/dashboard` | KPIs y tendencia semanal. Compone `DashboardKpis`, `DashboardDistribution`, `WeeklyTrendSection` |
| `TasksPage.tsx` | `/tasks` | Tabla de tareas con filtros, bulk actions y modales. Usa `useTasksFilters` + `useTasksMutations` |
| `LlmPage.tsx` | `/llm` | Chat con el modelo (recomendaciones por semana y chat raw) |
| `CatalogsPage.tsx` | `/catalogs` | CRUD de los cinco catalogos |
| `NotFoundPage.tsx` | `*` | Fallback 404 |

## Routing

Definido en `src/App.tsx`:

```tsx
<Routes>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/login" element={<LoginPage />} />

  <Route element={<PrivateRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/catalogs" element={<CatalogsPage />} />
      <Route path="/llm" element={<LlmPage />} />
    </Route>
  </Route>

  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

`PrivateRoute` lee `useAuth()`; si `!isAuthenticated`, redirige a `/login`. Las rutas privadas comparten el shell de `AppLayout` (sidebar, top bar, container).

## Convenciones

- Una pagina por archivo, sin sub-rutas internas.
- La pagina decide loading/error states, pero delega la presentacion a `components/`.
- Las llamadas a la API van por hooks (`useTasksApi`, `useCatalogsApi`, etc.); nada de `fetch` directo en paginas.
- Los hooks de filtros/mutations son por pagina (no globales) para no contaminar el contexto.
