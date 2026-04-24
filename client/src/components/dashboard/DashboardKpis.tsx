import { useTranslation } from "react-i18next";
import { Clock, CheckCircle2, ListChecks, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import { cn } from "@lib/utils";

type WeeklyRow = {
  tasks_created?: number;
  tasks_completed?: number;
  planned_minutes?: number;
  actual_minutes?: number;
  completion_rate?: number;
};

type KpiCardProps = {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  subLabel: string;
  value: string;
  progress: number;
  progressColor: string;
};

function KpiCard({ icon: Icon, iconClass, label, subLabel, value, progress, progressColor }: KpiCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", iconClass)}>
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">{label}</p>
          <p className="text-muted-foreground text-xs">{subLabel}</p>
        </div>
        <p className="text-foreground text-2xl font-bold tabular-nums">{value}</p>
        <Progress value={progress} className={progressColor} />
      </CardContent>
    </Card>
  );
}

type Props = {
  last: WeeklyRow;
  planned: number;
  actual: number;
  completionRate: number;
};

export default function DashboardKpis({ last, planned, actual, completionRate }: Props) {
  const { t } = useTranslation();
  const ratioPlannedVsActual = planned ? Math.min((actual / planned) * 100, 100) : 0;
  const tasksCreated = last?.tasks_created || 0;
  const tasksCompleted = last?.tasks_completed || 0;
  const tasksRatio = tasksCreated ? Math.min((tasksCompleted / tasksCreated) * 100, 100) : 0;
  const completionPct = Math.min(Number(completionRate) || 0, 100);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <KpiCard
        icon={Clock}
        iconClass="bg-gradient-to-br from-blue-700 to-blue-500"
        label={t("dashboard.kpi_timeTotal")}
        subLabel={t("dashboard.kpi_timeTotalSub")}
        value={`${planned} / ${actual}`}
        progress={ratioPlannedVsActual}
        progressColor="[&>[data-slot=progress-indicator]]:bg-blue-500"
      />
      <KpiCard
        icon={CheckCircle2}
        iconClass="bg-gradient-to-br from-emerald-700 to-emerald-500"
        label={t("dashboard.kpi_completion")}
        subLabel={t("dashboard.kpi_completionSub")}
        value={`${Math.round(completionPct)}%`}
        progress={completionPct}
        progressColor="[&>[data-slot=progress-indicator]]:bg-emerald-500"
      />
      <KpiCard
        icon={ListChecks}
        iconClass="bg-gradient-to-br from-orange-600 to-amber-500"
        label={t("dashboard.kpi_tasks")}
        subLabel={t("dashboard.kpi_tasksSub")}
        value={`${tasksCreated} / ${tasksCompleted}`}
        progress={tasksRatio}
        progressColor="[&>[data-slot=progress-indicator]]:bg-orange-500"
      />
    </div>
  );
}
