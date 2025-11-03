import React from "react";
import { Grid, Paper, Typography, LinearProgress } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * KPIs de tareas en forma de tarjetas.
 *
 * Props:
 * - kpis: {
 *     open: number,       // Tareas abiertas
 *     dueToday: number,   // Tareas que vencen hoy
 *     overdue: number,    // Tareas vencidas
 *     estTotal: number,   // Tiempo estimado total en minutos
 *   }
 *
 * Cada KPI se muestra con un LinearProgress para visualización rápida.
 */
export default function TasksKpis({ kpis }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Paper className={styles.kpiCard}>
          <Typography className={styles.kpiTitle}>Abiertas</Typography>
          <Typography className={styles.kpiValue}>{kpis.open}</Typography>
          <LinearProgress
            variant="determinate"
            value={kpis.open ? 100 : 0}
            className={styles.progressPrimary}
          />
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper className={styles.kpiCard}>
          <Typography className={styles.kpiTitle}>Vencen hoy</Typography>
          <Typography className={styles.kpiValue}>{kpis.dueToday}</Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(kpis.dueToday * 20, 100)}
            className={styles.progressAccent}
          />
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper className={styles.kpiCard}>
          <Typography className={styles.kpiTitle}>Vencidas</Typography>
          <Typography className={styles.kpiValue}>{kpis.overdue}</Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(kpis.overdue * 20, 100)}
            className={styles.progressError}
          />
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper className={styles.kpiCard}>
          <Typography className={styles.kpiTitle}>
            Estimado total (min)
          </Typography>
          <Typography className={styles.kpiValue}>{kpis.estTotal}</Typography>
          <LinearProgress
            variant="determinate"
            value={kpis.estTotal ? 100 : 0}
            className={styles.progressNeutral}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}
