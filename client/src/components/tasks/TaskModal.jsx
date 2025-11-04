import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { toIsoDateString } from "@utils/dates";
import styles from "@styles/tasks.module.scss";

/**
 * Modal para crear o editar una tarea.
 *
 * Reglas:
 * - Campos requeridos: title, taskStatusId, taskPriorityId, taskTypeId
 * - Campos opcionales: termId, dueAt (ISO), estimatedMin, description
 * - Fecha UI localizada en Guatemala; al enviar se convierte a ISO UTC
 *
 * Props:
 * - open: boolean → abre/cierra el modal
 * - loading?: boolean → deshabilita inputs y botones
 * - initialTask?: objeto tarea (camelCase o snake_case)
 * - statuses: [{ taskStatusId, name, isFinal? }]
 * - priorities: [{ taskPriorityId, name, weight }]
 * - types: [{ taskTypeId, name }]
 * - terms: [{ termId, name }]
 * - onClose: () => void
 * - onSubmit: (payload) => void // el padre realiza POST/PUT
 */
export default function TaskModal({
  open,
  loading = false,
  initialTask = null,
  statuses = [],
  priorities = [],
  types = [],
  terms = [],
  onClose,
  onSubmit,
}) {
  const norm = React.useMemo(() => {
    const t = initialTask || {};
    return {
      title: t.title || "",
      description: t.description || "",
      taskStatusId:
        t.taskStatusId ?? t.task_status_id ?? t.task_status?.taskStatusId ?? "",
      taskPriorityId:
        t.taskPriorityId ??
        t.task_priority_id ??
        t.task_priority?.taskPriorityId ??
        "",
      taskTypeId:
        t.taskTypeId ?? t.task_type_id ?? t.task_type?.taskTypeId ?? "",
      termId: t.termId ?? t.term_id ?? t.term?.termId ?? "",
      dueAt: t.dueAt ?? t.due_at ?? null,
      estimatedMin: t.estimatedMin ?? t.estimated_min ?? 0,
    };
  }, [initialTask]);

  const [form, setForm] = React.useState(norm);
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (open) {
      setForm(norm);
      setErrors({});
    }
  }, [open, norm]);

  // Actualiza un campo del form
  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Fecha en input type=date (YYYY-MM-DD)
  const dueInput = React.useMemo(() => {
    if (!form.dueAt) return "";
    const d =
      typeof form.dueAt === "string" ? new Date(form.dueAt) : form.dueAt;
    return toIsoDateString(d);
  }, [form.dueAt]);

  function handleDueChange(e) {
    const val = e.target.value; // YYYY-MM-DD
    if (!val) return setField("dueAt", null);
    // Guardamos ISO UTC al inicio del día
    const iso = new Date(`${val}T00:00:00.000Z`).toISOString();
    setField("dueAt", iso);
  }

  // Valida campos requeridos
  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Obligatorio";
    if (!form.taskStatusId) next.taskStatusId = "Obligatorio";
    if (!form.taskPriorityId) next.taskPriorityId = "Obligatorio";
    if (!form.taskTypeId) next.taskTypeId = "Obligatorio";
    const hasErrors = Object.keys(next).length > 0;
    setErrors(next);
    return !hasErrors;
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      taskStatusId: form.taskStatusId,
      taskPriorityId: form.taskPriorityId,
      taskTypeId: form.taskTypeId,
      termId: form.termId || null,
      dueAt: form.dueAt || null,
      estimatedMin: Number.isFinite(Number(form.estimatedMin))
        ? Number(form.estimatedMin)
        : 0,
    };

    onSubmit?.(payload);
  }

  const isEdit = !!initialTask;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle className={styles.dialogTitle}>
        {isEdit ? "Editar tarea" : "Nueva tarea"}
      </DialogTitle>

      <DialogContent dividers className={styles.dialogContent}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <Stack spacing={2}>
            {/* Título */}
            <TextField
              label="Título"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              error={!!errors.title}
              helperText={errors.title || " "}
              autoFocus
              fullWidth
            />

            {/* Descripción */}
            <TextField
              label="Descripción"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />

            {/* Selects: Estado / Prioridad / Tipo */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Estado</InputLabel>
                <Select
                  labelId="status-label"
                  label="Estado"
                  value={form.taskStatusId}
                  MenuProps={{ disableScrollLock: true, disablePortal: true }}
                  onChange={(e) => setField("taskStatusId", e.target.value)}
                  error={!!errors.taskStatusId}
                >
                  {statuses.map((s) => (
                    <MenuItem key={s.taskStatusId} value={s.taskStatusId}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="priority-label">Prioridad</InputLabel>
                <Select
                  labelId="priority-label"
                  label="Prioridad"
                  value={form.taskPriorityId}
                  MenuProps={{ disableScrollLock: true, disablePortal: true }}
                  onChange={(e) => setField("taskPriorityId", e.target.value)}
                  error={!!errors.taskPriorityId}
                >
                  {priorities.map((p) => (
                    <MenuItem key={p.taskPriorityId} value={p.taskPriorityId}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="type-label">Tipo</InputLabel>
                <Select
                  labelId="type-label"
                  label="Tipo"
                  value={form.taskTypeId}
                  MenuProps={{ disableScrollLock: true, disablePortal: true }}
                  onChange={(e) => setField("taskTypeId", e.target.value)}
                  error={!!errors.taskTypeId}
                >
                  {types.map((t) => (
                    <MenuItem key={t.taskTypeId} value={t.taskTypeId}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Término / Vence / Estimado */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="term-label">Término</InputLabel>
                <Select
                  labelId="term-label"
                  label="Término"
                  value={form.termId || ""}
                  MenuProps={{ disableScrollLock: true, disablePortal: true }}
                  onChange={(e) => setField("termId", e.target.value)}
                >
                  <MenuItem value="">(Ninguno)</MenuItem>
                  {terms.map((t) => (
                    <MenuItem key={t.termId} value={t.termId}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="Vence"
                value={dueInput}
                onChange={handleDueChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                type="number"
                label="Estimado (min)"
                value={form.estimatedMin}
                onChange={(e) => setField("estimatedMin", e.target.value)}
                inputProps={{ min: 0, step: 1 }}
                fullWidth
              />
            </Stack>
          </Stack>
        </form>
      </DialogContent>

      <DialogActions className={styles.dialogActions}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          className={styles.btnCancel}
          sx={{
            borderColor: "var(--btn-outline-border)",
            color: "var(--btn-outline-text)",
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          className={styles.btnConfirm}
          sx={{
            bgcolor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
          }}
        >
          {isEdit ? "Guardar" : "Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
