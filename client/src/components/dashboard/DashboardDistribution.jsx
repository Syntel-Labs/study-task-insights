import React, { useEffect, useMemo, useState } from "react";
import { Grid, Paper, Typography, Divider, Box } from "@mui/material";
import { motion } from "framer-motion";
import EChartsReact from "echarts-for-react";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@context/PreferencesContext.jsx";
import { useTasksApi } from "@hooks/api/tasks";
import styles from "@styles/dashboard.module.scss";

const STATUS_COLORS = {
  pending: "#f5a524",
  in_progress: "#4678e8",
  completed: "#3d8361",
  archived: "#8a9aa9",
};

const PRIORITY_COLORS = {
  low: "#99bffb",
  normal: "#4678e8",
  high: "#f28c38",
  urgent: "#c14953",
};

export default function DashboardDistribution() {
  const { t } = useTranslation();
  const { isDark } = usePreferences();
  const { list: listTasks } = useTasksApi();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let active = true;
    listTasks({ include: "all", pageSize: 500, archived: false })
      .then((data) => {
        if (!active) return;
        setTasks(data?.items || data?.data || []);
      })
      .catch(() => setTasks([]));
    return () => {
      active = false;
    };
  }, [listTasks]);

  const axisColor = isDark ? "#c3ceda" : "#3a4757";
  const bgColor = isDark ? "#121923" : "#ffffff";
  const textColor = isDark ? "#e9ecf2" : "#1c1c1e";

  const statusOption = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const code = t.status?.code || "pending";
      counts[code] = (counts[code] || 0) + 1;
    });
    const data = Object.entries(counts).map(([k, v]) => ({
      name: k,
      value: v,
      itemStyle: { color: STATUS_COLORS[k] || "#8a9aa9" },
    }));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: bgColor,
        borderColor: isDark ? "#2a3645" : "#e2e8f0",
        textStyle: { color: textColor },
      },
      legend: { bottom: 0, textStyle: { color: axisColor } },
      series: [
        {
          name: t("dashboard.distribution_title"),
          type: "pie",
          radius: ["45%", "72%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: bgColor, borderWidth: 2 },
          label: {
            show: true,
            formatter: "{b}\n{d}%",
            color: textColor,
            fontFamily: "var(--font-family-base)",
          },
          emphasis: { label: { show: true, fontWeight: "bold" } },
          data,
        },
      ],
    };
  }, [tasks, t, isDark, axisColor, bgColor, textColor]);

  const priorityOption = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const code = t.priority?.code || "normal";
      counts[code] = (counts[code] || 0) + 1;
    });
    const order = ["low", "normal", "high", "urgent"];
    const labels = order.filter((o) => counts[o]);
    const data = labels.map((k) => ({
      value: counts[k],
      itemStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: PRIORITY_COLORS[k] },
            { offset: 1, color: PRIORITY_COLORS[k] + "cc" },
          ],
        },
        borderRadius: [0, 6, 6, 0],
      },
    }));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: bgColor,
        borderColor: isDark ? "#2a3645" : "#e2e8f0",
        textStyle: { color: textColor },
      },
      grid: { left: "12%", right: "8%", top: 16, bottom: 24, containLabel: true },
      xAxis: {
        type: "value",
        axisLabel: { color: axisColor },
        splitLine: { lineStyle: { color: isDark ? "#2a3645" : "#e2e8f0" } },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: axisColor, fontWeight: 600 },
        axisLine: { lineStyle: { color: axisColor } },
      },
      series: [
        {
          type: "bar",
          data,
          barMaxWidth: 22,
          label: {
            show: true,
            position: "right",
            color: textColor,
            fontFamily: "var(--font-family-base)",
          },
        },
      ],
    };
  }, [tasks, isDark, axisColor, bgColor, textColor]);

  return (
    <>
      <Divider />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -3 }}
          >
            <Paper className={styles.chartCard}>
              <Typography variant="subtitle2" className={styles.tableTitle}>
                {t("dashboard.distribution_title")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("dashboard.distribution_subtitle")}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <EChartsReact
                  option={statusOption}
                  style={{ width: "100%", height: 320 }}
                  notMerge
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -3 }}
          >
            <Paper className={styles.chartCard}>
              <Typography variant="subtitle2" className={styles.tableTitle}>
                {t("dashboard.priority_title")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("dashboard.priority_subtitle")}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <EChartsReact
                  option={priorityOption}
                  style={{ width: "100%", height: 320 }}
                  notMerge
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </>
  );
}
