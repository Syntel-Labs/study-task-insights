import React from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import TagSelector from "./TagSelector.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { toIsoDateString } from "@utils/dates";
import styles from "@styles/tasks.module.scss";

/**
 * Drawer de detalle de tarea editable.
 *
 * Funcionalidad:
 * - Campos: título, descripción, estado, prioridad, tipo, término, dueAt, estimatedMin
 * - Tags: TagSelector (POST/DELETE assignments) si hay taskId
 * - Metadatos: createdAt/updatedAt/completedAt/archivedAt (solo lectura)
 * - Acciones rápidas: Guardar cambios, Completar, Archivar, Eliminar, Crear sesión
 *
 * Props:
 * - open: boolean → abre/cierra el drawer
 * - task: objeto tarea (camelCase o snake_case, idealmente include=all)
 * - statuses, priorities, types, terms, tags: catálogos completos
 * - loading?: boolean → bloquea botones y inputs
 * - onClose: () => void
 * - onUpdate: (payload) => Promise|void → guarda cambios de tarea
 * - onComplete: (opts?: { actualMin?: number }) => Promise|void
 * - onArchive: () => Promise|void
 * - onDelete: () => Promise|void
 * - onAfterTagsChange?: (newIds: string[]) => void → opcional, notifica cambios de tags
 */
