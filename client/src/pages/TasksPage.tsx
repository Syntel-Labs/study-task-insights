import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@components/ui/card";
import BulkActionsBar from "@components/tasks/BulkActionsBar";
import EmptyState from "@components/tasks/EmptyState";
import ErrorState from "@components/tasks/ErrorState";
import PaginationControls from "@components/tasks/PaginationControls";
import TaskDrawer from "@components/tasks/TaskDrawer";
import TaskModal from "@components/tasks/TaskModal";
import TasksFilters from "@components/tasks/TasksFilters";
import TasksHeader from "@components/tasks/TasksHeader";
import TasksKpis from "@components/tasks/TasksKpis";
import TasksTable from "@components/tasks/TasksTable";
import {
  useCatalogsCrud,
  useTaskTagAssignmentsApi,
  useTasksApi,
} from "@hooks/api";
import { useTasksFilters } from "@hooks/useTasksFilters";
import { useTasksMutations } from "@hooks/useTasksMutations";

type Catalog = {
  statuses: { taskStatusId: string; code?: string; name: string; isFinal?: boolean }[];
  priorities: { taskPriorityId: string; code?: string; name: string; weight: number }[];
  types: { taskTypeId: string; code?: string; name: string }[];
  terms: { termId: string; name: string }[];
  tags: { taskTagId: string; name: string; color?: string | null }[];
};

type Task = {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  estimatedMin: number;
  actualMin: number | null;
  completedAt: string | null;
  archivedAt: string | null;
  status: Catalog["statuses"][number] | null;
  priority: Catalog["priorities"][number] | null;
  type: Catalog["types"][number] | null;
  tags: Catalog["tags"];
};

const humanize = (code = "") =>
  String(code)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();

function asList<T = unknown>(r: unknown): T[] {
  if (!r || typeof r !== "object") return [];
  const obj = r as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as T[];
  const data = obj.data as { items?: unknown[] } | undefined;
  if (data && Array.isArray(data.items)) return data.items as T[];
  if (Array.isArray(obj.items)) return obj.items as T[];
  return [];
}

