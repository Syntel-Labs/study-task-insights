import React from "react";
import { Box, Button, Typography } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Componente para mostrar estado vacío en la vista de tareas.
 *
 * Props:
 * - title: título principal (opcional)
 * - subtitle: texto secundario (opcional)
 * - onCreate: función para acción de crear nueva tarea (opcional)
 */
export default function EmptyState({
  title = "No hay tareas que coincidan con los filtros",
  subtitle = "Crea una nueva tarea o ajusta tu búsqueda.",
  onCreate,
}) {
  return (
    <Box className={`${styles.stateWrap} ${styles.stateEmpty}`}>
      <Typography variant="h6" className={styles.stateTitle}>
        {title}
      </Typography>
      <Typography variant="body2" className={styles.stateText}>
        {subtitle}
      </Typography>

      {onCreate && (
        <Button
          variant="contained"
          onClick={onCreate}
          className={styles.createBtn}
          sx={{
            bgcolor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
          }}
        >
          Nueva tarea
        </Button>
      )}
    </Box>
  );
}
