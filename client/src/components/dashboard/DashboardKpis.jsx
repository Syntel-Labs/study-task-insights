import React from "react";
import { Grid, Paper, Typography, LinearProgress } from "@mui/material";
import styles from "@styles/dashboard.module.scss";

// Tarjetas KPI: planificado vs real, % finalización, tareas
export default function DashboardKpis({
  last,
  planned,
  actual,
  completionRate,
}) {
  return (
    <Grid container spacing={2}>
      <Grid xs={12} md={4}>
        <Paper className={styles.kpiCard}>
          <Typography variant="h6" className={styles.kpiLabel}>
            Tiempo total (minutos)
          </Typography>
          <Typography variant="body2" className={styles.kpiSubLabel}>
            Planificado vs Real
          </Typography>
          <Typography variant="h6" className={styles.kpiValue}>
            {planned} / {actual}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={planned ? Math.min((actual / planned) * 100, 100) : 0}
            className={styles.progressPrimary}
          />
        </Paper>
      </Grid>

      <Grid xs={12} md={4}>
        <Paper className={styles.kpiCard}>
          <Typography variant="h6" className={styles.kpiLabel}>
            % de finalización
          </Typography>
          <Typography variant="body2" className={styles.kpiSubLabel}>
            Promedio semanal
          </Typography>
          <Typography variant="h6" className={styles.kpiValue}>
            {Math.round(completionRate * 100)}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(completionRate * 100, 100)}
            className={styles.progressSuccess}
          />
        </Paper>
      </Grid>

      <Grid xs={12} md={4}>
        <Paper className={styles.kpiCard}>
          <Typography variant="h6" className={styles.kpiLabel}>
            Tareas
          </Typography>
          <Typography variant="body2" className={styles.kpiSubLabel}>
            Creadas vs Completadas
          </Typography>
          <Typography variant="h6" className={styles.kpiValue}>
            {last.tasks_created ?? 0} / {last.tasks_completed ?? 0}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={
              (last.tasks_created || 0) + (last.tasks_completed || 0)
                ? Math.min(
                    ((last.tasks_completed || 0) /
                      ((last.tasks_created || 0) +
                        (last.tasks_completed || 0))) *
                      100,
                    100
                  )
                : 0
            }
            className={styles.progressAccent}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}
