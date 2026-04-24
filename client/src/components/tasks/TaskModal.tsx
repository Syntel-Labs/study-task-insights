import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { toIsoDateString } from "@utils/dates";
import TagSelector from "./TagSelector";

const NONE_VALUE = "__none__";

type Status = { taskStatusId: string; name: string; isFinal?: boolean };
type Priority = { taskPriorityId: string; name: string; weight?: number };
type Type = { taskTypeId: string; name: string };
type Term = { termId: string; name: string };
type Tag = { taskTagId: string; name: string; color?: string | null };

type RawTask = Record<string, unknown> & {
  id?: string;
  taskId?: string;
  task_id?: string;
  title?: string;
  description?: string;
};

type Props = {
  open: boolean;
  loading?: boolean;
  initialTask?: RawTask | null;
  statuses?: Status[];
  priorities?: Priority[];
  types?: Type[];
  terms?: Term[];
  tags?: Tag[];
  onClose: () => void;
  onSubmit: (payload: {
    taskId?: string;
    title: string;
    description: string | null;
    taskStatusId: string;
    taskPriorityId: string;
    taskTypeId: string;
    termId: string | null;
    dueAt: string | null;
    estimatedMin: number;
    tagIds: string[];
  }) => void;
};

function pickId(obj: unknown, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (v != null && v !== "") return String(v);
  }
  return "";
}

export default function TaskModal({
  open,
  loading = false,
  initialTask = null,
  statuses = [],
  priorities = [],
  types = [],
  terms = [],
  tags = [],
  onClose,
  onSubmit,
}: Props) {
  const norm = useMemo(() => {
    const t = (initialTask ?? {}) as Record<string, unknown>;
    const taskTags = (t.task_tags ?? t.tags ?? []) as Record<string, unknown>[];
    const tagIds = taskTags
      .map((x) => String(x.taskTagId ?? x.task_tag_id ?? ""))
      .filter(Boolean);
    return {
      id: String(t.id ?? t.taskId ?? t.task_id ?? "") || null,
      title: (t.title as string) || "",
      description: (t.description as string) || "",
      taskStatusId: pickId(t, ["taskStatusId", "task_status_id"]) || pickId(t.status, ["taskStatusId"]) || pickId(t.task_status, ["taskStatusId"]),
      taskPriorityId:
        pickId(t, ["taskPriorityId", "task_priority_id"]) ||
        pickId(t.priority, ["taskPriorityId"]) ||
        pickId(t.task_priority, ["taskPriorityId"]),
      taskTypeId:
        pickId(t, ["taskTypeId", "task_type_id"]) ||
        pickId(t.type, ["taskTypeId"]) ||
        pickId(t.task_type, ["taskTypeId"]),
      termId: pickId(t, ["termId", "term_id"]) || pickId(t.term, ["termId"]),
      dueAt: (t.dueAt ?? t.due_at ?? null) as string | null,
      estimatedMin: Number((t.estimatedMin ?? t.estimated_min ?? 0) as number),
      tagIds,
    };
  }, [initialTask]);

  const [form, setForm] = useState(norm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(norm);
      setErrors({});
    }
  }, [open, norm]);

  function setField<K extends keyof typeof form>(
    key: K,
    val: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const dueInput = useMemo(() => {
    if (!form.dueAt) return "";
    const d = typeof form.dueAt === "string" ? new Date(form.dueAt) : form.dueAt;
    return toIsoDateString(d);
  }, [form.dueAt]);

  function handleDueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!val) return setField("dueAt", null);
    const iso = new Date(`${val}T00:00:00.000Z`).toISOString();
    setField("dueAt", iso);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    const isEdit = !!form.id;
    if (!form.title.trim()) next.title = "Obligatorio";
    if (!isEdit) {
      if (!form.taskStatusId) next.taskStatusId = "Obligatorio";
      if (!form.taskPriorityId) next.taskPriorityId = "Obligatorio";
      if (!form.taskTypeId) next.taskTypeId = "Obligatorio";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!validate()) return;

    onSubmit({
      ...(form.id ? { taskId: form.id } : {}),
      title: form.title.trim(),
      description: form.description?.trim() || null,
      taskStatusId: form.taskStatusId,
      taskPriorityId: form.taskPriorityId,
      taskTypeId: form.taskTypeId,
      termId: form.termId || null,
      dueAt: form.dueAt || null,
      estimatedMin: Number.isFinite(Number(form.estimatedMin))
        ? Number(form.estimatedMin)
        : 0,
      tagIds: Array.isArray(form.tagIds) ? form.tagIds : [],
    });
  }

  const isEdit = !!initialTask;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          id="task-modal-form"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              aria-invalid={!!errors.title}
              autoFocus
            />
            {errors.title && (
              <span className="text-destructive text-xs">{errors.title}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Select
                value={form.taskStatusId}
                onValueChange={(v) => setField("taskStatusId", v)}
              >
                <SelectTrigger size="sm" aria-invalid={!!errors.taskStatusId}>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.taskStatusId} value={s.taskStatusId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Prioridad</Label>
              <Select
                value={form.taskPriorityId}
                onValueChange={(v) => setField("taskPriorityId", v)}
              >
                <SelectTrigger size="sm" aria-invalid={!!errors.taskPriorityId}>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.taskPriorityId} value={p.taskPriorityId}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.taskTypeId}
                onValueChange={(v) => setField("taskTypeId", v)}
              >
                <SelectTrigger size="sm" aria-invalid={!!errors.taskTypeId}>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.taskTypeId} value={t.taskTypeId}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Término</Label>
              <Select
                value={form.termId || NONE_VALUE}
                onValueChange={(v) =>
                  setField("termId", v === NONE_VALUE ? "" : v)
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="(Ninguno)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>(Ninguno)</SelectItem>
                  {terms.map((t) => (
                    <SelectItem key={t.termId} value={t.termId}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due">Vence</Label>
              <Input
                id="task-due"
                type="date"
                value={dueInput}
                onChange={handleDueChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-est">Estimado (min)</Label>
              <Input
                id="task-est"
                type="number"
                min={0}
                step={1}
                value={form.estimatedMin}
                onChange={(e) =>
                  setField("estimatedMin", Number(e.target.value))
                }
              />
            </div>
          </div>

          <div>
            <TagSelector
              allTags={tags}
              selectedIds={form.tagIds}
              onChange={(ids) => setField("tagIds", ids)}
              disabled={loading}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="task-modal-form"
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
