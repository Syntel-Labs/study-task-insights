# Components

## Introduccion

Componentes presentacionales y de dominio del SPA. Organizados por area funcional. Los archivos en la raiz de `components/` son atajos compartidos entre paginas.

## Estructura

```bash
client/src/components/
|-- AppLayout.tsx         # shell con sidebar, top bar, outlet
|-- PrivateRoute.tsx      # wrapper de ruta protegida (consume useAuth)
|-- catalogs/             # tabla y dialog de catalogos
|-- dashboard/            # kpis, distribucion, trend semanal
|-- tasks/                # tabla, filtros, bulk actions, modales, chips
`-- ui/                   # primitivas estilo shadcn/ui (button, card, dialog, ...)
```

## Capas

| Capa | Archivos | Caracteristica |
| --- | --- | --- |
| Layout | `AppLayout`, `PrivateRoute` | Estructura global, no estado de dominio |
| Dominio | `catalogs/`, `dashboard/`, `tasks/` | Renderizan datos de la API; estilizan con `ui/` |
| Primitivas | `ui/` | Sin logica de dominio. Reutilizables |

## tasks/

Conjunto mas grande, dado que `TasksPage` es la mas compleja:

| Archivo | Proposito |
| --- | --- |
| `TasksTable.tsx`, `TaskRow.tsx`, `SortableHeader.tsx` | Tabla y celdas |
| `TasksFilters.tsx`, `TagSelector.tsx` | Panel de filtros (consume `useTasksFilters`) |
| `BulkActionsBar.tsx`, `ConfirmDialog.tsx` | Operaciones en lote |
| `TaskModal.tsx`, `TaskDrawer.tsx` | Crear/editar tarea |
| `MiniProgressBar.tsx`, `PriorityChip.tsx`, `StatusBadge.tsx`, `TagChips.tsx`, `TypeChip.tsx`, `DueDateCell.tsx` | Visualizadores compactos |
| `EmptyState.tsx`, `ErrorState.tsx`, `PaginationControls.tsx`, `TasksHeader.tsx`, `TasksKpis.tsx` | Auxiliares de pagina |

## dashboard/

| Archivo | Proposito |
| --- | --- |
| `DashboardHeader.tsx` | Titulo + filtros temporales |
| `DashboardKpis.tsx` | Tarjetas con metricas agregadas |
| `DashboardDistribution.tsx` | Grafica de distribucion (status, priority) |
| `WeeklyTrendSection.tsx` | Linea/area de productividad semanal |

## catalogs/

| Archivo | Proposito |
| --- | --- |
| `CatalogTable.tsx` | Tabla generica para los cinco catalogos |
| `CatalogDialog.tsx` | Crear/editar registro |

## ui/

Primitivas estilo shadcn/ui: `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `progress`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`, `alert`, `badge`, `chart`, `checkbox`.

No documento cada uno individualmente porque son envoltorios delgados sobre Radix/MUI con convenciones de estilo del repo. Cuando agregues uno nuevo, mantener la firma compatible y exportar named, no default.

## Convenciones

- Sin estado global; cada componente recibe lo que renderiza por props.
- Toasts y side effects van en hooks (`useTasksMutations`), no aqui.
- TypeScript con tipos compartidos en `types/`. JS solo en codigo legacy aun no migrado.
- Los componentes de dominio dependen de `ui/`, nunca al reves.
