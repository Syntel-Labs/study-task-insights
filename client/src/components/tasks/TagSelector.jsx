import React from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
} from "@mui/material";
import styles from "@styles/tasks.module.scss";
import TagChips from "./TagChips.jsx";
import { useTaskTagAssignmentsApi } from "@utils/apiResources";

/**
 * Selector y gestor de tags para una tarea.
 *
 * Modo de uso:
 * - Sin `taskId`: solo UI, emite `onChange(newIds)`.
 * - Con `taskId`: realiza POST/DELETE en API y sincroniza assignments.
 *
 * Props:
 * - taskId?: string
 * - allTags: Array<{ taskTagId, name, color? }>
 * - selectedIds: Array<string>
 * - onChange?: (newIds: string[]) => void
 * - disabled?: boolean
 */
export default function TagSelector({
  taskId,
  allTags = [],
  selectedIds = [],
  onChange,
  disabled = false,
}) {
  const [toAddId, setToAddId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [assignMap, setAssignMap] = React.useState(() => new Map());
  const assignmentsApi = useTaskTagAssignmentsApi?.();

  React.useEffect(() => {
    if (!taskId || !assignmentsApi?.listByTask) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await assignmentsApi.listByTask({ taskId });
        const map = new Map();
        for (const it of res?.items || []) {
          map.set(
            it.taskTagId || it.task_tag_id,
            it.taskTagAssignmentId || it.task_tag_assignment_id
          );
        }
        if (!cancelled) setAssignMap(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId, assignmentsApi]);

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const available = React.useMemo(
    () =>
      allTags
        .filter((t) => !selectedSet.has(t.taskTagId))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTags, selectedSet]
  );

  async function addTag(tagId) {
    if (!tagId || selectedSet.has(tagId)) return;

    if (taskId && assignmentsApi?.add) {
      try {
        setLoading(true);
        await assignmentsApi.add({ taskId, taskTagId: tagId });

        const res = await assignmentsApi.listByTask({ taskId });
        const map = new Map();
        for (const it of res?.items || []) {
          map.set(
            it.taskTagId || it.task_tag_id,
            it.taskTagAssignmentId || it.task_tag_assignment_id
          );
        }
        setAssignMap(map);
      } finally {
        setLoading(false);
      }
    }

    onChange?.([...selectedIds, tagId]);
    setToAddId("");
  }

  async function removeTag(tagId) {
    if (!selectedSet.has(tagId)) return;

    if (taskId && assignmentsApi?.remove) {
      const assignId = assignMap.get(tagId);
      if (assignId) {
        try {
          setLoading(true);
          await assignmentsApi.remove({ ids: [assignId] });
          const newMap = new Map(assignMap);
          newMap.delete(tagId);
          setAssignMap(newMap);
        } finally {
          setLoading(false);
        }
      }
    }

    onChange?.(selectedIds.filter((id) => id !== tagId));
  }

  return (
    <Box className={styles.tagSelectorRoot}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        className={styles.addTagRow}
      >
        <FormControl size="small" className={styles.tagSelect} fullWidth>
          <InputLabel id="tag-toadd-label">Agregar tag</InputLabel>
          <Select
            labelId="tag-toadd-label"
            label="Agregar tag"
            value={toAddId}
            onChange={(e) => setToAddId(e.target.value)}
            disabled={disabled || loading || available.length === 0}
            MenuProps={{ disableScrollLock: true }}
          >
            {available.map((t) => (
              <MenuItem key={t.taskTagId} value={t.taskTagId}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={() => addTag(toAddId)}
          disabled={disabled || loading || !toAddId}
          className={styles.addTagBtn}
          sx={{
            bgcolor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
          }}
        >
          Agregar
        </Button>
      </Stack>

      <div className={styles.selectedTagsWrap}>
        {selectedIds.length === 0 ? (
          <span className={styles.emptyTagSpace}>&nbsp;</span>
        ) : (
          <div className={styles.tagsWrap}>
            {selectedIds.map((id) => {
              const tag = allTags.find((t) => t.taskTagId === id);
              if (!tag) return null;
              const sx = tag.color
                ? {
                    bgcolor: tag.color,
                    color: "var(--color-text-inverse)",
                    "& .MuiChip-label": { fontWeight: 600 },
                  }
                : {
                    bgcolor: "var(--neutral-200)",
                    color: "var(--color-text-secondary)",
                  };
              return (
                <Tooltip key={id} title={tag.name}>
                  <Chip
                    size="small"
                    label={tag.name}
                    onDelete={() => removeTag(id)}
                    className={`${styles.chip} ${styles.tagChip}`}
                    sx={sx}
                    disabled={disabled || loading}
                  />
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>
    </Box>
  );
}
