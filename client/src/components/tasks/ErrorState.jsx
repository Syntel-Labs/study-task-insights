import React from "react";
import { Box, Button, Typography } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Componente para mostrar un estado de error en la vista de tareas.
 *
 * Props:
 * - message: mensaje de error a mostrar (opcional)
 * - onRetry: función para reintentar la acción fallida (opcional)
 */
export default function ErrorState({
  message = "Ocurrió un error al cargar las tareas.",
  onRetry,
}) {
  return (
    <Box className={`${styles.stateWrap} ${styles.stateError}`}>
      <Typography variant="h6" className={styles.stateTitle}>
        Error
      </Typography>
      <Typography variant="body2" className={styles.stateText}>
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          onClick={onRetry}
          className={styles.retryBtn}
          sx={{
            bgcolor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
          }}
        >
          Reintentar
        </Button>
      )}
    </Box>
  );
}