export default function TaskDrawer({
  open,
  task,
  statuses = [],
  priorities = [],
  types = [],
  terms = [],
  tags = [],
  loading = false,
  onClose,
  onUpdate,
  onComplete,
  onArchive,
  onDelete,
  onAfterTagsChange,
}) {
  const navigate = useNavigate();

  const norm = React.useMemo(() => {
    const t = task || {};
    const id = t.taskId ?? t.task_id ?? null;

    const status = t.taskStatus ?? t.task_status ?? null;
    const priority = t.taskPriority ?? t.task_priority ?? null;
    const type = t.taskType ?? t.task_type ?? null;
    const term = t.term ?? t.term ?? null;

    // Tags seleccionados
    const tagItems = t.task_tags ?? t.tags ?? [];
    const tagIds = tagItems
      .map((x) => x.taskTagId ?? x.task_tag_id)
      .filter(Boolean);

    return {
      id,
      title: t.title || "",
      description: t.description || "",
      taskStatusId:
        status?.taskStatusId ?? t.taskStatusId ?? t.task_status_id ?? "",
      taskPriorityId:
        priority?.taskPriorityId ??
        t.taskPriorityId ??
        t.task_priority_id ??
        "",
      taskTypeId: type?.taskTypeId ?? t.taskTypeId ?? t.task_type_id ?? "",
      termId: term?.termId ?? t.termId ?? t.term_id ?? "",
      dueAt: t.dueAt ?? t.due_at ?? null,
      estimatedMin: t.estimatedMin ?? t.estimated_min ?? 0,
      createdAt: t.createdAt ?? t.created_at ?? null,
      updatedAt: t.updatedAt ?? t.updated_at ?? null,
      completedAt: t.completedAt ?? t.completed_at ?? null,
      archivedAt: t.archivedAt ?? t.archived_at ?? null,
      tagIds,
    };
  }, [task]);

  const [form, setForm] = React.useState(norm);
  React.useEffect(() => {
    if (open) setForm(norm);
  }, [open, norm]);

  const [errors, setErrors] = React.useState({});
  const [confirm, setConfirm] = React.useState({ type: null, open: false });

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Fecha en input type=date (YYYY-MM-DD)
  const dueInput = React.useMemo(() => {
    if (!form.dueAt) return "";
    const d =
      typeof form.dueAt === "string" ? new Date(form.dueAt) : form.dueAt;
    return toIsoDateString(d);
  }, [form.dueAt]);

  function handleDueChange(e) {
    const val = e.target.value;
    if (!val) return setField("dueAt", null);
    const iso = new Date(`${val}T00:00:00.000Z`).toISOString();
    setField("dueAt", iso);
  }

  // Validación de campos requeridos
  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Obligatorio";
    if (!form.taskStatusId) next.taskStatusId = "Obligatorio";
    if (!form.taskPriorityId) next.taskPriorityId = "Obligatorio";
    if (!form.taskTypeId) next.taskTypeId = "Obligatorio";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Guardar cambios
  async function handleSave() {
    if (!validate()) return;
    const payload = {
      taskId: form.id,
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
    await onUpdate?.(payload);
  }

  // Confirm dialogs
  function openConfirm(type) {
    setConfirm({ type, open: true });
  }
  function closeConfirm() {
    setConfirm({ type: null, open: false });
  }
  async function handleConfirm(payload) {
    try {
      if (confirm.type === "complete") await onComplete?.(payload);
      else if (confirm.type === "archive") await onArchive?.();
      else if (confirm.type === "delete") await onDelete?.();
    } finally {
      closeConfirm();
    }
  }

  // Formato legible de fechas
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Guatemala",
    }).format(d);
  }

  const isFinalStatus = React.useMemo(
    () =>
      statuses.find((s) => s.taskStatusId === form.taskStatusId)?.isFinal ??
      false,
    [form.taskStatusId, statuses]
  );

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={loading ? undefined : onClose}
        PaperProps={{
          className: styles.taskDrawer,
          sx: { width: 640, maxWidth: "100%" },
        }}
      >
        {/* Header: título y botones */}
        <Box className={styles.drawerHeader}>
          <Typography variant="h6" className={styles.drawerTitle}>
            {form.title?.trim() || "Detalle de tarea"}
          </Typography>
          <div className={styles.drawerHeaderActions}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate("/sessions")}
              className={styles.btnGoSessions}
            >
              Crear sesión
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              className={styles.btnSave}
            >
              Guardar
            </Button>
          </div>
        </Box>

        <Divider />

        {/* Cuerpo del Drawer */}
        <Box className={styles.drawerBody}>
          {/* Formulario principal */}
          <Stack spacing={2} className={styles.formSection}>
            <TextField
              label="Título"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              error={!!errors.title}
              helperText={errors.title || " "}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth error={!!errors.taskStatusId}>
                <InputLabel id="status-label">Estado</InputLabel>
                <Select
                  labelId="status-label"
                  value={form.taskStatusId}
                  onChange={(e) => setField("taskStatusId", e.target.value)}
                >
                  {statuses.map((s) => (
                    <MenuItem key={s.taskStatusId} value={s.taskStatusId}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth error={!!errors.taskPriorityId}>
                <InputLabel id="priority-label">Prioridad</InputLabel>
                <Select
                  labelId="priority-label"
                  value={form.taskPriorityId}
                  onChange={(e) => setField("taskPriorityId", e.target.value)}
                >
                  {priorities.map((p) => (
                    <MenuItem key={p.taskPriorityId} value={p.taskPriorityId}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth error={!!errors.taskTypeId}>
                <InputLabel id="type-label">Tipo</InputLabel>
                <Select
                  labelId="type-label"
                  value={form.taskTypeId}
                  onChange={(e) => setField("taskTypeId", e.target.value)}
                >
                  {types.map((t) => (
                    <MenuItem key={t.taskTypeId} value={t.taskTypeId}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="term-label">Término</InputLabel>
                <Select
                  labelId="term-label"
                  value={form.termId || ""}
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

          {/* Tags */}
          <Divider className={styles.sectionDivider} />
          <Box className={styles.formSection}>
            <Typography variant="subtitle1" className={styles.sectionTitle}>
              Tags
            </Typography>
            <TagSelector
              taskId={form.id}
              allTags={tags}
              selectedIds={form.tagIds}
              onChange={(newIds) => {
                setField("tagIds", newIds);
                onAfterTagsChange?.(newIds);
              }}
              disabled={loading}
            />
          </Box>

          {/* Metadatos */}
          <Divider className={styles.sectionDivider} />
          <Box className={styles.formSection}>
            <Typography variant="subtitle1" className={styles.sectionTitle}>
              Metadatos
            </Typography>
            <dl className={styles.metaList}>
              <div>
                <dt>Creada</dt>
                <dd>{fmtDate(form.createdAt)}</dd>
              </div>
              <div>
                <dt>Actualizada</dt>
                <dd>{fmtDate(form.updatedAt)}</dd>
              </div>
              <div>
                <dt>Completada</dt>
                <dd>{fmtDate(form.completedAt)}</dd>
              </div>
              <div>
                <dt>Archivada</dt>
                <dd>{fmtDate(form.archivedAt)}</dd>
              </div>
            </dl>
          </Box>

          {/* Acciones rápidas */}
          <Divider className={styles.sectionDivider} />
          <Stack direction="row" spacing={1} className={styles.quickActions}>
            <Button
              variant="contained"
              onClick={() => openConfirm("complete")}
              disabled={loading || isFinalStatus}
            >
              Completar
            </Button>
            <Button
              variant="contained"
              onClick={() => openConfirm("archive")}
              disabled={loading}
            >
              Archivar
            </Button>
            <Button
              variant="contained"
              onClick={() => openConfirm("delete")}
              disabled={loading}
            >
              Eliminar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="text" onClick={onClose} disabled={loading}>
              Cerrar
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirm.open && confirm.type === "complete"}
        title="Marcar como completada"
        tone="primary"
        message={
          <span>
            La tarea se marcará como <b>completada</b>. Puedes registrar minutos
            reales (opcional).
          </span>
        }
        askActualMin
        confirmLabel="Completar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirm.open && confirm.type === "archive"}
        title="Archivar tarea"
        tone="warning"
        message="La tarea será archivada. Podrás cambiar su estado posteriormente."
        confirmLabel="Archivar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirm.open && confirm.type === "delete"}
        title="Eliminar tarea"
        tone="danger"
        message="Esta acción es definitiva y no se puede deshacer."
        confirmLabel="Eliminar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />
    </>
  );
}
