import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { useTaskTagAssignmentsApi } from "@hooks/api";

type Tag = {
  taskTagId: string;
  name: string;
  color?: string | null;
};

type Props = {
  taskId?: string;
  allTags?: Tag[];
  selectedIds?: string[];
  onChange?: (ids: string[]) => void;
  disabled?: boolean;
};

type AssignmentItem = {
  taskTagId?: string;
  task_tag_id?: string;
  taskTagAssignmentId?: string;
  task_tag_assignment_id?: string;
};

export default function TagSelector({
  taskId,
  allTags = [],
  selectedIds = [],
  onChange,
  disabled = false,
}: Props) {
  const [toAddId, setToAddId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assignMap, setAssignMap] = useState<Map<string, string>>(
    () => new Map()
  );
  const assignmentsApi = useTaskTagAssignmentsApi?.();

  useEffect(() => {
    if (!taskId || !assignmentsApi?.listByTask) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await assignmentsApi.listByTask({ taskId });
        const map = new Map<string, string>();
        for (const it of (res?.items || []) as AssignmentItem[]) {
          const key = it.taskTagId || it.task_tag_id;
          const val = it.taskTagAssignmentId || it.task_tag_assignment_id;
          if (key && val) map.set(key, val);
        }
        if (!cancelled) setAssignMap(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId, assignmentsApi]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const available = useMemo(
    () =>
      allTags
        .filter((t) => !selectedSet.has(t.taskTagId))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTags, selectedSet]
  );

  async function addTag(tagId: string) {
    if (!tagId || selectedSet.has(tagId)) return;

    if (taskId && assignmentsApi?.add) {
      try {
        setLoading(true);
        await assignmentsApi.add({ taskId, taskTagId: tagId });

        const res = await assignmentsApi.listByTask({ taskId });
        const map = new Map<string, string>();
        for (const it of (res?.items || []) as AssignmentItem[]) {
          const key = it.taskTagId || it.task_tag_id;
          const val = it.taskTagAssignmentId || it.task_tag_assignment_id;
          if (key && val) map.set(key, val);
        }
        setAssignMap(map);
      } finally {
        setLoading(false);
      }
    }

    onChange?.([...selectedIds, tagId]);
    setToAddId("");
  }

  async function removeTag(tagId: string) {
    if (!selectedSet.has(tagId)) return;

    if (taskId && assignmentsApi?.remove) {
      const assignId = assignMap.get(tagId);
      if (assignId) {
        try {
          setLoading(true);
          await assignmentsApi.remove({ ids: [assignId] });
          const newMap = new Map(assignMap);
          newMap.delete(tagId);
          setAssignMap(newMap);
        } finally {
          setLoading(false);
        }
      }
    }

    onChange?.(selectedIds.filter((id) => id !== tagId));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="tag-toadd">Agregar tag</Label>
          <Select
            value={toAddId}
            onValueChange={setToAddId}
            disabled={disabled || loading || available.length === 0}
          >
            <SelectTrigger id="tag-toadd" size="sm" className="w-full">
              <SelectValue placeholder="Selecciona un tag…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((t) => (
                <SelectItem key={t.taskTagId} value={t.taskTagId}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => addTag(toAddId)}
          disabled={disabled || loading || !toAddId}
        >
          Agregar
        </Button>
      </div>

      <div className="min-h-8">
        {selectedIds.length === 0 ? (
          <span className="text-muted-foreground text-xs">
            Sin tags asignados.
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const tag = allTags.find((t) => t.taskTagId === id);
              if (!tag) return null;
              const style = tag.color
                ? { backgroundColor: tag.color, color: "#fff", borderColor: "transparent" }
                : undefined;
              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={tag.color ? "default" : "secondary"}
                      style={style}
                      className="gap-1 pr-1"
                    >
                      <span className="max-w-[140px] truncate">{tag.name}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(id)}
                        disabled={disabled || loading}
                        className="hover:bg-black/20 rounded-full p-0.5 transition-colors disabled:opacity-50"
                        aria-label={`Quitar ${tag.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{tag.name}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
