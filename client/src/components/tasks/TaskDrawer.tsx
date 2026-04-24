import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";
import { Textarea } from "@components/ui/textarea";
import { toIsoDateString } from "@utils/dates";
import ConfirmDialog from "./ConfirmDialog";
import TagSelector from "./TagSelector";

const NONE_VALUE = "__none__";

type Status = { taskStatusId: string; name: string; isFinal?: boolean };
type Priority = { taskPriorityId: string; name: string; weight?: number };
type Type = { taskTypeId: string; name: string };
type Term = { termId: string; name: string };
type Tag = { taskTagId: string; name: string; color?: string | null };

type RawTask = Record<string, unknown> | null | undefined;

type UpdatePayload = {
  taskId: string;
  title?: string;
  description?: string | null;
  dueAt?: string | null;
  estimatedMin?: number;
  status?: { connect: { taskStatusId: number } };
  priority?: { connect: { taskPriorityId: number } };
  type?: { connect: { taskTypeId: number } };
  term?: { connect: { termId: number } } | { disconnect: true };
};

type Props = {
  open: boolean;
  task: RawTask;
  statuses?: Status[];
  priorities?: Priority[];
  types?: Type[];
  terms?: Term[];
  tags?: Tag[];
  loading?: boolean;
  onClose: () => void;
  onUpdate?: (payload: UpdatePayload) => void | Promise<void>;
  onComplete?: (opts?: { actualMin?: number }) => void | Promise<void>;
  onArchive?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onAfterTagsChange?: (newIds: string[]) => void;
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

type ConfirmType = "complete" | "archive" | "delete" | null;

export default function TaskDrawer({
  open,
  task,
  statuses = [],
  priorities = [],
  types = [],
  terms = [],
  tags = [],
  loading = false,
  onClose,
  onUpdate,
  onComplete,
  onArchive,
  onDelete,
  onAfterTagsChange,
}: Props) {
  const norm = useMemo(() => {
    const t = (task ?? {}) as Record<string, unknown>;
    const status = (t.taskStatus ?? t.task_status ?? t.status ?? null) as Record<string, unknown> | null;
    const priority = (t.taskPriority ?? t.task_priority ?? t.priority ?? null) as Record<string, unknown> | null;
    const type = (t.taskType ?? t.task_type ?? t.type ?? null) as Record<string, unknown> | null;
    const term = (t.term ?? t.term_obj ?? null) as Record<string, unknown> | null;
    const tagItems = (t.task_tags ?? t.tags ?? []) as Record<string, unknown>[];
    const tagIds = tagItems
      .map((x) => String(x.taskTagId ?? x.task_tag_id ?? ""))
      .filter(Boolean);

    return {
      id: String(t.id ?? t.taskId ?? t.task_id ?? "") || null,
      title: (t.title as string) || "",
      description: (t.description as string) || "",
      taskStatusId:
        pickId(status, ["taskStatusId"]) ||
        pickId(t, ["taskStatusId", "task_status_id"]),
      taskPriorityId:
        pickId(priority, ["taskPriorityId"]) ||
        pickId(t, ["taskPriorityId", "task_priority_id"]),
      taskTypeId:
        pickId(type, ["taskTypeId"]) ||
        pickId(t, ["taskTypeId", "task_type_id"]),
      termId: pickId(term, ["termId"]) || pickId(t, ["termId", "term_id"]),
      dueAt: (t.dueAt ?? t.due_at ?? null) as string | null,
      estimatedMin: Number((t.estimatedMin ?? t.estimated_min ?? 0) as number),
      createdAt: (t.createdAt ?? t.created_at ?? null) as string | null,
      updatedAt: (t.updatedAt ?? t.updated_at ?? null) as string | null,
      completedAt: (t.completedAt ?? t.completed_at ?? null) as string | null,
      archivedAt: (t.archivedAt ?? t.archived_at ?? null) as string | null,
      tagIds,
    };
  }, [task]);

  const [form, setForm] = useState(norm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ type: ConfirmType; open: boolean }>({
    type: null,
    open: false,
  });

  useEffect(() => {
    if (open) setForm(norm);
  }, [open, norm]);

  function setField<K extends keyof typeof form>(
    k: K,
    v: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [k]: v }));
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
    if (!form.title.trim()) next.title = "Obligatorio";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const eq = (a: unknown, b: unknown) => {
    if (a === b) return true;
    if (a == null && b == null) return true;
    return String(a) === String(b);
  };

  async function handleSave() {
    if (!validate()) return;
    const taskId = form.id;
    if (!taskId) return;

    const data: UpdatePayload = { taskId };

    if (!eq(form.title, norm.title)) data.title = form.title.trim();
    if (!eq(form.description, norm.description))
      data.description = form.description?.trim() || null;
    if (!eq(form.dueAt, norm.dueAt)) data.dueAt = form.dueAt || null;

    const est = Number.isFinite(Number(form.estimatedMin))
      ? Number(form.estimatedMin)
      : 0;
    if (!eq(est, norm.estimatedMin)) data.estimatedMin = est;

    if (!eq(form.taskStatusId, norm.taskStatusId) && form.taskStatusId !== "") {
      data.status = { connect: { taskStatusId: Number(form.taskStatusId) } };
    }
    if (
      !eq(form.taskPriorityId, norm.taskPriorityId) &&
      form.taskPriorityId !== ""
    ) {
      data.priority = { connect: { taskPriorityId: Number(form.taskPriorityId) } };
    }
    if (!eq(form.taskTypeId, norm.taskTypeId) && form.taskTypeId !== "") {
      data.type = { connect: { taskTypeId: Number(form.taskTypeId) } };
    }
    if (!eq(form.termId || "", norm.termId || "")) {
      data.term =
        form.termId === "" || form.termId == null
          ? { disconnect: true }
          : { connect: { termId: Number(form.termId) } };
    }

    if (Object.keys(data).length <= 1) return;
    await onUpdate?.(data);
  }

  function openConfirm(type: ConfirmType) {
    setConfirm({ type, open: true });
  }
  function closeConfirm() {
    setConfirm({ type: null, open: false });
  }
  async function handleConfirm(payload?: { actualMin?: number }) {
    try {
      if (confirm.type === "complete") await onComplete?.(payload);
      else if (confirm.type === "archive") await onArchive?.();
      else if (confirm.type === "delete") await onDelete?.();
    } finally {
      closeConfirm();
    }
  }

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Guatemala",
    }).format(d);
  }

  const isFinalStatus = useMemo(
    () =>
      statuses.find((s) => s.taskStatusId === form.taskStatusId)?.isFinal ??
      false,
    [form.taskStatusId, statuses]
  );

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && !loading && onClose()}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-xl"
        >
          <SheetHeader className="flex flex-row items-center justify-between gap-3 border-b p-4">
            <SheetTitle className="truncate">
              {form.title?.trim() || "Detalle de tarea"}
            </SheetTitle>
            <Button onClick={handleSave} disabled={loading} size="sm">
              Guardar
            </Button>
          </SheetHeader>

          <div className="flex flex-col gap-5 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="drawer-title">Título</Label>
                <Input
                  id="drawer-title"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <span className="text-destructive text-xs">{errors.title}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="drawer-description">Descripción</Label>
                <Textarea
                  id="drawer-description"
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
                    <SelectTrigger size="sm">
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
                    <SelectTrigger size="sm">
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
                    <SelectTrigger size="sm">
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
                  <Label htmlFor="drawer-due">Vence</Label>
                  <Input
                    id="drawer-due"
                    type="date"
                    value={dueInput}
                    onChange={handleDueChange}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="drawer-est">Estimado (min)</Label>
                  <Input
                    id="drawer-est"
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
            </div>

            <Separator />

            <section className="flex flex-col gap-2">
              <h3 className="text-foreground text-sm font-semibold">Tags</h3>
              <TagSelector
                taskId={form.id ?? undefined}
                allTags={tags}
                selectedIds={form.tagIds}
                onChange={(newIds) => {
                  setField("tagIds", newIds);
                  onAfterTagsChange?.(newIds);
                }}
                disabled={loading}
              />
            </section>

            <Separator />

            <section className="flex flex-col gap-2">
              <h3 className="text-foreground text-sm font-semibold">
                Metadatos
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Creada</dt>
                  <dd className="tabular-nums">{fmtDate(form.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Actualizada</dt>
                  <dd className="tabular-nums">{fmtDate(form.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Completada</dt>
                  <dd className="tabular-nums">{fmtDate(form.completedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Archivada</dt>
                  <dd className="tabular-nums">{fmtDate(form.archivedAt)}</dd>
                </div>
              </dl>
            </section>

            <Separator />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => openConfirm("complete")}
                disabled={loading || isFinalStatus}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Completar
              </Button>
              <Button
                variant="outline"
                onClick={() => openConfirm("archive")}
                disabled={loading}
              >
                Archivar
              </Button>
              <Button
                variant="destructive"
                onClick={() => openConfirm("delete")}
                disabled={loading}
              >
                Eliminar
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cerrar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirm.open && confirm.type === "complete"}
        title="Marcar como completada"
        tone="primary"
        message={
          <span>
            La tarea se marcará como <b>completada</b>. Puedes registrar
            minutos reales (opcional).
          </span>
        }
        askActualMin
        confirmLabel="Completar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirm.open && confirm.type === "archive"}
        title="Archivar tarea"
        tone="warning"
        message="La tarea será archivada. Podrás cambiar su estado posteriormente."
        confirmLabel="Archivar"
        onClose={closeConfirm}
        onConfirm={() => handleConfirm()}
      />
      <ConfirmDialog
        open={confirm.open && confirm.type === "delete"}
        title="Eliminar tarea"
        tone="danger"
        message="Esta acción es definitiva y no se puede deshacer."
        confirmLabel="Eliminar"
        onClose={closeConfirm}
        onConfirm={() => handleConfirm()}
      />
    </>
  );
}
