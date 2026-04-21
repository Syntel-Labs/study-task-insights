import React from "react";
import { Grid, Paper, Typography, LinearProgress, Box } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCircleCheck,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import styles from "@styles/dashboard.module.scss";

function KpiCard({ icon, iconBg, label, subLabel, value, progress, progressClass, delay }) {
  return (
    <Grid xs={12} md={4}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        <Paper className={styles.kpiCard}>
          <Box className={styles.kpiIconBox} sx={{ background: iconBg }}>
            <FontAwesomeIcon icon={icon} className={styles.kpiIcon} />
          </Box>
          <Typography variant="body2" className={styles.kpiLabel}>
            {label}
          </Typography>
          <Typography variant="caption" className={styles.kpiSubLabel}>
            {subLabel}
          </Typography>
          <Typography variant="h5" className={styles.kpiValue}>
            {value}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            className={progressClass}
          />
        </Paper>
      </motion.div>
    </Grid>
  );
}

export default function DashboardKpis({ last, planned, actual, completionRate }) {
  const { t } = useTranslation();
  const ratioPlannedVsActual = planned ? Math.min((actual / planned) * 100, 100) : 0;
  const tasksCreated = last?.tasks_created || 0;
  const tasksCompleted = last?.tasks_completed || 0;
  const tasksRatio = tasksCreated
    ? Math.min((tasksCompleted / tasksCreated) * 100, 100)
    : 0;
  const completionPct = Math.min(Number(completionRate) || 0, 100);

  return (
    <Grid container spacing={2}>
      <KpiCard
        icon={faClock}
        iconBg="linear-gradient(135deg, #1b3b5f 0%, #2e5984 100%)"
        label={t("dashboard.kpi_timeTotal")}
        subLabel={t("dashboard.kpi_timeTotalSub")}
        value={`${planned} / ${actual}`}
        progress={ratioPlannedVsActual}
        progressClass={styles.progressPrimary}
        delay={0}
      />
      <KpiCard
        icon={faCircleCheck}
        iconBg="linear-gradient(135deg, #3d8361 0%, #5eac85 100%)"
        label={t("dashboard.kpi_completion")}
        subLabel={t("dashboard.kpi_completionSub")}
        value={`${Math.round(completionPct)}%`}
        progress={completionPct}
        progressClass={styles.progressSuccess}
        delay={0.08}
      />
      <KpiCard
        icon={faListCheck}
        iconBg="linear-gradient(135deg, #f28c38 0%, #f5a524 100%)"
        label={t("dashboard.kpi_tasks")}
        subLabel={t("dashboard.kpi_tasksSub")}
        value={`${tasksCreated} / ${tasksCompleted}`}
        progress={tasksRatio}
        progressClass={styles.progressAccent}
        delay={0.16}
      />
    </Grid>
  );
}
