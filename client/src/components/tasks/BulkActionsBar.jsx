import React from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ConfirmDialog from "./ConfirmDialog.jsx";
import styles from "@styles/tasks.module.scss";

/**
 * Barra de acciones masivas para tareas.
 *
 * Permite cambiar estado, completar, archivar, eliminar y limpiar selección.
 * Mantiene el alto incluso sin elementos seleccionados para no desplazar la UI.
 *
 * Props:
 * - selectedCount: número de tareas seleccionadas
 * - disabled: deshabilita todos los botones
 * - statuses: lista de estados disponibles
 * - onClearSelection: callback para limpiar selección
 * - onBulkComplete: callback para completar tareas
 * - onBulkArchive: callback para archivar tareas
 * - onBulkDelete: callback para eliminar tareas
 * - onBulkChangeStatus: callback para cambiar estado de tareas
 */
export default function BulkActionsBar({
  selectedCount = 0,
  disabled = false,
  statuses = [],
  onClearSelection,
  onBulkComplete,
  onBulkArchive,
  onBulkDelete,
  onBulkChangeStatus,
}) {
  const [confirm, setConfirm] = React.useState({ type: null, open: false });
  const [statusId, setStatusId] = React.useState("");
  const [confirmStatus, setConfirmStatus] = React.useState(false);

  const finalStatuses = React.useMemo(
    () => statuses.filter((s) => s.isFinal),
    [statuses]
  );

  const hasSelection = selectedCount > 0;

  const openConfirm = (type) => setConfirm({ type, open: true });
  const closeConfirm = () => setConfirm({ type: null, open: false });

  const handleConfirm = async (payload) => {
    try {
      if (confirm.type === "complete") await onBulkComplete?.(payload);
      else if (confirm.type === "archive") await onBulkArchive?.();
      else if (confirm.type === "delete") await onBulkDelete?.();
    } finally {
      closeConfirm();
    }
  };

  const handleConfirmStatus = async () => {
    if (!statusId) return;
    try {
      await onBulkChangeStatus?.(statusId);
    } finally {
      setConfirmStatus(false);
    }
  };

  return (
    <>
      <Box
        className={`${styles.bulkBar} ${
          !hasSelection ? styles.bulkBarHidden : ""
        }`}
        role="region"
        aria-live="polite"
        aria-hidden={!hasSelection}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          className={styles.bulkLeft}
        >
          <Typography variant="body2" className={styles.bulkCount}>
            {selectedCount} seleccionada(s)
          </Typography>

          <FormControl size="small" className={styles.bulkStatusControl}>
            <InputLabel id="bulk-status-label">Cambiar estado</InputLabel>
            <Select
              labelId="bulk-status-label"
              label="Cambiar estado"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              disabled={disabled}
            >
              {statuses.map((s) => (
                <MenuItem key={s.taskStatusId} value={s.taskStatusId}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            size="small"
            variant="outlined"
            disabled={!statusId || disabled || !hasSelection}
            onClick={() => setConfirmStatus(true)}
            className={styles.bulkBtn}
            sx={{
              borderColor: "var(--btn-outline-border)",
              color: "var(--btn-outline-text)",
            }}
          >
            Aplicar estado
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} className={styles.bulkRight}>
          <Button
            size="small"
            variant="contained"
            disabled={!hasSelection || disabled}
            onClick={() => openConfirm("complete")}
            className={styles.bulkBtn}
            sx={{
              bgcolor: "var(--color-success)",
              color: "var(--color-text-inverse)",
              "&:hover": { opacity: 0.9 },
            }}
          >
            Completar
          </Button>

          <Button
            size="small"
            variant="contained"
            disabled={!hasSelection || disabled}
            onClick={() => openConfirm("archive")}
            className={styles.bulkBtn}
            sx={{
              bgcolor: "var(--brand-primary-400)",
              color: "var(--color-text-inverse)",
              "&:hover": { opacity: 0.9 },
            }}
          >
            Archivar
          </Button>

          <Button
            size="small"
            variant="contained"
            disabled={!hasSelection || disabled}
            onClick={() => openConfirm("delete")}
            className={styles.bulkBtnDanger}
            sx={{
              bgcolor: "var(--color-error)",
              color: "var(--color-text-inverse)",
              "&:hover": { opacity: 0.92 },
            }}
          >
            Eliminar
          </Button>

          <Button
            size="small"
            variant="text"
            onClick={onClearSelection}
            disabled={!hasSelection || disabled}
            className={styles.bulkBtnClear}
          >
            Limpiar selección
          </Button>
        </Stack>
      </Box>

      <ConfirmDialog
        open={confirm.open && confirm.type === "complete"}
        title="Completar tareas seleccionadas"
        tone="primary"
        message={
          <span>
            Vas a marcar <b>{selectedCount}</b> tarea(s) como <b>completadas</b>
            . También puedes registrar minutos reales (opcional).
          </span>
        }
        askActualMin
        confirmLabel="Completar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={confirm.open && confirm.type === "archive"}
        title="Archivar tareas seleccionadas"
        tone="warning"
        message={
          <span>
            Vas a <b>archivar</b> <b>{selectedCount}</b> tarea(s). Podrás
            desarchivarlas luego.
          </span>
        }
        confirmLabel="Archivar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={confirm.open && confirm.type === "delete"}
        title="Eliminar tareas seleccionadas"
        tone="danger"
        message={
          <span>
            Esta acción es <b>definitiva</b>. Se eliminarán{" "}
            <b>{selectedCount}</b> tarea(s).
          </span>
        }
        confirmLabel="Eliminar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={confirmStatus}
        title="Aplicar estado a seleccionadas"
        tone="primary"
        message={
          <span>
            Aplicarás el estado a <b>{selectedCount}</b> tarea(s).
            {finalStatuses.some((s) => s.taskStatusId === statusId) && (
              <>
                {" "}
                El estado elegido es <b>final</b>; quedarán como completadas.
              </>
            )}
          </span>
        }
        confirmLabel="Aplicar"
        onClose={() => setConfirmStatus(false)}
        onConfirm={handleConfirmStatus}
      />
    </>
  );
}
