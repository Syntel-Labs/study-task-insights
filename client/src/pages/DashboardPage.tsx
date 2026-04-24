import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useWeeklyProductivityApi } from "@hooks/api";
import { useAuth } from "@context/AuthContext.jsx";
import { Separator } from "@components/ui/separator";
import DashboardHeader from "@components/dashboard/DashboardHeader";
import DashboardKpis from "@components/dashboard/DashboardKpis";
import WeeklyTrendSection from "@components/dashboard/WeeklyTrendSection";
import DashboardDistribution from "@components/dashboard/DashboardDistribution";

type WeeklyRow = {
  weekly_productivity_id?: number;
  iso_week?: number;
  iso_year?: number;
  planned_minutes?: number;
  actual_minutes?: number;
  completion_rate?: number;
  tasks_created?: number;
  tasks_completed?: number;
};

type WeeklyApi = ReturnType<typeof useWeeklyProductivityApi> & {
  refresh?: () => Promise<{ code?: string; message?: string }>;
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const api = useWeeklyProductivityApi() as WeeklyApi;
  const { list } = api;
  const refreshMetrics = api.refresh;
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WeeklyRow[]>([]);
  const [limitWeeks, setLimitWeeks] = useState(8);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [swap, setSwap] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const loadingRef = useRef(false);

  async function load() {
    if (!isAuthenticated) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const resp = await list({ limit: limitWeeks });
      const data = resp?.data as unknown;
      const rows: WeeklyRow[] = Array.isArray(data)
        ? (data as WeeklyRow[])
        : ((data as { items?: WeeklyRow[] })?.items ?? []);
      setItems(rows);
      setLastUpdate(new Date());
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  function translateServerCode(code?: string | null) {
    if (!code) return null;
    const key = `messages.${code}`;
    const translated = t(key);
    return translated === key ? null : translated;
  }

  async function handleRefresh() {
    if (!refreshMetrics) return;
    try {
      setUpdating(true);
      const resp = await refreshMetrics();
      await load();
      const serverMsg = translateServerCode((resp?.code as string | undefined) || resp?.message);
      toast.success(t("messages.metrics_updated"), {
        description: serverMsg || t("messages.weekly_productivity_refreshed"),
      });
    } catch (err) {
      const e = err as { message?: string };
      toast.error(t("common.error"), { description: e?.message || t("messages.metrics_error") });
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, limitWeeks]);

  const last = items[0] || {};
  const planned = last.planned_minutes || 0;
  const actual = last.actual_minutes || 0;
  const completionRate = last.completion_rate || 0;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        limitWeeks={limitWeeks}
        setLimitWeeks={setLimitWeeks}
        updating={updating}
        onRefresh={handleRefresh}
        lastUpdate={lastUpdate}
      />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}

      <Separator />

      <DashboardKpis last={last} planned={planned} actual={actual} completionRate={completionRate} />

      <WeeklyTrendSection items={items} limitWeeks={limitWeeks} swap={swap} setSwap={setSwap} />

      <DashboardDistribution />
    </div>
  );
}
