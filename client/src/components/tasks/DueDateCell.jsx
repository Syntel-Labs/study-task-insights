import React from "react";
import styles from "@styles/tasks.module.scss";

/**
 * Celda de fecha de vencimiento para una tarea.
 *
 * Muestra la fecha en formato `día-mes` y aplica estilos según:
 * - Tarea vencida
 * - Tarea para hoy
 * - Tarea futura
 *
 * Props:
 * - dueAt: fecha de vencimiento (Date | string)
 * - completed: boolean, indica si la tarea ya está completada
 */
export default function DueDateCell({ dueAt, completed }) {
  if (!dueAt) return <span className={styles.dim}>—</span>;

  const d = new Date(dueAt);
  const today = new Date();
  const ymd = (x) => [x.getFullYear(), x.getMonth(), x.getDate()].join("-");
  const isToday = ymd(d) === ymd(today);

  let cls = styles.dueCell;
  let label = d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
  });

  if (!completed) {
    if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      cls += " " + styles.dueOverdue;
    else if (isToday) cls += " " + styles.dueToday;
    else cls += " " + styles.dueSoon;
  }

  return <span className={cls}>{label}</span>;
}
