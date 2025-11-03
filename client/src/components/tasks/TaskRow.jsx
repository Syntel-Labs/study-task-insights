import React, { useMemo } from "react";
import { Checkbox, IconButton, Tooltip } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faCheckCircle,
  faBoxArchive,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import StatusBadge from "./StatusBadge.jsx";
import PriorityChip from "./PriorityChip.jsx";
import TypeChip from "./TypeChip.jsx";
import TagChips from "./TagChips.jsx";
import DueDateCell from "./DueDateCell.jsx";
import styles from "@styles/tasks.module.scss";

/**
 * Fila de tarea para TasksTable.
 *
 * Props:
 * - task: objeto de tarea
 * - selected: boolean
 * - onToggleSelect: (id) => void
 * - onOpenDrawer: (task) => void
 * - onEdit: (task) => void
 * - onComplete: (task) => void
 * - onArchive: (task) => void
 * - onDelete: (task) => void
 */
export default function TaskRow({
  task,
  selected = false,
  onToggleSelect,
  onOpenDrawer,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
}) {
  const id = useMemo(() => task.task_id || task.taskId, [task]);

  const status = task.task_status || task.taskStatus;
  const priority = task.task_priority || task.taskPriority;
  const type = task.task_type || task.taskType;
  const tags = task.task_tags || task.tags || [];

  const isCompleted = !!(task.completed_at || task.completedAt);
  const isArchived = !!(task.archived_at || task.archivedAt);

  const estimated = task.estimated_min ?? task.estimatedMin ?? 0;
  const actual = task.actual_min ?? task.actualMin;

  return (
    <tr className={styles.row} onDoubleClick={() => onOpenDrawer?.(task)}>
      <td className={styles.cellCheck}>
        <Checkbox
          size="small"
          checked={!!selected}
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
          <div className={styles.subtitleMuted}>{task.description}</div>
        )}
      </td>

      <td className={styles.cellChips}>
        {status && <StatusBadge status={status} />}
        {priority && <PriorityChip priority={priority} />}
        {type && <TypeChip type={type} />}
      </td>

      <td className={styles.cellTags}>
        <TagChips tags={tags} />
      </td>

      <td className={styles.cellDue}>
        <DueDateCell
          dueAt={task.due_at || task.dueAt}
          completed={isCompleted}
        />
      </td>

      <td className={styles.cellTime}>
        <span className={styles.timePair}>
          {estimated} / {actual ?? "—"} min
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
}
