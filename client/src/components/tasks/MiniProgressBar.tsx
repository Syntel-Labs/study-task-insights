import { useMemo } from "react";
import { cn } from "@lib/utils";

type Props = {
  estimatedMin?: number;
  actualMin?: number | null;
  height?: number;
  showLabel?: boolean;
};

export default function MiniProgressBar({ estimatedMin = 0, actualMin, height = 8, showLabel = true }: Props) {
  if (actualMin == null) return <span className="text-muted-foreground">—</span>;

  const { pct, barWidth, toneClass, label } = useMemo(() => {
    const a = Math.max(0, Number(actualMin) || 0);
    const e = Math.max(0, Number(estimatedMin) || 0);
    const rawPct = e > 0 ? (a / e) * 100 : 100;
    const pct = Math.round(rawPct);
    const barWidth = Math.max(0, Math.min(100, rawPct));

    let toneClass = "bg-emerald-500";
    if (e === 0 && a > 0) toneClass = "bg-amber-500";
    else if (e > 0 && a > e * 1.25) toneClass = "bg-destructive";
    else if (e > 0 && a > e) toneClass = "bg-amber-500";

    const label = `${a} / ${e} min (${isFinite(pct) ? Math.min(pct, 999) : 0}%)`;
    return { pct, barWidth, toneClass, label };
  }, [actualMin, estimatedMin]);

  return (
    <div className="flex flex-col gap-1">
      <div className="bg-muted relative overflow-hidden rounded-full" style={{ height }}>
        <div
          className={cn("h-full transition-all", toneClass)}
          style={{ width: `${barWidth}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        />
      </div>
      {showLabel && <span className="text-muted-foreground text-xs tabular-nums">{label}</span>}
    </div>
  );
}
