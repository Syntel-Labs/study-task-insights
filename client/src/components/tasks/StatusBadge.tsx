import { useMemo } from "react";
import { Badge } from "@components/ui/badge";
import { cn } from "@lib/utils";

type StatusLike = { name?: string; code?: string; isFinal?: boolean } | null | undefined;

export default function StatusBadge({ status }: { status: StatusLike }) {
  const { label, className } = useMemo(() => {
    if (!status) return { label: "—", className: "border-dashed" };
    const code = (status.code || "").toLowerCase();
    const isFinal = !!status.isFinal;

    if (code.includes("arch") || code.includes("archive"))
      return { label: status.name, className: "bg-muted text-muted-foreground border-transparent" };
    if (isFinal || code.includes("done") || code.includes("complete"))
      return { label: status.name, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" };
    if (code.includes("block") || code.includes("cancel"))
      return { label: status.name, className: "bg-destructive/15 text-destructive border-destructive/30" };
    if (code.includes("prog"))
      return { label: status.name, className: "bg-primary/15 text-primary border-primary/30" };

    return { label: status.name, className: "" };
  }, [status]);

  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {label}
    </Badge>
  );
}
