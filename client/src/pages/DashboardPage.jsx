import React, { useEffect, useMemo, useState, useRef } from "react";
import Swal from "sweetalert2";
import EChartsReact from "echarts-for-react";
import {
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Button,
  Stack,
  Box,
  Divider,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsLeftRight,
  faDownload,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

import { useProductivityApi } from "@utils/apiResources";
import styles from "@styles/dashboard.module.scss";

// conversión de ISO
function isoWeekToRangeLabel(isoYear, isoWeek) {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstThu = new Date(jan4);
  firstThu.setUTCDate(jan4.getUTCDate() + (4 - jan4Day));
  const targetThu = new Date(firstThu);
  targetThu.setUTCDate(firstThu.getUTCDate() + (isoWeek - 1) * 7);
  const start = new Date(targetThu);
  start.setUTCDate(targetThu.getUTCDate() - 3);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const fmt = new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  return `${fmt.format(start)}–${fmt.format(end)} (${isoWeek})`;
}

export default function DashboardPage() {
  const { list, refresh } = useProductivityApi();
  const [items, setItems] = useState([]);
  const [limitWeeks, setLimitWeeks] = useState(8);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [swap, setSwap] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const chartRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const data = await list({ limit: limitWeeks });
      setItems(data?.items ?? []);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }

  // Actualizar métricas
  async function handleRefresh() {
    try {
      setUpdating(true);
      const resp = await refresh();
      await load();
      Swal.fire(
        "Métricas actualizadas",
        resp?.message || "Se recalcularon las métricas.",
        "success"
      );
    } catch (e) {
      Swal.fire(
        "Error",
        e?.message || "No se pudieron actualizar las métricas.",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    load();
  }, [limitWeeks]);

  const last = items[0] || {};
  const planned = last.planned_minutes || 0;
  const actual = last.actual_minutes || 0;
  const completionRate = last.completion_rate || 0;

  // configuración de graficas
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
      toolbox: { show: false },
      dataZoom: [{ type: "slider", bottom: 8 }],
    };
  }, [items]);

  // acciones para comportamiento de gráficas y metricas
  function zoomChart(delta) {
    const inst = chartRef.current?.getEchartsInstance?.();
    if (!inst) return;

    const opt = inst.getOption();
    const dz = opt.dataZoom?.[0] || { start: 0, end: 100 };
    let start = dz.start ?? 0;
    let end = dz.end ?? 100;

    const span = end - start; // tamaño actual (0–100)
    const center = start + span / 2; // centro actual
    const newSpan = Math.max(5, Math.min(100, span + delta)); // <-- FIX

    const ns = Math.max(0, center - newSpan / 2);
    const ne = Math.min(100, center + newSpan / 2);

    inst.dispatchAction({ type: "dataZoom", start: ns, end: ne });
  }

  function resetZoom() {
    const inst = chartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    inst.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
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
    <Stack spacing={4} className={styles.dashboardRoot}>
      {/* Encabezado (Semanas + Refrescar + Última actualización) */}
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
              onClick={handleRefresh}
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

      <Divider />

      {/*KPIs*/}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper className={styles.kpiCard}>
            <Typography variant="subtitle2" className={styles.kpiLabel}>
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
        <Grid item xs={12} md={4}>
          <Paper className={styles.kpiCard}>
            <Typography variant="subtitle2" className={styles.kpiLabel}>
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
        <Grid item xs={12} md={4}>
          <Paper className={styles.kpiCard}>
            <Typography variant="subtitle2" className={styles.kpiLabel}>
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

      <Divider />

      {/* Tendencia semanal */}
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
    </Stack>
  );
}
