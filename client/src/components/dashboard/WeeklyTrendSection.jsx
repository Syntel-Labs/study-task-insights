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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsLeftRight,
  faDownload,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { isoWeekToRangeLabel } from "@utils/dates";
import styles from "@styles/dashboard.module.scss";

// Sección que incluye: título + botones + gráfica + tabla
export default function WeeklyTrendSection({
  items,
  limitWeeks,
  swap,
  setSwap,
}) {
  const chartRef = useRef(null);

  const chartOption = useMemo(() => {
    const labels = items.map((w) => `S${w.iso_week}`);
    const plannedData = items.map((w) => w.planned_minutes || 0);
    const actualData = items.map((w) => w.actual_minutes || 0);
    const completionData = items.map((w) =>
      Math.round((w.completion_rate || 0) * 100)
    );

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#fff",
        borderColor: "#ddd",
        textStyle: { color: "#111", fontFamily: "var(--font-family-base)" },
      },
      legend: {
        data: ["Planificado (min)", "Real (min)", "% Finalización"],
        top: 10,
        textStyle: { color: "var(--color-text-primary)" },
      },
      grid: {
        left: "6%",
        right: "6%",
        bottom: "12%",
        top: 48,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "var(--color-text-secondary)" },
        axisLine: { lineStyle: { color: "var(--color-border)" } },
      },
      yAxis: [
        {
          type: "value",
          name: "Minutos",
          position: "left",
          axisLabel: { color: "var(--color-text-secondary)" },
          splitLine: { lineStyle: { color: "var(--color-border)" } },
        },
        {
          type: "value",
          name: "%",
          position: "right",
          axisLabel: { color: "var(--color-text-secondary)" },
          splitLine: { show: false },
          min: 0,
          max: 100,
        },
      ],
      series: [
        {
          name: "Planificado (min)",
          type: "bar",
          data: plannedData,
          itemStyle: { color: "#99bffb" },
          barMaxWidth: 26,
        },
        {
          name: "Real (min)",
          type: "bar",
          data: actualData,
          itemStyle: { color: "#4678e8" },
          barMaxWidth: 26,
        },
        {
          name: "% Finalización",
          type: "line",
          yAxisIndex: 1,
          data: completionData,
          itemStyle: { color: "#50b470" },
          smooth: true,
          lineStyle: { width: 3 },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
      dataZoom: [{ type: "slider", bottom: 8 }],
      toolbox: { show: false },
    };
  }, [items]);

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
      backgroundColor: "#ffffff",
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = "tendencia_semanal.png";
    a.click();
  }

  return (
    <>
      <Divider />

      <Box className={styles.sectionHeader}>
        <Typography variant="h6">Tendencia semanal</Typography>
        <div className={styles.chartButtons}>
          <Tooltip title="Acercar">
            <IconButton
              onClick={() => zoomChart(-10)}
              className={styles.iconBtn}
            >
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Alejar">
            <IconButton
              onClick={() => zoomChart(+10)}
              className={styles.iconBtn}
            >
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Restablecer zoom">
            <IconButton onClick={resetZoom} className={styles.iconBtn}>
              <FontAwesomeIcon icon={faRotateRight} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Intercambiar posiciones tabla/gráfica">
            <IconButton
              onClick={() => setSwap((s) => !s)}
              className={styles.iconBtn}
            >
              <FontAwesomeIcon icon={faArrowsLeftRight} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descargar imagen">
            <IconButton onClick={downloadPng} className={styles.iconBtn}>
              <FontAwesomeIcon icon={faDownload} />
            </IconButton>
          </Tooltip>
        </div>
      </Box>

      <Grid container spacing={2} className={styles.splitRow} wrap="nowrap">
        <Grid
          item
          xs={12}
          md={6}
          order={swap ? 2 : 1}
          sx={{
            minWidth: 0,
            overflow: "hidden",
            flexBasis: { md: "50%" },
            maxWidth: { md: "50%" },
          }}
        >
          <Paper className={styles.chartCard}>
            <EChartsReact
              ref={chartRef}
              option={chartOption}
              notMerge
              lazyUpdate
              style={{ width: "100%", height: 440 }}
            />
          </Paper>
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
          order={swap ? 1 : 2}
          sx={{
            minWidth: 0,
            overflow: "hidden",
            flexBasis: { md: "50%" },
            maxWidth: { md: "50%" },
          }}
        >
          <Paper className={styles.tableCard}>
            <Typography variant="subtitle2" className={styles.tableTitle}>
              Últimas {limitWeeks} semanas
            </Typography>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Semana</th>
                    <th>Creadas</th>
                    <th>Completadas</th>
                    <th>Planificado (min)</th>
                    <th>Real (min)</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((w) => (
                    <tr key={w.weekly_productivity_id}>
                      <td>{isoWeekToRangeLabel(w.iso_year, w.iso_week)}</td>
                      <td>{w.tasks_created}</td>
                      <td>{w.tasks_completed}</td>
                      <td>{w.planned_minutes}</td>
                      <td>{w.actual_minutes}</td>
                      <td>{Math.round((w.completion_rate || 0) * 100)}%</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.emptyCell}>
                        Sin datos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
