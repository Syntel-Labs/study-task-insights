import React, { useMemo } from "react";
import { Checkbox } from "@mui/material";
import styles from "@styles/tasks.module.scss";
import TaskRow from "./TaskRow.jsx";

/**
 * Tabla principal de tareas usando shape normalizado.
 *
 * Renderiza las filas a partir de `items` (array de tareas).
 * Gestiona la selección múltiple mediante checkboxes
 * y delega acciones individuales (editar, completar, eliminar, etc.)
 * al componente padre mediante callbacks.
 *
 * Props:
 * - items: lista de tareas
 * - loading: boolean, muestra “sin datos” si no hay tareas y no está cargando
 * - selectedIds: Set o array con ids seleccionados
 * - onToggleSelect: callback al seleccionar/deseleccionar una fila
 * - onToggleSelectAll: callback para seleccionar/deseleccionar todas
 * - onOpenDrawer, onEdit, onComplete, onArchive, onDelete: acciones por fila
 */
export default function TasksTable({
  items = [],
  loading = false,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  onOpenDrawer,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
}) {
  // Normalizamos selectedIds a un Set, por si viene como array
  const selectedSet = useMemo(
    () => (selectedIds instanceof Set ? selectedIds : new Set(selectedIds)),
    [selectedIds]
  );

  // Estado del checkbox del header (selección global)
  const allChecked =
    items.length > 0 && items.every((t) => selectedSet.has(t.id));
  const someChecked = items.some((t) => selectedSet.has(t.id));

  // Maneja el click en el checkbox principal
  function handleHeaderCheck(e) {
    onToggleSelectAll?.(e.target.checked);
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        {/* Encabezado de la tabla con control de selección general */}
        <thead>
          <tr>
            <th className={styles.colCheck}>
              <Checkbox
                size="small"
                checked={allChecked}
                indeterminate={!allChecked && someChecked}
                onChange={handleHeaderCheck}
              />
            </th>
            <th className={styles.colTitle}>Título</th>
            <th className={styles.colStatus}>Estado</th>
            <th className={styles.colPriority}>Prioridad</th>
            <th className={styles.colType}>Tipo</th>
            <th className={styles.colTags}>Tags</th>
            <th className={styles.colDue}>Vence</th>
            <th className={styles.colTime}>Tiempo</th>
            <th className={styles.colFinal}>Estado final</th>
            <th className={styles.colActions}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {/* Mensaje vacío cuando no hay datos */}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={10} className={styles.emptyCell}>
                Sin datos
              </td>
            </tr>
          )}

          {/* Render de cada fila de tarea */}
          {items.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={selectedSet.has(task.id)}
              onToggleSelect={onToggleSelect}
              onOpenDrawer={onOpenDrawer}
              onEdit={onEdit}
              onComplete={onComplete}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
