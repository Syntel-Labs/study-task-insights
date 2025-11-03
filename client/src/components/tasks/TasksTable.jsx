import React, { useMemo } from "react";
import { IconButton, Tooltip, Checkbox } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faCheckCircle,
  faBoxArchive,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import PriorityChip from "./PriorityChip.jsx";
import TypeChip from "./TypeChip.jsx";
import TagChips from "./TagChips.jsx";
import DueDateCell from "./DueDateCell.jsx";
import styles from "@styles/tasks.module.scss";

/**
 * Tabla principal de tareas (solo render).
 *
 * Props:
 * - items: array de tareas
 * - loading: boolean
 * - selectedIds: Set o array de IDs seleccionados
 * - onToggleSelect(id), onToggleSelectAll(checked)
 * - onOpenDrawer(task), onEdit(task), onComplete(task), onArchive(task), onDelete(task)
 * - orderByField, orderByDir (solo para referencia, no hay orden local)
 * - catálogos para fallbacks: statuses, priorities, types, tagsCatalog
 *
 * Renderiza:
 * - Checkbox de selección
 * - Título + descripción
 * - Prioridad, Tipo, Tags
 * - Vencimiento (DueDateCell)
 * - Tiempo estimado/real
 * - Estado final (Abierta/Completada/Archivada)
 * - Botones de acción (Editar, Completar, Archivar, Eliminar)
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
  orderByField,
  orderByDir,
  statuses = [],
  priorities = [],
  types = [],
  tagsCatalog = [],
}) {
  const selectedSet = useMemo(
    () => (selectedIds instanceof Set ? selectedIds : new Set(selectedIds)),
    [selectedIds]
  );

  // Mapas para fallback cuando include no trae objetos anidados
  const mStatus = useMemo(() => {
    const m = new Map();
    statuses.forEach((s) => m.set(s.taskStatusId, s));
    return m;
  }, [statuses]);

  const mPriority = useMemo(() => {
    const m = new Map();
    priorities.forEach((p) => m.set(p.taskPriorityId, p));
    return m;
  }, [priorities]);

  const mType = useMemo(() => {
    const m = new Map();
    types.forEach((t) => m.set(t.taskTypeId, t));
    return m;
  }, [types]);

  const mTag = useMemo(() => {
    const m = new Map();
    tagsCatalog.forEach((t) => m.set(t.taskTagId, t));
    return m;
  }, [tagsCatalog]);

  const allChecked =
    items.length > 0 &&
    items.every((t) => selectedSet.has(t.task_id || t.taskId));
  const someChecked = items.some((t) => selectedSet.has(t.task_id || t.taskId));

  function handleHeaderCheck(e) {
    onToggleSelectAll?.(e.target.checked);
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
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
            <th className={styles.colTitle}>
              <span className={styles.thLabel}>Título</span>
            </th>
            <th className={styles.colPriority}>
              <span className={styles.thLabel}>Prioridad</span>
            </th>
            <th className={styles.colType}>
              <span className={styles.thLabel}>Tipo</span>
            </th>
            <th className={styles.colTags}>
              <span className={styles.thLabel}>Tags</span>
            </th>
            <th className={styles.colDue}>
              <span className={styles.thLabel}>Vence</span>
            </th>
            <th className={styles.colTime}>
              <span className={styles.thLabel}>Tiempo</span>
            </th>
            <th className={styles.colFinal}>
              <span className={styles.thLabel}>Estado final</span>
            </th>
            <th className={styles.colActions}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={9} className={styles.emptyCell}>
                Sin datos
              </td>
            </tr>
          )}

          {items.map((task) => {
            const id = task.task_id || task.taskId;
            const checked = selectedSet.has(id);

            const statusObj = task.task_status || task.taskStatus || null;
            const priorityObj = task.task_priority || task.taskPriority || null;
            const typeObj = task.task_type || task.taskType || null;

            // Fallbacks por ID
            const status =
              statusObj ||
              (typeof task.taskStatusId === "number"
                ? mStatus.get(task.taskStatusId)
                : null) ||
              (typeof task.task_status_id === "number"
                ? mStatus.get(task.task_status_id)
                : null);

            const priority =
              priorityObj ||
              (typeof task.taskPriorityId === "number"
                ? mPriority.get(task.taskPriorityId)
                : null) ||
              (typeof task.task_priority_id === "number"
                ? mPriority.get(task.task_priority_id)
                : null);

            const type =
              typeObj ||
              (typeof task.taskTypeId === "number"
                ? mType.get(task.taskTypeId)
                : null) ||
              (typeof task.task_type_id === "number"
                ? mType.get(task.task_type_id)
                : null);

            const tagsArray =
              task.task_tags ||
              task.tags ||
              (Array.isArray(task.taskTagIds)
                ? task.taskTagIds.map((tid) => mTag.get(tid)).filter(Boolean)
                : Array.isArray(task.task_tag_ids)
                ? task.task_tag_ids.map((tid) => mTag.get(tid)).filter(Boolean)
                : []);

            const isCompleted = !!task.completed_at || !!task.completedAt;
            const isArchived = !!task.archived_at || !!task.archivedAt;

            const estimated = task.estimated_min || task.estimatedMin || 0;
            const actual = task.actual_min || task.actualMin;

            return (
              <tr
                key={id}
                className={styles.rowClickable}
                onDoubleClick={() => onOpenDrawer?.(task)}
                title="Doble clic para ver detalle"
              >
                <td className={styles.cellCheck}>
                  <Checkbox
                    size="small"
                    checked={checked}
                    onChange={() => onToggleSelect?.(id)}
                  />
                </td>

                <td className={styles.cellTitle}>
                  <button
                    type="button"
                    className={styles.titleBtn}
                    onClick={() => onOpenDrawer?.(task)}
                  >
                    {task.title}
                  </button>
                  {task.description && (
                    <div className={styles.subtitleMuted}>
                      {task.description}
                    </div>
                  )}
                </td>

                <td className={styles.cellPriority}>
                  {priority ? (
                    <PriorityChip priority={priority} />
                  ) : (
                    <span className={styles.dim}>—</span>
                  )}
                </td>

                <td className={styles.cellType}>
                  {type ? (
                    <TypeChip type={type} />
                  ) : (
                    <span className={styles.dim}>—</span>
                  )}
                </td>

                <td className={styles.cellTags}>
                  <TagChips tags={tagsArray} />
                </td>

                <td className={styles.cellDue}>
                  <DueDateCell
                    dueAt={task.due_at || task.dueAt}
                    completed={isCompleted}
                  />
                </td>

                <td className={styles.cellTime}>
                  <span className={styles.timePair}>
                    {estimated || 0} / {actual ?? "—"}&nbsp;min
                  </span>
                </td>

                <td className={styles.cellFinal}>
                  {isCompleted ? (
                    <span className={styles.badgeSuccess}>Completada</span>
                  ) : isArchived ? (
                    <span className={styles.badgeMuted}>Archivada</span>
                  ) : (
                    <span className={styles.badgeOpen}>Abierta</span>
                  )}
                </td>

                <td className={styles.cellActions}>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      className={styles.iconBtn}
                      onClick={() => onEdit?.(task)}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Completar">
                    <IconButton
                      size="small"
                      className={styles.iconBtn}
                      onClick={() => onComplete?.(task)}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Archivar">
                    <IconButton
                      size="small"
                      className={styles.iconBtn}
                      onClick={() => onArchive?.(task)}
                    >
                      <FontAwesomeIcon icon={faBoxArchive} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      className={styles.iconBtnDanger}
                      onClick={() => onDelete?.(task)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </IconButton>
                  </Tooltip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
