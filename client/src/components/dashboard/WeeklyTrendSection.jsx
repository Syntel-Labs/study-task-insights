import React, { useMemo, useRef } from "react";
import EChartsReact from "echarts-for-react";
import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsLeftRight,
  faDownload,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@context/PreferencesContext.jsx";
import { isoWeekToRangeLabel } from "@utils/dates";
import styles from "@styles/dashboard.module.scss";

export default function WeeklyTrendSection({ items, limitWeeks, swap, setSwap }) {
  const { t } = useTranslation();
  const { isDark } = usePreferences();
  const chartRef = useRef(null);

  const axisColor = isDark ? "#c3ceda" : "#3a4757";
  const gridColor = isDark ? "#2a3645" : "#e2e8f0";
  const bgColor = isDark ? "#121923" : "#ffffff";
  const textColor = isDark ? "#e9ecf2" : "#1c1c1e";

  const chartOption = useMemo(() => {
    const labels = items.map((w) => `S${w.iso_week}`);
    const plannedData = items.map((w) => w.planned_minutes || 0);
    const actualData = items.map((w) => w.actual_minutes || 0);
    const completionData = items.map((w) =>
      Math.round((w.completion_rate || 0))
    );

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: bgColor,
        borderColor: gridColor,
        textStyle: { color: textColor, fontFamily: "var(--font-family-base)" },
      },
      legend: {
        data: [
          t("dashboard.trend_planned"),
          t("dashboard.trend_actual"),
          t("dashboard.trend_completion"),
        ],
        top: 10,
        textStyle: { color: axisColor },
      },
      grid: { left: "6%", right: "6%", bottom: "12%", top: 48, containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: axisColor },
        axisLine: { lineStyle: { color: gridColor } },
      },
      yAxis: [
        {
          type: "value",
          name: t("dashboard.trend_planned").split(" ")[0],
          position: "left",
          axisLabel: { color: axisColor },
          splitLine: { lineStyle: { color: gridColor } },
        },
        {
          type: "value",
          name: "%",
          position: "right",
          axisLabel: { color: axisColor },
          splitLine: { show: false },
          min: 0,
          max: 100,
        },
      ],
      series: [
        {
          name: t("dashboard.trend_planned"),
          type: "bar",
          data: plannedData,
          itemStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "#99bffb" },
                { offset: 1, color: "#4678e8" },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          barMaxWidth: 26,
        },
        {
          name: t("dashboard.trend_actual"),
          type: "bar",
          data: actualData,
          itemStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "#f28c38" },
                { offset: 1, color: "#c96921" },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          barMaxWidth: 26,
        },
        {
          name: t("dashboard.trend_completion"),
          type: "line",
          yAxisIndex: 1,
          data: completionData,
          itemStyle: { color: "#3d8361" },
          smooth: true,
          lineStyle: { width: 3 },
          symbol: "circle",
          symbolSize: 8,
          areaStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(61, 131, 97, 0.35)" },
                { offset: 1, color: "rgba(61, 131, 97, 0)" },
              ],
            },
          },
        },
      ],
      dataZoom: [{ type: "slider", bottom: 8, backgroundColor: "transparent" }],
      toolbox: { show: false },
    };
  }, [items, t, isDark, axisColor, gridColor, bgColor, textColor]);

  function zoomChart(delta) {
    const inst = chartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    const opt = inst.getOption();
    const dz = opt.dataZoom?.[0] || { start: 0, end: 100 };
    const start = dz.start ?? 0;
    const end = dz.end ?? 100;
    const span = end - start;
    const center = start + span / 2;
    const newSpan = Math.max(5, Math.min(100, span + delta));
    const ns = Math.max(0, center - newSpan / 2);
    const ne = Math.min(100, center + newSpan / 2);
    inst.dispatchAction({ type: "dataZoom", start: ns, end: ne });
  }

  function resetZoom() {
    chartRef.current
      ?.getEchartsInstance?.()
      ?.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
  }

  function downloadPng() {
    const instance = chartRef.current?.getEchartsInstance?.();
    if (!instance) return;
    const url = instance.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: bgColor,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = "weekly_trend.png";
    a.click();
  }

  return (
    <>
      <Divider />

      <Box className={styles.sectionHeader}>
        <Typography variant="h6">{t("dashboard.trend_title")}</Typography>
        <div className={styles.chartButtons}>
          <Tooltip title={t("dashboard.trend_zoomIn")}>
            <IconButton onClick={() => zoomChart(-10)} className={styles.iconBtn}>
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("dashboard.trend_zoomOut")}>
            <IconButton onClick={() => zoomChart(+10)} className={styles.iconBtn}>
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("dashboard.trend_resetZoom")}>
            <IconButton onClick={resetZoom} className={styles.iconBtn}>
              <FontAwesomeIcon icon={faRotateRight} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("dashboard.trend_swap")}>
            <IconButton onClick={() => setSwap((s) => !s)} className={styles.iconBtn}>
              <FontAwesomeIcon icon={faArrowsLeftRight} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("dashboard.trend_download")}>
            <IconButton onClick={downloadPng} className={styles.iconBtn}>
              <FontAwesomeIcon icon={faDownload} />
            </IconButton>
          </Tooltip>
        </div>
      </Box>

      <Grid container spacing={3} className={styles.splitRow}>
        <Grid
          item
          xs={12}
          md={6}
          order={swap ? 2 : 1}
          sx={{
            minWidth: 0,
            display: "flex",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            whileHover={{ y: -2 }}
            style={{ flex: 1, display: "flex" }}
          >
            <Paper className={styles.chartCard} sx={{ flex: 1 }}>
              <EChartsReact
                ref={chartRef}
                option={chartOption}
                notMerge
                lazyUpdate
                style={{ width: "100%", height: 440 }}
                theme={isDark ? "dark" : undefined}
              />
            </Paper>
          </motion.div>
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
          order={swap ? 1 : 2}
          sx={{
            minWidth: 0,
            display: "flex",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            style={{ flex: 1, display: "flex" }}
          >
            <Paper className={styles.tableCard} sx={{ flex: 1 }}>
              <Typography variant="subtitle2" className={styles.tableTitle}>
                {t("dashboard.table_lastWeeks", { n: limitWeeks })}
              </Typography>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t("dashboard.table_week")}</th>
                      <th>{t("dashboard.table_created")}</th>
                      <th>{t("dashboard.table_completed")}</th>
                      <th>{t("dashboard.table_planned")}</th>
                      <th>{t("dashboard.table_actual")}</th>
                      <th>{t("dashboard.table_rate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((w, i) => (
                      <motion.tr
                        key={w.weekly_productivity_id || i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                      >
                        <td>{isoWeekToRangeLabel(w.iso_year, w.iso_week)}</td>
                        <td>{w.tasks_created}</td>
                        <td>{w.tasks_completed}</td>
                        <td>{w.planned_minutes}</td>
                        <td>{w.actual_minutes}</td>
                        <td>{Math.round(w.completion_rate || 0)}%</td>
                      </motion.tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                          {t("common.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </>
  );
}