export default function TasksPage() {
  const tasksApi = useTasksApi();
  const tagAssignApi = useTaskTagAssignmentsApi();
  const { taskStatuses, taskPriorities, taskTypes, terms: termsApi, taskTags } =
    useCatalogsCrud();

  const filters = useTasksFilters();

  const [items, setItems] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalogs, setCatalogs] = useState<Catalog>({
    statuses: [],
    priorities: [],
    types: [],
    terms: [],
    tags: [],
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [S, P, T, Te, Tg] = await Promise.all([
          taskStatuses.list({ pageSize: 200 }),
          taskPriorities.list({ pageSize: 200 }),
          taskTypes.list({ pageSize: 200 }),
          termsApi.list({ pageSize: 200 }),
          taskTags.list({ pageSize: 500 }),
        ]);
        if (cancelled) return;
        setCatalogs({
          statuses: asList<Record<string, unknown>>(S).map((x) => ({
            taskStatusId: String(x.taskStatusId),
            code: x.code as string | undefined,
            name: humanize((x.code as string) ?? ""),
            isFinal: !!x.isFinal,
          })),
          priorities: asList<Record<string, unknown>>(P)
            .map((x) => ({
              taskPriorityId: String(x.taskPriorityId),
              code: x.code as string | undefined,
              name: humanize((x.code as string) ?? ""),
              weight: Number((x.weight as number | undefined) ?? 0),
            }))
            .sort((a, b) => a.weight - b.weight),
          types: asList<Record<string, unknown>>(T).map((x) => ({
            taskTypeId: String(x.taskTypeId),
            code: x.code as string | undefined,
            name: humanize((x.code as string) ?? ""),
          })),
          terms: asList<Record<string, unknown>>(Te).map((x) => ({
            termId: String(x.termId),
            name:
              (x.name as string) ??
              humanize((x.code as string) ?? ""),
          })),
          tags: asList<Record<string, unknown>>(Tg).map((x) => ({
            taskTagId: String(x.taskTagId),
            name: x.name as string,
            color: (x.color as string | null) ?? null,
          })),
        });
      } catch {
        /* catalogs are non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskStatuses, taskPriorities, taskTypes, termsApi, taskTags]);

  const loadTasks = useCallback(async () => {
    if (!tasksApi?.list) return;
    setLoading(true);
    setError("");
    try {
      const [resp, assignsResp] = await Promise.all([
        tasksApi.list(filters.apiQuery),
        tagAssignApi.list({ pageSize: 10000 }),
      ]);

      const baseItems = asList<Record<string, unknown>>(resp);
      const assigns = asList<Record<string, unknown>>(assignsResp);

      const byTask = new Map<string, string[]>();
      for (const a of assigns) {
        const tId = String(a.taskId ?? a.task_id ?? "");
        const tagId = String(a.taskTagId ?? a.task_tag_id ?? "");
        if (!tId || !tagId) continue;
        const arr = byTask.get(tId) ?? [];
        arr.push(tagId);
        byTask.set(tId, arr);
      }

      const mapStatus = new Map(
        catalogs.statuses.map((s) => [s.taskStatusId, s])
      );
      const mapPriority = new Map(
        catalogs.priorities.map((p) => [p.taskPriorityId, p])
      );
      const mapType = new Map(catalogs.types.map((t) => [t.taskTypeId, t]));
      const mapTag = new Map(catalogs.tags.map((t) => [t.taskTagId, t]));

      const mapped: Task[] = baseItems.map((row) => {
        const id = String(row.taskId ?? row.task_id ?? "");
        const rowTagIds =
          ((row.taskTagIds ?? row.task_tag_ids) as string[] | undefined) ??
          byTask.get(id) ??
          [];
        return {
          id,
          title: (row.title as string) ?? "",
          description: (row.description as string) ?? "",
          dueAt: (row.dueAt ?? row.due_at ?? null) as string | null,
          estimatedMin: Number(
            (row.estimatedMin ?? row.estimated_min ?? 0) as number
          ),
          actualMin: (row.actualMin ?? row.actual_min ?? null) as number | null,
          completedAt: (row.completedAt ?? row.completed_at ?? null) as
            | string
            | null,
          archivedAt: (row.archivedAt ?? row.archived_at ?? null) as
            | string
            | null,
          status:
            mapStatus.get(
              String(row.taskStatusId ?? row.task_status_id ?? "")
            ) ?? null,
          priority:
            mapPriority.get(
              String(row.taskPriorityId ?? row.task_priority_id ?? "")
            ) ?? null,
          type:
            mapType.get(String(row.taskTypeId ?? row.task_type_id ?? "")) ??
            null,
          tags: rowTagIds
            .map((tid) => mapTag.get(String(tid)))
            .filter((t): t is Catalog["tags"][number] => Boolean(t)),
        };
      });

      setItems(mapped);

      const meta =
        (resp as { meta?: { pagination?: { totalItems?: number } } })?.meta ??
        (
          resp as {
            data?: { meta?: { pagination?: { totalItems?: number } } };
          }
        )?.data?.meta;
      setTotal(meta?.pagination?.totalItems ?? mapped.length ?? 0);
    } catch (e: unknown) {
      const err = e as { payload?: { message?: string }; message?: string };
      setError(err?.payload?.message || err?.message || "Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  }, [filters.apiQuery, catalogs, tasksApi, tagAssignApi]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const mutations = useTasksMutations({
    tasksApi,
    tagAssignApi,
    onRefresh: loadTasks,
  });

  const kpis = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let open = 0;
    let dueToday = 0;
    let overdue = 0;
    let estTotal = 0;
    for (const t of items) {
      if (!t.completedAt && !t.archivedAt) open += 1;
      estTotal += t.estimatedMin ?? 0;
      if (t.dueAt && !t.completedAt) {
        const d = new Date(t.dueAt);
        if (d < today) overdue += 1;
        else if (d < tomorrow) dueToday += 1;
      }
    }
    return { open, dueToday, overdue, estTotal };
  }, [items]);

  const clearSelection = () => setSelectedIds(new Set());
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  const toggleSelectAll = (checked: boolean) =>
    checked ? setSelectedIds(new Set(items.map((t) => t.id))) : clearSelection();

  function openFilters() {
    setShowFilters((v) => {
      const next = !v;
      setTimeout(() => {
        if (next) filters.syncDraftFromApplied();
      }, 0);
      return next;
    });
  }

  if (error) return <ErrorState message={error} onRetry={loadTasks} />;

  return (
    <div className="flex flex-col gap-4">
      <TasksHeader
        q={filters.q}
        onChangeQuery={(val) => {
          filters.setQ(val);
          filters.setPage(1);
        }}
        orderByField={filters.sortBy}
        orderByDir={filters.sortOrder}
        onChangeOrderByField={(f) => {
          filters.handleSort(f);
          filters.setPage(1);
        }}
        onChangeOrderByDir={() => {
          filters.setPage(1);
        }}
        archived={filters.archived}
        onToggleArchived={(v) => {
          filters.setArchived(v);
          filters.setPage(1);
        }}
        onOpenFilters={openFilters}
        showFilters={showFilters}
        onCreateTask={() => setCreateOpen(true)}
        totalCount={total}
      />

      <TasksKpis kpis={kpis} />

      {showFilters && (
        <Card id="tasks-filters" className="p-4">
          <TasksFilters
            statusId={filters.draft.statusId}
            priorityId={filters.draft.priorityId}
            typeId={filters.draft.typeId}
            termId={filters.draft.termId}
            tagIds={filters.draft.tagIds}
            dueFrom={filters.draft.dueFrom}
            dueTo={filters.draft.dueTo}
            statuses={catalogs.statuses}
            priorities={catalogs.priorities}
            types={catalogs.types}
            terms={catalogs.terms}
            tags={catalogs.tags}
            onChangeStatus={(v) =>
              filters.setDraft((d) => ({ ...d, statusId: v }))
            }
            onChangePriority={(v) =>
              filters.setDraft((d) => ({ ...d, priorityId: v }))
            }
            onChangeType={(v) =>
              filters.setDraft((d) => ({ ...d, typeId: v }))
            }
            onChangeTerm={(v) =>
              filters.setDraft((d) => ({ ...d, termId: v }))
            }
            onChangeTags={(v) =>
              filters.setDraft((d) => ({ ...d, tagIds: v }))
            }
            onChangeDueFrom={(v) =>
              filters.setDraft((d) => ({ ...d, dueFrom: v }))
            }
            onChangeDueTo={(v) =>
              filters.setDraft((d) => ({ ...d, dueTo: v }))
            }
            onApply={filters.applyFilters}
            onClear={filters.clearDraft}
          />
        </Card>
      )}

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        loading={mutations.mutating}
        statuses={catalogs.statuses}
        onClearSelection={clearSelection}
        onBulkComplete={(_ids, opts) => {
          mutations.bulkComplete(selectedIds, opts);
          clearSelection();
        }}
        onBulkDelete={() => {
          mutations.bulkDelete(selectedIds);
          clearSelection();
        }}
        onApplyStatus={(sid) => {
          mutations.bulkChangeStatus(selectedIds, sid, catalogs.statuses);
          clearSelection();
        }}
      />

      <Card className="p-0">
        {items.length === 0 && !loading ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="max-h-[62vh] overflow-y-auto">
            <TasksTable
              items={items}
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onOpenDrawer={(t) => setDrawerTask(t as Task)}
              onEdit={(t) => setEditingTask(t as Task)}
              onComplete={(t) => mutations.completeOne({ id: t.id })}
              onArchive={(t) => mutations.archiveOne({ id: t.id })}
              onDelete={(t) => mutations.deleteOne({ id: t.id })}
              orderByField={filters.sortBy}
              orderByDir={filters.sortOrder}
              onSort={filters.handleSort}
            />
          </div>
        )}
      </Card>

      <PaginationControls
        limit={filters.pageSize}
        offset={(filters.page - 1) * filters.pageSize}
        total={total}
        onChangeLimit={(n) => {
          filters.setPageSize(n);
          filters.setPage(1);
        }}
        onChangeOffset={(n) =>
          filters.setPage(Math.floor(n / filters.pageSize) + 1)
        }
      />

      <TaskModal
        open={createOpen}
        loading={mutations.mutating}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
        types={catalogs.types}
        terms={catalogs.terms}
        tags={catalogs.tags}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          const ok = await mutations.handleCreate(payload);
          if (ok) setCreateOpen(false);
        }}
      />

      <TaskModal
        open={!!editingTask}
        loading={mutations.mutating}
        initialTask={editingTask}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
        types={catalogs.types}
        terms={catalogs.terms}
        tags={catalogs.tags}
        onClose={() => setEditingTask(null)}
        onSubmit={async (payload) => {
          const ok = await mutations.handleUpdate(payload, editingTask?.id);
          if (ok) setEditingTask(null);
        }}
      />

      <TaskDrawer
        open={!!drawerTask}
        task={drawerTask}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
        types={catalogs.types}
        terms={catalogs.terms}
        tags={catalogs.tags}
        loading={mutations.mutating}
        onClose={() => setDrawerTask(null)}
        onUpdate={async (payload) => {
          setDrawerTask(null);
          await mutations.handleUpdate(payload, drawerTask?.id);
        }}
        onComplete={async (opts) => {
          const t = drawerTask;
          setDrawerTask(null);
          await mutations.completeOne({ id: t?.id }, opts);
        }}
        onArchive={async () => {
          const t = drawerTask;
          setDrawerTask(null);
          await mutations.archiveOne({ id: t?.id });
        }}
        onDelete={async () => {
          const t = drawerTask;
          setDrawerTask(null);
          await mutations.deleteOne({ id: t?.id });
        }}
      />
    </div>
  );
}
