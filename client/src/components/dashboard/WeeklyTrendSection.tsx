import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@components/ui/chart";
import { isoWeekToRangeLabel } from "@utils/dates";

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

type Props = {
  items: WeeklyRow[];
  limitWeeks: number;
  swap: boolean;
  setSwap: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function WeeklyTrendSection({ items, limitWeeks, swap, setSwap }: Props) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      items.map((w) => ({
        week: `S${w.iso_week}`,
        planned: w.planned_minutes || 0,
        actual: w.actual_minutes || 0,
        completion: Math.round(w.completion_rate || 0),
      })),
    [items]
  );

  const chartConfig: ChartConfig = {
    planned: { label: t("dashboard.trend_planned"), color: "var(--chart-1)" },
    actual: { label: t("dashboard.trend_actual"), color: "var(--chart-2)" },
    completion: { label: t("dashboard.trend_completion"), color: "var(--chart-3)" },
  };

  return (
    <>
      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-lg font-semibold">{t("dashboard.trend_title")}</h3>
        <Button variant="outline" size="sm" onClick={() => setSwap((s) => !s)}>
          <ArrowLeftRight className="size-4" />
          {t("dashboard.trend_swap")}
        </Button>
      </div>

      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${swap ? "md:[direction:rtl]" : ""}`}>
        <Card className="md:[direction:ltr]">
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("dashboard.trend_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[380px] w-full">
              <ComposedChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar yAxisId="left" dataKey="planned" fill="var(--color-planned)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar yAxisId="left" dataKey="actual" fill="var(--color-actual)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="completion"
                  stroke="var(--color-completion)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:[direction:ltr]">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("dashboard.table_lastWeeks", { n: limitWeeks })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.table_week")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.table_created")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.table_completed")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.table_planned")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.table_actual")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.table_rate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      {t("common.noData")}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((w, i) => (
                  <TableRow key={w.weekly_productivity_id || i}>
                    <TableCell>{isoWeekToRangeLabel(w.iso_year, w.iso_week)}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.tasks_created}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.tasks_completed}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.planned_minutes}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.actual_minutes}</TableCell>
                    <TableCell className="text-right tabular-nums">{Math.round(w.completion_rate || 0)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
