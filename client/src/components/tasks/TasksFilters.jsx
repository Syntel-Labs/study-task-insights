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
 * Panel de filtros para la lista de tareas.
 * Props:
 * - statusId, priorityId, typeId, termId, tagIds, dueFrom, dueTo
 * - listas: statuses, priorities, types, terms, tags
 * - callbacks: onChangeX para cada filtro, onApply, onClear
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
  // Funciones utilitarias para leer id y nombre sin importar el formato
  const getName = (x) =>
    x?.name ?? x?.label ?? x?.title ?? x?.description ?? `#${getId(x)}`;

  const getId = (x) =>
    x?.id ??
    x?.taskStatusId ??
    x?.task_status_id ??
    x?.taskPriorityId ??
    x?.task_priority_id ??
    x?.taskTypeId ??
    x?.task_type_id ??
    x?.termId ??
    x?.term_id ??
    x?.taskTagId ??
    x?.task_tag_id ??
    x;

  // Normalizaciones: adaptan el shape de las listas al esperado por los selects
  const normStatuses = useMemo(
    () => (statuses || []).map((s) => ({ id: s.taskStatusId, name: s.name })),
    [statuses]
  );

  const normPriorities = useMemo(
    () =>
      (priorities || [])
        .map((p) => ({
          id: p.taskPriorityId,
          name: p.name,
          weight: p.weight ?? 0,
        }))
        .sort((a, b) => a.weight - b.weight),
    [priorities]
  );

  const normTypes = useMemo(
    () => (types || []).map((t) => ({ id: t.taskTypeId, name: t.name })),
    [types]
  );

  const normTerms = useMemo(
    () => (terms || []).map((t) => ({ id: t.termId, name: t.name })),
    [terms]
  );

  const normTags = useMemo(
    () =>
      (tags || []).map((t) => ({
        taskTagId: t.taskTagId, // clave esperada por TagSelector
        name: t.name,
        color: t.color,
      })),
    [tags]
  );

  // Manejo de fechas: convierte Date o string a formato YYYY-MM-DD
  const dueFromInput = useMemo(() => {
    if (!dueFrom) return "";
    const d = typeof dueFrom === "string" ? new Date(dueFrom) : dueFrom;
    return toIsoDateString(d);
  }, [dueFrom]);

  const dueToInput = useMemo(() => {
    if (!dueTo) return "";
    const d = typeof dueTo === "string" ? new Date(dueTo) : dueTo;
    return toIsoDateString(d);
  }, [dueTo]);

  // Helpers para enviar valores numéricos o null
  const toNumOrNull = (v) => (v === "" ? null : Number(v));

  // Handlers de fechas: devuelven ISO strings completas (UTC)
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

      {/* Filtros principales */}
      <Stack direction="row" spacing={2} className={styles.filtersRow}>
        {/* Estado */}
        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-status-label">Estado</InputLabel>
          <Select
            labelId="filter-status-label"
            label="Estado"
            value={statusId ?? ""}
            onChange={(e) => onChangeStatus?.(toNumOrNull(e.target.value))}
            MenuProps={{ disableScrollLock: true, disablePortal: true }}
          >
            <MenuItem value="">(Todos)</MenuItem>
            {normStatuses.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Prioridad */}
        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-priority-label">Prioridad</InputLabel>
          <Select
            labelId="filter-priority-label"
            value={priorityId ?? ""}
            label="Prioridad"
            onChange={(e) => onChangePriority?.(toNumOrNull(e.target.value))}
            MenuProps={{ disableScrollLock: true, disablePortal: true }}
          >
            <MenuItem value="">(Todas)</MenuItem>
            {normPriorities.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tipo */}
        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-type-label">Tipo</InputLabel>
          <Select
            labelId="filter-type-label"
            label="Tipo"
            value={typeId ?? ""}
            onChange={(e) => onChangeType?.(toNumOrNull(e.target.value))}
            MenuProps={{ disableScrollLock: true, disablePortal: true }}
          >
            <MenuItem value="">(Todos)</MenuItem>
            {normTypes.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Término */}
        <FormControl size="small" className={styles.filterControl}>
          <InputLabel id="filter-term-label">Término</InputLabel>
          <Select
            labelId="filter-term-label"
            value={termId ?? ""}
            label="Término"
            onChange={(e) => onChangeTerm?.(toNumOrNull(e.target.value))}
            MenuProps={{ disableScrollLock: true, disablePortal: true }}
          >
            <MenuItem value="">(Todos)</MenuItem>
            {normTerms.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Fechas */}
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

      {/* Filtro de etiquetas */}
      <Box className={styles.tagsRow}>
        <TagSelector
          allTags={normTags}
          selectedIds={tagIds}
          onChange={onChangeTags}
        />
      </Box>

      {/* Acciones de los filtros */}
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
