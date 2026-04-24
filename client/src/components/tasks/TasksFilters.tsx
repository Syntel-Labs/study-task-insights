import { useMemo } from "react";
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
import { toIsoDateString } from "@utils/dates";
import TagSelector from "./TagSelector";

const NULL_VALUE = "__all__";

type Status = { taskStatusId: string; name: string };
type Priority = { taskPriorityId: string; name: string; weight?: number };
type Type = { taskTypeId: string; name: string };
type Term = { termId: string; name: string };
type Tag = { taskTagId: string; name: string; color?: string | null };

type Props = {
  statusId?: string | null;
  priorityId?: string | null;
  typeId?: string | null;
  termId?: string | null;
  tagIds?: string[];
  dueFrom?: string | null;
  dueTo?: string | null;

  statuses?: Status[];
  priorities?: Priority[];
  types?: Type[];
  terms?: Term[];
  tags?: Tag[];

  onChangeStatus?: (v: string | null) => void;
  onChangePriority?: (v: string | null) => void;
  onChangeType?: (v: string | null) => void;
  onChangeTerm?: (v: string | null) => void;
  onChangeTags?: (v: string[]) => void;
  onChangeDueFrom?: (v: string | null) => void;
  onChangeDueTo?: (v: string | null) => void;

  onApply?: () => void;
  onClear?: () => void;
};

export default function TasksFilters({
  statusId,
  priorityId,
  typeId,
  termId,
  tagIds = [],
  dueFrom,
  dueTo,
  statuses = [],
  priorities = [],
  types = [],
  terms = [],
  tags = [],
  onChangeStatus,
  onChangePriority,
  onChangeType,
  onChangeTerm,
  onChangeTags,
  onChangeDueFrom,
  onChangeDueTo,
  onApply,
  onClear,
}: Props) {
  const normPriorities = useMemo(
    () => [...priorities].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)),
    [priorities]
  );

  const dueFromInput = useMemo(() => {
    if (!dueFrom) return "";
    const d = typeof dueFrom === "string" ? new Date(dueFrom) : dueFrom;
    return toIsoDateString(d);
  }, [dueFrom]);

  const dueToInput = useMemo(() => {
    if (!dueTo) return "";
    const d = typeof dueTo === "string" ? new Date(dueTo) : dueTo;
    return toIsoDateString(d);
  }, [dueTo]);

  function handleDateFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChangeDueFrom?.(val ? new Date(`${val}T00:00:00.000Z`).toISOString() : null);
  }

  function handleDateToChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChangeDueTo?.(val ? new Date(`${val}T23:59:59.999Z`).toISOString() : null);
  }

  const toSelectVal = (v: string | null | undefined) =>
    v == null || v === "" ? NULL_VALUE : String(v);
  const fromSelectVal = (v: string) => (v === NULL_VALUE ? null : v);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-foreground text-base font-semibold">Filtros</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Estado</Label>
          <Select
            value={toSelectVal(statusId)}
            onValueChange={(v) => onChangeStatus?.(fromSelectVal(v))}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="(Todos)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_VALUE}>(Todos)</SelectItem>
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
            value={toSelectVal(priorityId)}
            onValueChange={(v) => onChangePriority?.(fromSelectVal(v))}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="(Todas)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_VALUE}>(Todas)</SelectItem>
              {normPriorities.map((p) => (
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
            value={toSelectVal(typeId)}
            onValueChange={(v) => onChangeType?.(fromSelectVal(v))}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="(Todos)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_VALUE}>(Todos)</SelectItem>
              {types.map((t) => (
                <SelectItem key={t.taskTypeId} value={t.taskTypeId}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Término</Label>
          <Select
            value={toSelectVal(termId)}
            onValueChange={(v) => onChangeTerm?.(fromSelectVal(v))}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="(Todos)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_VALUE}>(Todos)</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.termId} value={t.termId}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due-from">Vence desde</Label>
          <Input
            id="due-from"
            type="date"
            value={dueFromInput}
            onChange={handleDateFromChange}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due-to">Vence hasta</Label>
          <Input
            id="due-to"
            type="date"
            value={dueToInput}
            onChange={handleDateToChange}
          />
        </div>
      </div>

      <div>
        <TagSelector
          allTags={tags}
          selectedIds={tagIds}
          onChange={onChangeTags}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClear}>
          Limpiar
        </Button>
        <Button onClick={onApply}>Aplicar</Button>
      </div>
    </div>
  );
}
