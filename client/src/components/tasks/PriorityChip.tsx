import { useMemo } from "react";
import { Badge } from "@components/ui/badge";
import { cn } from "@lib/utils";

type PriorityLike = { name?: string; weight?: number } | null | undefined;

export default function PriorityChip({ priority }: { priority: PriorityLike }) {
  const { label, className } = useMemo(() => {
    if (!priority) return { label: "—", className: "border-dashed" };
    const w = Number(priority.weight ?? 0);
    if (w <= 1) return { label: priority.name, className: "bg-destructive text-destructive-foreground border-transparent" };
    if (w <= 2) return { label: priority.name, className: "bg-amber-500 text-white border-transparent" };
    return { label: priority.name, className: "bg-emerald-600 text-white border-transparent" };
  }, [priority]);

  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}
