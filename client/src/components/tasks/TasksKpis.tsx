import { CheckCircle2, Clock, FolderOpen, Timer } from "lucide-react";
import { Card, CardContent } from "@components/ui/card";
import { Progress } from "@components/ui/progress";

type Kpis = {
  open: number;
  dueToday: number;
  overdue: number;
  estTotal: number;
};

type Props = { kpis: Kpis };

type Tone = "blue" | "amber" | "red" | "emerald";

const toneStyles: Record<Tone, { icon: string; bar: string }> = {
  blue: {
    icon: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    bar: "[&>[data-slot=progress-indicator]]:bg-blue-500",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    bar: "[&>[data-slot=progress-indicator]]:bg-amber-500",
  },
  red: {
    icon: "bg-destructive/15 text-destructive",
    bar: "[&>[data-slot=progress-indicator]]:bg-destructive",
  },
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    bar: "[&>[data-slot=progress-indicator]]:bg-emerald-500",
  },
};

function KpiCard({
  title,
  value,
  tone,
  progress,
  Icon,
}: {
  title: string;
  value: number;
  tone: Tone;
  progress: number;
  Icon: typeof FolderOpen;
}) {
  const s = toneStyles[tone];
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {title}
          </span>
          <span
            className={`flex size-8 items-center justify-center rounded-md ${s.icon}`}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <span className="text-foreground text-3xl font-semibold tabular-nums">
          {value}
        </span>
        <Progress value={progress} className={s.bar} />
      </CardContent>
    </Card>
  );
}

export default function TasksKpis({ kpis }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Abiertas"
        value={kpis.open}
        tone="blue"
        progress={kpis.open ? 100 : 0}
        Icon={FolderOpen}
      />
      <KpiCard
        title="Vencen hoy"
        value={kpis.dueToday}
        tone="amber"
        progress={Math.min(kpis.dueToday * 20, 100)}
        Icon={Clock}
      />
      <KpiCard
        title="Vencidas"
        value={kpis.overdue}
        tone="red"
        progress={Math.min(kpis.overdue * 20, 100)}
        Icon={CheckCircle2}
      />
      <KpiCard
        title="Estimado (min)"
        value={kpis.estTotal}
        tone="emerald"
        progress={kpis.estTotal ? 100 : 0}
        Icon={Timer}
      />
    </div>
  );
}
