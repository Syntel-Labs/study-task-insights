import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Encabezado de la vista de tareas.
 *
 * Props:
 * - q: string (búsqueda)
 * - onChangeQuery: (value: string) => void
 * - orderByField: string
 * - orderByDir: "asc" | "desc"
 * - onChangeOrderByField: (field: string) => void
 * - onChangeOrderByDir: (dir: string) => void
 * - archived: boolean
 * - onToggleArchived: (value: boolean) => void
 * - onOpenFilters: () => void
 * - onCreateTask: () => void
 * - totalCount?: number
 * - showFilters?: boolean
 */
export default function TasksHeader({
  q,
  onChangeQuery,
  orderByField,
  orderByDir,
  onChangeOrderByField,
  onChangeOrderByDir,
  archived,
  onToggleArchived,
  onOpenFilters,
  onCreateTask,
  totalCount = 0,
  showFilters,
}) {
  return (
    <Box className={styles.headerRow}>
      <Stack
        direction="row"
        alignItems="baseline"
        spacing={2}
        className={styles.headerLeft}
      >
        <Typography variant="h5" className={styles.title}>
          Tareas
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        className={styles.headerRight}
        sx={{ flexWrap: "nowrap" }}
      >
        <TextField
          size="small"
          label="Buscar"
          placeholder="Título o descripción…"
          value={q}
          onChange={(e) => onChangeQuery?.(e.target.value)}
          className={styles.searchInput}
          sx={{ flex: 1, minWidth: 0 }}
          InputProps={{
            sx: { bgcolor: "var(--input-bg)", color: "var(--input-text)" },
          }}
        />

        <FormControl size="small" className={styles.orderControl}>
          <InputLabel id="tasks-orderby-label">Ordenar por</InputLabel>
          <Select
            labelId="tasks-orderby-label"
            label="Ordenar por"
            value={orderByField}
            onChange={(e) => onChangeOrderByField?.(e.target.value)}
            MenuProps={{ disableScrollLock: true, disablePortal: true }}
          >
            <MenuItem value="dueAt">Vencimiento</MenuItem>
            <MenuItem value="createdAt">Creación</MenuItem>
            <MenuItem value="updatedAt">Actualización</MenuItem>
            <MenuItem value="title">Título</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" className={styles.orderDirControl}>
          <InputLabel id="tasks-orderdir-label">Dirección</InputLabel>
          <Select
            labelId="tasks-orderdir-label"
            label="Dirección"
            value={orderByDir}
            onChange={(e) => onChangeOrderByDir?.(e.target.value)}
            MenuProps={{ disableScrollLock: true, disablePortal: true }}
          >
            <MenuItem value="asc">Asc</MenuItem>
            <MenuItem value="desc">Desc</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          className={styles.archivedSwitch}
          control={
            <Switch
              checked={!!archived}
              onChange={(e) => onToggleArchived?.(e.target.checked)}
            />
          }
          label="Incluir archivadas"
        />

        <Button
          variant="outlined"
          className={styles.filtersBtn}
          onClick={onOpenFilters}
          sx={{
            borderColor: "var(--btn-outline-border)",
            color: "var(--btn-outline-text)",
          }}
          aria-controls="tasks-filters"
          aria-expanded={!!showFilters}
        >
          Filtros
        </Button>

        <Button
          variant="contained"
          onClick={onCreateTask}
          className={styles.createBtn}
          sx={{
            bgcolor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
          }}
        >
          Nueva tarea
        </Button>
      </Stack>
    </Box>
  );
}
