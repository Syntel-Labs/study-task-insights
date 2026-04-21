import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Stack, Box, Divider } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useWeeklyProductivityApi } from "@hooks/api/weeklyProductivity.js";
import { useAuth } from "@context/AuthContext.jsx";
import DashboardHeader from "@components/dashboard/DashboardHeader.jsx";
import DashboardKpis from "@components/dashboard/DashboardKpis.jsx";
import WeeklyTrendSection from "@components/dashboard/WeeklyTrendSection.jsx";
import DashboardDistribution from "@components/dashboard/DashboardDistribution.jsx";
import styles from "@styles/dashboard.module.scss";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { list, refresh: refreshMetrics } = useWeeklyProductivityApi();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [limitWeeks, setLimitWeeks] = useState(8);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [swap, setSwap] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const loadingRef = useRef(false);

  async function load() {
    if (!isAuthenticated) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await list({ limit: limitWeeks });
      setItems(data?.items ?? []);
      setLastUpdate(new Date());
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  function translateServerCode(code) {
    if (!code) return null;
    const key = `messages.${code}`;
    const translated = t(key);
    return translated === key ? null : translated;
  }

  async function handleRefresh() {
    try {
      setUpdating(true);
      const resp = await refreshMetrics();
      await load();
      const serverMsg = translateServerCode(resp?.code || resp?.message);
      Swal.fire({
        icon: "success",
        title: t("messages.metrics_updated"),
        text: serverMsg || t("messages.weekly_productivity_refreshed"),
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: e?.message || t("messages.metrics_error"),
      });
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    load();
  }, [isAuthenticated, limitWeeks]);

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

      {loading && (
        <Box className={styles.loadingBox}>
          <div className={styles.spinner} />
        </Box>
      )}

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

      <DashboardDistribution />
    </Stack>
  );
}
