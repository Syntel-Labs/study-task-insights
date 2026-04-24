import { Archive, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { TableCell, TableRow } from "@components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import DueDateCell from "./DueDateCell";
import MiniProgressBar from "./MiniProgressBar";
import PriorityChip from "./PriorityChip";
import StatusBadge from "./StatusBadge";
import TagChips from "./TagChips";
import TypeChip from "./TypeChip";

type Task = {
  id: string;
  title: string;
  description?: string;
  dueAt?: string | null;
  estimatedMin?: number;
  actualMin?: number | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  status?: { name?: string; code?: string; isFinal?: boolean } | null;
  priority?: { name?: string; weight?: number } | null;
  type?: { name?: string } | null;
  tags?: { taskTagId?: string; name: string; color?: string | null }[];
};

type Props = {
  task: Task;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenDrawer?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export default function TaskRow({
  task,
  selected = false,
  onToggleSelect,
  onOpenDrawer,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
}: Props) {
  const isCompleted = !!task.completedAt;
  const isArchived = !!task.archivedAt;
  const estimated = task.estimatedMin ?? 0;
  const actual = task.actualMin ?? null;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/40"
      onDoubleClick={() => onOpenDrawer?.(task)}
      data-state={selected ? "selected" : undefined}
    >
      <TableCell className="w-10">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect?.(task.id)}
        />
      </TableCell>

      <TableCell>
        <button
          type="button"
          onClick={() => onOpenDrawer?.(task)}
          className="text-foreground hover:text-primary text-left font-medium transition-colors"
        >
          {task.title}
        </button>
        {task.description && (
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {task.description}
          </p>
        )}
      </TableCell>

      <TableCell>
        {task.status && <StatusBadge status={task.status} />}
      </TableCell>

      <TableCell>
        {task.priority && <PriorityChip priority={task.priority} />}
      </TableCell>

      <TableCell>{task.type && <TypeChip type={task.type} />}</TableCell>

      <TableCell>
        <TagChips
          tags={(task.tags ?? []).map((t) => ({
            taskTagId: t.taskTagId,
            name: t.name,
            color: t.color ?? undefined,
          }))}
        />
      </TableCell>

      <TableCell>
        <DueDateCell dueAt={task.dueAt ?? null} completed={isCompleted} />
      </TableCell>

      <TableCell className="tabular-nums">
        <div className="flex flex-col gap-1">
          <span className="text-xs">
            {estimated} / {actual ?? "—"} min
          </span>
          {estimated > 0 && (
            <MiniProgressBar
              estimatedMin={estimated}
              actualMin={actual}
              showLabel={false}
            />
          )}
        </div>
      </TableCell>

      <TableCell>
        <span
          className={cn(
            "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
            isCompleted
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : isArchived
                ? "bg-muted text-muted-foreground border-transparent"
                : "border-primary/30 bg-primary/10 text-primary"
          )}
        >
          {isCompleted ? "Completada" : isArchived ? "Archivada" : "Abierta"}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <div className="inline-flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit?.(task)}
                aria-label="Editar"
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onComplete?.(task)}
                aria-label="Completar"
              >
                <CheckCircle2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Completar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onArchive?.(task)}
                aria-label="Archivar"
              >
                <Archive className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archivar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete?.(task)}
                className="text-destructive hover:text-destructive"
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}
