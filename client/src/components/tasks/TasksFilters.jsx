import React, { useMemo } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { toIsoDateString } from "@utils/dates";
import TagSelector from "./TagSelector.jsx";
import styles from "@styles/tasks.module.scss";

/**
 * Filtros avanzados de tareas.
 *
 * Props:
 * - statusId, priorityId, typeId, termId: IDs seleccionadas
 * - tagIds: array de IDs de tags
 * - dueFrom, dueTo: fechas límite (Date o ISO string)
 * - statuses, priorities, types, terms, tags: catálogos para selects
 * - onChangeStatus, onChangePriority, onChangeType, onChangeTerm, onChangeTags
 * - onChangeDueFrom, onChangeDueTo: fechas en ISO
 * - onApply, onClear: acciones de aplicar o limpiar filtros
 */
export default function TasksFilters({
  statusId,
  priorityId,
  typeId,
  termId,
  tagIds = [],
  dueFrom,
  dueTo,

  statuses = [],
  priorities = [],
  types = [],
  terms = [],
  tags = [],

  onChangeStatus,
  onChangePriority,
  onChangeType,
  onChangeTerm,
  onChangeTags,
  onChangeDueFrom,
  onChangeDueTo,

  onApply,
  onClear,
}) {
  // Normaliza fechas a YYYY-MM-DD para inputs
  const dueFromInput = useMemo(() => {
    if (!dueFrom) return "";
    const d = typeof dueFrom === "string" ? new Date(dueFrom) : dueFrom;
    return toIsoDateString(d);
  }, [dueFrom]);

  const getName = (x) =>
    x?.name ??
    x?.label ??
    x?.title ??
    x?.description ??
    `#${
      x?.taskStatusId ??
      x?.taskPriorityId ??
      x?.taskTypeId ??
      x?.termId ??
      x?.taskTagId ??
      x?.id
    }`;

  const dueToInput = useMemo(() => {
    if (!dueTo) return "";
    const d = typeof dueTo === "string" ? new Date(dueTo) : dueTo;
    return toIsoDateString(d);
  }, [dueTo]);

  const prioritiesSorted = useMemo(
    () => [...priorities].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)),
    [priorities]
  );

  const handleDateFromChange = (e) => {
    const val = e.target.value;
    onChangeDueFrom?.(
      val ? new Date(`${val}T00:00:00.000Z`).toISOString() : null
    );
  };

  const handleDateToChange = (e) => {
    const val = e.target.value;
    onChangeDueTo?.(
      val ? new Date(`${val}T23:59:59.999Z`).toISOString() : null
    );
  };

  return (
    <Box className={styles.filtersPanel}>
      <Typography variant="subtitle1" className={styles.filtersTitle}>
        Filtros
      </Typography>

      <Stack direction="row" spacing={2} className={styles.filtersRow}>
        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-status-label">Estado</InputLabel>
          <Select
            labelId="filter-status-label"
            label="Estado"
            value={statusId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onChangeStatus?.(v === "" ? null : Number(v));
            }}
          >
            <MenuItem value="">(Todos)</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s.taskStatusId} value={s.taskStatusId}>
                {getName(s)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-priority-label">Prioridad</InputLabel>
          <Select
            labelId="filter-priority-label"
            value={priorityId ?? ""}
            label="Prioridad"
            onChange={(e) => onChangePriority?.(e.target.value || null)}
          >
            <MenuItem value="">(Todas)</MenuItem>
            {prioritiesSorted.map((p) => (
              <MenuItem key={p.taskPriorityId} value={p.taskPriorityId}>
                {getName(p)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-type-label">Tipo</InputLabel>
          <Select
            labelId="filter-type-label"
            label="Tipo"
            value={typeId ?? ""}
            onChange={(e) => onChangeType?.(e.target.value || null)}
          >
            <MenuItem value="">(Todos)</MenuItem>
            {types.map((t) => (
              <MenuItem key={t.taskTypeId} value={t.taskTypeId}>
                {getName(t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-term-label">Término</InputLabel>
          <Select
            labelId="filter-term-label"
            value={termId ?? ""}
            label="Término"
            onChange={(e) => onChangeTerm?.(e.target.value || null)}
          >
            <MenuItem value="">(Todos)</MenuItem>
            {terms.map((t) => (
              <MenuItem key={t.termId} value={t.termId}>
                {getName(t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          type="date"
          size="small"
          label="Vence desde"
          value={dueFromInput}
          onChange={handleDateFromChange}
          className={styles.dateInput}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          size="small"
          label="Vence hasta"
          value={dueToInput}
          onChange={handleDateToChange}
          className={styles.dateInput}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      <Box className={styles.tagsRow}>
        <TagSelector
          allTags={tags}
          selectedIds={tagIds}
          onChange={onChangeTags}
        />
      </Box>

      <Stack direction="row" spacing={2} className={styles.filtersActions}>
        <Button
          variant="outlined"
          onClick={onClear}
          className={styles.clearBtn}
          sx={{
            borderColor: "var(--btn-outline-border)",
            color: "var(--btn-outline-text)",
          }}
        >
          Limpiar
        </Button>
        <Button
          variant="contained"
          onClick={onApply}
          className={styles.applyBtn}
          sx={{
            bgcolor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
          }}
        >
          Aplicar
        </Button>
      </Stack>
    </Box>
  );
}
