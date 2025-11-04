import React from "react";
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
 * Fila de tarea dentro de la tabla de tareas.
 *
 * Muestra los datos principales de la tarea y sus acciones asociadas.
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
  const id = task.id;
  const status = task.status;
  const priority = task.priority;
  const type = task.type;
  const tags = task.tags || [];

  const isCompleted = !!task.completedAt;
  const isArchived = !!task.archivedAt;

  const estimated = task.estimatedMin ?? 0;
  const actual = task.actualMin;

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

      <td className={styles.cellStatus}>
        {status && <StatusBadge status={status} />}
      </td>

      <td className={styles.cellPriority}>
        {priority && <PriorityChip priority={priority} />}
      </td>

      <td className={styles.cellType}>{type && <TypeChip type={type} />}</td>

      <td className={styles.cellTags}>
        <TagChips tags={tags} />
      </td>

      <td className={styles.cellDue}>
        <DueDateCell dueAt={task.dueAt} completed={isCompleted} />
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
