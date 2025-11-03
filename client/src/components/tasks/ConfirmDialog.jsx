import React from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Diálogo de confirmación configurable.
 *
 * Props:
 * - open: boolean
 * - title: string
 * - message?: string | ReactNode
 * - tone?: "danger" | "warning" | "primary"
 * - confirmLabel?: string (default "Confirmar")
 * - cancelLabel?: string (default "Cancelar")
 * - loading?: boolean
 * - onClose: () => void
 * - onConfirm: (extraData?: { actualMin?: number }) => void
 * - askActualMin?: boolean
 * - defaultActualMin?: number
 * - extraContent?: ReactNode
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  tone = "primary",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onClose,
  onConfirm,
  askActualMin = false,
  defaultActualMin = 0,
  extraContent,
}) {
  const [actualMin, setActualMin] = React.useState(defaultActualMin ?? 0);

  React.useEffect(() => {
    if (open) setActualMin(defaultActualMin ?? 0);
  }, [open, defaultActualMin]);

  const alertSeverity =
    tone === "danger" ? "error" : tone === "warning" ? "warning" : "info";

  const confirmSx =
    tone === "danger"
      ? {
          bgcolor: "var(--color-error)",
          color: "var(--color-text-inverse)",
          "&:hover": { bgcolor: "#a53b44" },
        }
      : tone === "warning"
      ? {
          bgcolor: "var(--warning-500)",
          color: "var(--color-text-inverse)",
          "&:hover": { bgcolor: "#d18c1f" },
        }
      : {
          bgcolor: "var(--btn-primary-bg)",
          color: "var(--btn-primary-text)",
          "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
        };

  const handleConfirm = () => {
    const payload = askActualMin
      ? { actualMin: Number(actualMin) || 0 }
      : undefined;
    onConfirm?.(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle className={styles.dialogTitle}>{title}</DialogTitle>

      <DialogContent dividers className={styles.dialogContent}>
        <Stack spacing={2}>
          {message && (
            <Alert severity={alertSeverity} className={styles.dialogAlert}>
              {typeof message === "string" ? (
                <Typography variant="body2">{message}</Typography>
              ) : (
                message
              )}
            </Alert>
          )}

          {askActualMin && (
            <TextField
              type="number"
              size="small"
              label="Minutos reales (actual)"
              value={actualMin}
              onChange={(e) => setActualMin(e.target.value)}
              inputProps={{ min: 0, step: 1 }}
              className={styles.inputActualMin}
            />
          )}

          {extraContent}
        </Stack>
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
          {cancelLabel}
        </Button>

        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          className={styles.btnConfirm}
          sx={confirmSx}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
