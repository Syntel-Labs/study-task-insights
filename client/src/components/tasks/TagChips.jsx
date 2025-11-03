import React from "react";
import { Chip, Tooltip } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Lista de chips de tags con color opcional.
 *
 * Props:
 * - tags: array de objetos { taskTagId, name, color? }
 * - max: número máximo de tags visibles (default 4)
 */
export default function TagChips({ tags = [], max = 4 }) {
  if (!tags.length) return <span className={styles.muted}>&mdash;</span>;

  const visible = tags.slice(0, max);
  const rest = tags.length - visible.length;

  return (
    <div className={styles.tagsWrap}>
      {visible.map((t) => {
        const key = t.taskTagId || t.id || t.name;
        const hasColor = !!t.color;
        const sx = hasColor
          ? {
              bgcolor: t.color,
              color: "var(--color-text-inverse)",
              "& .MuiChip-label": { fontWeight: 600 },
            }
          : {
              bgcolor: "var(--neutral-200)",
              color: "var(--color-text-secondary)",
            };

        const chip = (
          <Chip
            key={key}
            size="small"
            label={t.name}
            className={`${styles.chip} ${styles.tagChip}`}
            sx={sx}
          />
        );

        return hasColor ? (
          <Tooltip key={key} title={t.name}>
            {chip}
          </Tooltip>
        ) : (
          chip
        );
      })}

      {rest > 0 && (
        <Chip
          size="small"
          label={`+${rest}`}
          className={`${styles.chip} ${styles.tagChipMore}`}
          variant="outlined"
          sx={{
            borderColor: "var(--neutral-300)",
            color: "var(--color-text-secondary)",
          }}
        />
      )}
    </div>
  );
}
