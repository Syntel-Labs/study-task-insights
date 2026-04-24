import { cn } from "@lib/utils";

export default function DueDateCell({ dueAt, completed }: { dueAt?: string | Date | null; completed?: boolean }) {
  if (!dueAt) return <span className="text-muted-foreground">—</span>;

  const d = new Date(dueAt);
  const today = new Date();
  const ymd = (x: Date) => [x.getFullYear(), x.getMonth(), x.getDate()].join("-");
  const isToday = ymd(d) === ymd(today);

  const label = d.toLocaleDateString("es-GT", { day: "2-digit", month: "short" });

  let toneClass = "text-foreground";
  if (!completed) {
    if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      toneClass = "text-destructive font-medium";
    } else if (isToday) {
      toneClass = "text-amber-600 dark:text-amber-400 font-medium";
    } else {
      toneClass = "text-foreground";
    }
  }

  return <span className={cn("tabular-nums", toneClass)}>{label}</span>;
}
