import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Paper, Collapse } from "@mui/material";
import styles from "@styles/tasks.module.scss";

import TasksHeader from "@components/tasks/TasksHeader.jsx";
import TasksFilters from "@components/tasks/TasksFilters.jsx";
import TasksTable from "@components/tasks/TasksTable.jsx";
import BulkActionsBar from "@components/tasks/BulkActionsBar.jsx";
import PaginationControls from "@components/tasks/PaginationControls.jsx";
import EmptyState from "@components/tasks/EmptyState.jsx";
import ErrorState from "@components/tasks/ErrorState.jsx";
import TaskModal from "@components/tasks/TaskModal.jsx";
import TaskDrawer from "@components/tasks/TaskDrawer.jsx";

import { useTasksApi } from "@hooks/api/tasks";
import { useTaskTagAssignmentsApi } from "@hooks/api/taskTagAssignments";
import { useCatalogsCrud } from "@hooks/api/catalogs";
import { useTasksFilters } from "@hooks/useTasksFilters";
import { useTasksMutations } from "@hooks/useTasksMutations";

const humanize = (code = "") =>
  String(code).replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()).trim();

export default function TasksPage() {
  const tasksApi = useTasksApi();
  const tagAssignApi = useTaskTagAssignmentsApi();
  const { taskStatuses, taskPriorities, taskTypes, terms: termsApi, taskTags } = useCatalogsCrud();

  const filters = useTasksFilters();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalogs, setCatalogs] = useState({ statuses: [], priorities: [], types: [], terms: [], tags: [] });
  const [tagAssignments, setTagAssignments] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [drawerTask, setDrawerTask] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const filtersRef = useRef(null);

  // Load catalogs once
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
        const asList = (r) => (Array.isArray(r?.data) ? r.data : r?.data?.items ?? r?.items ?? []);
        setCatalogs({
          statuses: asList(S).map((x) => ({ taskStatusId: x.taskStatusId, code: x.code, name: humanize(x.code), isFinal: !!x.isFinal })),
          priorities: asList(P).map((x) => ({ taskPriorityId: x.taskPriorityId, code: x.code, name: humanize(x.code), weight: Number(x.weight ?? 0) })).sort((a, b) => a.weight - b.weight),
          types: asList(T).map((x) => ({ taskTypeId: x.taskTypeId, code: x.code, name: humanize(x.code) })),
          terms: asList(Te).map((x) => ({ termId: x.termId, name: x.name ?? humanize(x.code ?? "") })),
          tags: asList(Tg).map((x) => ({ taskTagId: x.taskTagId, name: x.name, color: x.color })),
        });
      } catch { /* catalogs are non-critical */ }
    })();
    return () => { cancelled = true; };
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

      const asList = (r) => (Array.isArray(r?.data) ? r.data : r?.data?.items ?? r?.items ?? []);
      const baseItems = asList(resp);
      const assigns = asList(assignsResp);
      setTagAssignments(assigns);

      const byTask = new Map();
      for (const a of assigns) {
        const tId = a.taskId ?? a.task_id;
        const tagId = a.taskTagId ?? a.task_tag_id;
        if (!tId || !tagId) continue;
        (byTask.get(tId) ?? (byTask.set(tId, []).get(tId))).push(tagId);
      }

      const mapStatus = new Map(catalogs.statuses.map((s) => [s.taskStatusId, s]));
      const mapPriority = new Map(catalogs.priorities.map((p) => [p.taskPriorityId, p]));
      const mapType = new Map(catalogs.types.map((t) => [t.taskTypeId, t]));
      const mapTag = new Map(catalogs.tags.map((t) => [t.taskTagId, t]));

      setItems(baseItems.map((row) => {
        const id = row.taskId ?? row.task_id;
        const rowTagIds = row.taskTagIds ?? row.task_tag_ids ?? byTask.get(id) ?? [];
        return {
          id,
          title: row.title,
          description: row.description ?? "",
          dueAt: row.dueAt ?? row.due_at ?? null,
          estimatedMin: row.estimatedMin ?? row.estimated_min ?? 0,
          actualMin: row.actualMin ?? row.actual_min ?? null,
          completedAt: row.completedAt ?? row.completed_at ?? null,
          archivedAt: row.archivedAt ?? row.archived_at ?? null,
          status: mapStatus.get(row.taskStatusId ?? row.task_status_id) ?? null,
          priority: mapPriority.get(row.taskPriorityId ?? row.task_priority_id) ?? null,
          type: mapType.get(row.taskTypeId ?? row.task_type_id) ?? null,
          tags: rowTagIds.map((tid) => mapTag.get(tid)).filter(Boolean),
        };
      }));

      setTotal(resp?.meta?.pagination?.totalItems ?? resp?.data?.meta?.pagination?.totalItems ?? baseItems.length ?? 0);
    } catch (e) {
      setError(e?.payload?.message || e?.message || "Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  }, [filters.apiQuery, catalogs, tasksApi, tagAssignApi]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const mutations = useTasksMutations({
    tasksApi,
    tagAssignApi,
    onRefresh: loadTasks,
  });

  const clearSelection = () => setSelectedIds(new Set());
  const toggleSelect = (id) => setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleSelectAll = (checked) => checked ? setSelectedIds(new Set(items.map((t) => t.id))) : clearSelection();

  function openFilters() {
    setShowFilters((v) => {
      const next = !v;
      setTimeout(() => { if (next) filters.syncDraftFromApplied(); }, 0);
      return next;
    });
  }

  if (error) return <ErrorState message={error} onRetry={loadTasks} />;

  return (
    <Box className={styles.tasksPageRoot}>
      <TasksHeader
        q={filters.q}
        onChangeQuery={(val) => { filters.setQ(val); filters.setPage(1); }}
        orderByField={filters.sortBy}
        orderByDir={filters.sortOrder}
        onChangeOrderByField={(f) => { filters.handleSort(f); filters.setPage(1); }}
        onChangeOrderByDir={(d) => { mutations; filters.setPage(1); }}
        archived={filters.archived}
        onToggleArchived={(v) => { filters.setArchived(v); filters.setPage(1); }}
        onOpenFilters={openFilters}
        showFilters={showFilters}
        onCreateTask={() => setCreateOpen(true)}
        totalCount={total}
      />

      <Collapse in={showFilters} timeout="auto" unmountOnExit={false}>
        <Paper ref={filtersRef} id="tasks-filters" className={`${styles.sectionCard} ${styles.filtersCard}`}>
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
            onChangeStatus={(v) => filters.setDraft((d) => ({ ...d, statusId: v }))}
            onChangePriority={(v) => filters.setDraft((d) => ({ ...d, priorityId: v }))}
            onChangeType={(v) => filters.setDraft((d) => ({ ...d, typeId: v }))}
            onChangeTerm={(v) => filters.setDraft((d) => ({ ...d, termId: v }))}
            onChangeTags={(v) => filters.setDraft((d) => ({ ...d, tagIds: v }))}
            onChangeDueFrom={(v) => filters.setDraft((d) => ({ ...d, dueFrom: v }))}
            onChangeDueTo={(v) => filters.setDraft((d) => ({ ...d, dueTo: v }))}
            onApply={filters.applyFilters}
            onClear={filters.clearDraft}
          />
        </Paper>
      </Collapse>

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        loading={mutations.mutating}
        statuses={catalogs.statuses}
        onClearSelection={clearSelection}
        onBulkComplete={(opts) => { mutations.bulkComplete(selectedIds, opts); clearSelection(); }}
        onBulkDelete={() => { mutations.bulkDelete(selectedIds); clearSelection(); }}
        onApplyStatus={(sid) => { mutations.bulkChangeStatus(selectedIds, sid, catalogs.statuses); clearSelection(); }}
      />

      <div className={styles.tableViewport}>
        <Paper className={`${styles.sectionCard} ${styles.tableCard}`}>
          {items.length === 0 ? (
            <EmptyState onCreate={() => setCreateOpen(true)} />
          ) : (
            <TasksTable
              items={items}
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onOpenDrawer={setDrawerTask}
              onEdit={setEditingTask}
              onComplete={mutations.completeOne}
              onArchive={mutations.archiveOne}
              onDelete={mutations.deleteOne}
              orderByField={filters.sortBy}
              orderByDir={filters.sortOrder}
              onSort={filters.handleSort}
              statuses={catalogs.statuses}
              priorities={catalogs.priorities}
              types={catalogs.types}
              tagsCatalog={catalogs.tags}
            />
          )}
        </Paper>

        <PaginationControls
          limit={filters.pageSize}
          offset={(filters.page - 1) * filters.pageSize}
          total={total}
          onChangeLimit={() => {}}
          onChangeOffset={(n) => filters.setPage(Math.floor(n / filters.pageSize) + 1)}
        />
      </div>

      <TaskModal
        open={createOpen}
        loading={mutations.mutating}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
        types={catalogs.types}
        terms={catalogs.terms}
        tags={catalogs.tags}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => { const ok = await mutations.handleCreate(payload); if (ok) setCreateOpen(false); }}
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
        onSubmit={async (payload) => { const ok = await mutations.handleUpdate(payload, editingTask?.id); if (ok) setEditingTask(null); }}
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
        onUpdate={async (payload) => { setDrawerTask(null); await mutations.handleUpdate(payload, drawerTask?.id); }}
        onComplete={async (opts) => { const t = drawerTask; setDrawerTask(null); await mutations.completeOne({ id: t?.id }, opts); }}
        onArchive={async () => { const t = drawerTask; setDrawerTask(null); await mutations.archiveOne({ id: t?.id }); }}
        onDelete={async () => { const t = drawerTask; setDrawerTask(null); await mutations.deleteOne({ id: t?.id ?? t?.taskId }); }}
      />
    </Box>
  );
}
