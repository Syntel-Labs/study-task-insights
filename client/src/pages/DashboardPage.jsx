import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Stack, Box, Divider } from "@mui/material";
import { useProductivityApi } from "@utils/apiResources";
import DashboardHeader from "@components/dashboard/DashboardHeader.jsx";
import DashboardKpis from "@components/dashboard/DashboardKpis.jsx";
import WeeklyTrendSection from "@components/dashboard/WeeklyTrendSection.jsx";
import styles from "@styles/dashboard.module.scss";

export default function DashboardPage() {
  const { list, refresh } = useProductivityApi();
  const [items, setItems] = useState([]);
  const [limitWeeks, setLimitWeeks] = useState(8);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [swap, setSwap] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

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

  return (
    <Stack spacing={4} className={styles.dashboardRoot}>
      <DashboardHeader
        limitWeeks={limitWeeks}
        setLimitWeeks={setLimitWeeks}
        updating={updating}
        onRefresh={handleRefresh}
        lastUpdate={lastUpdate}
      />

      <Divider />

      <DashboardKpis
        last={last}
        planned={planned}
        actual={actual}
        completionRate={completionRate}
      />

      <WeeklyTrendSection
        items={items}
        limitWeeks={limitWeeks}
        swap={swap}
        setSwap={setSwap}
      />
    </Stack>
  );
}
