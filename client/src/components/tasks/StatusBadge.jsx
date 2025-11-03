import React, { useMemo } from "react";
import { Chip } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Chip que muestra el estado de una tarea.
 *
 * Props:
 * - status: objeto con { name, code?, isFinal? }
 *   - code: string opcional para determinar estilo (archived, done, block, prog, etc.)
 *   - isFinal: boolean, indica si el estado es final
 */
export default function StatusBadge({ status }) {
  const { label, color, variant } = useMemo(() => {
    if (!status) return { label: "—", color: "default", variant: "outlined" };

    const code = (status.code || "").toLowerCase();
    const isFinal = !!status.isFinal;

    if (code.includes("arch") || code.includes("archive"))
      return { label: status.name, color: "default", variant: "filled-muted" };
    if (isFinal || code.includes("done") || code.includes("complete"))
      return { label: status.name, color: "success", variant: "filled" };
    if (code.includes("block") || code.includes("cancel"))
      return { label: status.name, color: "error", variant: "filled" };
    if (code.includes("prog"))
      return { label: status.name, color: "primary", variant: "outlined" };

    return { label: status.name, color: "default", variant: "outlined" };
  }, [status]);

  const sx =
    color === "success"
      ? { bgcolor: "var(--color-success)", color: "var(--color-text-inverse)" }
      : color === "error"
      ? { bgcolor: "var(--color-error)", color: "var(--color-text-inverse)" }
      : color === "primary"
      ? {
          bgcolor: "var(--color-primary-weak, var(--brand-primary-50))",
          color: "var(--color-primary)",
        }
      : variant === "filled-muted"
      ? { bgcolor: "var(--neutral-200)", color: "var(--color-text-secondary)" }
      : {};

  return (
    <Chip
      size="small"
      label={label}
      className={`${styles.chip} ${styles.chipStatus}`}
      sx={sx}
      variant={variant.startsWith("filled") ? "filled" : "outlined"}
    />
  );
}
