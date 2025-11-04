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

/* Barra de acciones masivas para tareas */
export default function BulkActionsBar({
  selectedIds = [],
  loading = false,
  statuses = [],
  onClearSelection,
  onBulkComplete,
  onBulkDelete,
  onApplyStatus,
}) {
  const [confirm, setConfirm] = React.useState({ type: null, open: false });
  const [statusId, setStatusId] = React.useState("");
  const [confirmStatus, setConfirmStatus] = React.useState(false);

  const hasSelection = selectedIds.length > 0;

  // Filtra estados finales para mostrar advertencia al aplicar
  const finalStatuses = React.useMemo(
    () => statuses.filter((s) => s.isFinal),
    [statuses]
  );

  const openConfirm = (type) => setConfirm({ type, open: true });
  const closeConfirm = () => setConfirm({ type: null, open: false });

  // Ejecuta acción confirmada de completar o eliminar
  const handleConfirm = async (payload) => {
    try {
      if (confirm.type === "complete")
        await onBulkComplete?.(selectedIds, payload);
      else if (confirm.type === "delete") await onBulkDelete?.(selectedIds);
    } finally {
      closeConfirm();
    }
  };

  // Aplica un nuevo estado a las tareas seleccionadas
  const handleConfirmStatus = async () => {
    if (!statusId) return;
    try {
      await onApplyStatus?.(statusId); // delega al padre (TasksPage)
      setStatusId(""); // limpia el select
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
            {selectedIds.length} seleccionada(s)
          </Typography>

          <FormControl size="small" className={styles.bulkStatusControl}>
            <InputLabel id="bulk-status-label">Cambiar estado</InputLabel>
            <Select
              labelId="bulk-status-label"
              label="Cambiar estado"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              disabled={loading}
              MenuProps={{ disableScrollLock: true, disablePortal: true }}
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
            disabled={!statusId || loading || !hasSelection}
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
            disabled={!hasSelection || loading}
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
            disabled={!hasSelection || loading}
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
            disabled={!hasSelection || loading}
            className={styles.bulkBtnClear}
          >
            Limpiar selección
          </Button>
        </Stack>
      </Box>

      {/* Confirmación de completar tareas */}
      <ConfirmDialog
        open={confirm.open && confirm.type === "complete"}
        title="Completar tareas seleccionadas"
        tone="primary"
        message={
          <span>
            Vas a marcar <b>{selectedIds.length}</b> tarea(s) como{" "}
            <b>completadas</b>.
          </span>
        }
        askActualMin
        confirmLabel="Completar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />

      {/* Confirmación de eliminar tareas */}
      <ConfirmDialog
        open={confirm.open && confirm.type === "delete"}
        title="Eliminar tareas seleccionadas"
        tone="danger"
        message={
          <span>
            Esta acción es <b>definitiva</b>. Se eliminarán{" "}
            <b>{selectedIds.length}</b> tarea(s).
          </span>
        }
        confirmLabel="Eliminar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />

      {/* Confirmación de cambio de estado */}
      <ConfirmDialog
        open={confirmStatus}
        title="Aplicar estado a seleccionadas"
        tone="primary"
        message={
          <span>
            Aplicarás el estado a <b>{selectedIds.length}</b> tarea(s).
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
