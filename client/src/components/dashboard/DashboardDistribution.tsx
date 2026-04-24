import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@components/ui/chart";
import { useTasksApi } from "@hooks/api";

type TaskRow = {
  status?: { code?: string };
  priority?: { code?: string };
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--chart-4)",
  in_progress: "var(--chart-1)",
  completed: "var(--chart-3)",
  archived: "var(--chart-5)",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--chart-1)",
  normal: "var(--chart-2)",
  high: "var(--chart-4)",
  urgent: "var(--destructive)",
};

export default function DashboardDistribution() {
  const { t } = useTranslation();
  const { list: listTasks } = useTasksApi();
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => {
    let active = true;
    listTasks({ include: "all", pageSize: 500, archived: false })
      .then((resp) => {
        if (!active) return;
        const data = resp?.data as unknown;
        const rows: TaskRow[] = Array.isArray(data)
          ? (data as TaskRow[])
          : ((data as { items?: TaskRow[] })?.items ?? []);
        setTasks(rows);
      })
      .catch(() => setTasks([]));
    return () => {
      active = false;
    };
  }, [listTasks]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      const code = task.status?.code || "pending";
      counts[code] = (counts[code] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "var(--muted-foreground)",
    }));
  }, [tasks]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      const code = task.priority?.code || "normal";
      counts[code] = (counts[code] || 0) + 1;
    });
    const order = ["low", "normal", "high", "urgent"];
    return order
      .filter((o) => counts[o])
      .map((name) => ({ name, value: counts[name], fill: PRIORITY_COLORS[name] }));
  }, [tasks]);

  const statusConfig: ChartConfig = statusData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);

  const priorityConfig: ChartConfig = priorityData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);

  return (
    <>
      <Separator />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("dashboard.distribution_title")}</CardTitle>
            <CardDescription>{t("dashboard.distribution_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-[360px] w-full">
              <PieChart margin={{ top: 16, right: 24, bottom: 24, left: 24 }}>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius="42%"
                  outerRadius="62%"
                  paddingAngle={2}
                  labelLine={false}
                  label={(props: { percent?: number }) =>
                    `${((props.percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("dashboard.priority_title")}</CardTitle>
            <CardDescription>{t("dashboard.priority_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={priorityConfig} className="aspect-auto h-[300px] w-full">
              <BarChart data={priorityData} layout="vertical" margin={{ left: 12, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
