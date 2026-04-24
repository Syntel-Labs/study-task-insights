import { Badge } from "@components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";

type Tag = { taskTagId?: number | string; id?: number | string; name: string; color?: string };

export default function TagChips({ tags = [], max = 4 }: { tags?: Tag[]; max?: number }) {
  if (!tags.length) return <span className="text-muted-foreground">—</span>;

  const visible = tags.slice(0, max);
  const rest = tags.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <TooltipProvider>
        {visible.map((t) => {
          const key = t.taskTagId ?? t.id ?? t.name;
          const hasColor = !!t.color;
          const chip = hasColor ? (
            <Badge
              key={key}
              className="border-transparent font-semibold text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.name}
            </Badge>
          ) : (
            <Badge key={key} variant="secondary" className="font-medium">
              {t.name}
            </Badge>
          );
          if (!hasColor) return chip;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>{chip}</TooltipTrigger>
              <TooltipContent>{t.name}</TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
      {rest > 0 && (
        <Badge variant="outline" className="text-muted-foreground">
          +{rest}
        </Badge>
      )}
    </div>
  );
}
