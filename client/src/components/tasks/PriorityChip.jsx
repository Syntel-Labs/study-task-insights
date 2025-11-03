import React, { useMemo } from "react";
import { Chip } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Muestra un Chip de prioridad según el weight.
 *
 * Props:
 * - priority: objeto { name, weight? }
 *   - weight: menor valor = mayor prioridad
 *     - ≤1: alta
 *     - ≤2: media
 *     - >2: baja
 */
export default function PriorityChip({ priority }) {
  const { label, tone } = useMemo(() => {
    if (!priority) return { label: "—", tone: "neutral" };
    const w = Number(priority.weight ?? 0);
    if (w <= 1) return { label: priority.name, tone: "high" };
    if (w <= 2) return { label: priority.name, tone: "medium" };
    return { label: priority.name, tone: "low" };
  }, [priority]);

  const sx =
    tone === "high"
      ? { bgcolor: "var(--color-error)", color: "var(--color-text-inverse)" }
      : tone === "medium"
      ? { bgcolor: "var(--warning-500)", color: "var(--color-text-inverse)" }
      : tone === "low"
      ? { bgcolor: "var(--color-success)", color: "var(--color-text-inverse)" }
      : { bgcolor: "var(--neutral-200)", color: "var(--color-text-secondary)" };

  return (
    <Chip
      size="small"
      label={label}
      className={`${styles.chip} ${styles.chipPriority}`}
      sx={sx}
    />
  );
}
