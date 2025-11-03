import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import styles from "@styles/dashboard.module.scss";

// Encabezado: selector de semanas + botón de refresco + timestamp
export default function DashboardHeader({
  limitWeeks,
  setLimitWeeks,
  updating,
  onRefresh,
  lastUpdate,
}) {
  return (
    <Box className={styles.headerRow}>
      <Typography variant="h5" className={styles.title}>
        Panel de productividad semanal
      </Typography>

      <div className={styles.headerRight}>
        <TextField
          label="Semanas"
          type="number"
          size="small"
          value={limitWeeks}
          onChange={(e) =>
            setLimitWeeks(
              Math.max(1, Math.min(52, Number(e.target.value) || 1))
            )
          }
          inputProps={{ min: 1, max: 52 }}
        />

        <div className={styles.refreshGroup}>
          <Button
            variant="contained"
            onClick={onRefresh}
            disabled={updating}
            className={styles.refreshBtn}
          >
            {updating ? "Actualizando..." : "Refrescar métricas"}
          </Button>
          {lastUpdate && (
            <Typography variant="caption" className={styles.updatedAt}>
              {`Actualizado ${new Intl.DateTimeFormat("es", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(lastUpdate)}`}
            </Typography>
          )}
        </div>
      </div>
    </Box>
  );
}
