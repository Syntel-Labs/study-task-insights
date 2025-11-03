import React from "react";
import { Chip } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Muestra el tipo de tarea como Chip discreto (outlined).
 *
 * Props:
 * - type: { name }
 */
export default function TypeChip({ type }) {
  return (
    <Chip
      size="small"
      label={type?.name || "—"}
      variant="outlined"
      className={`${styles.chip} ${styles.chipType}`}
      sx={{
        borderColor: "var(--brand-primary-400)",
        color: "var(--brand-primary-600)",
        bgcolor: "var(--color-surface)",
      }}
    />
  );
}
