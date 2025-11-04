import React from "react";
import Swal from "sweetalert2";
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

/** página de tareas: lista, filtros, paginación, acciones masivas y detalle/modal */
export default function TasksPage() {
  // apis
  const tasksApi = useTasksApi();
  const tagAssignApi = useTaskTagAssignmentsApi();
  const {
    taskStatuses,
    taskPriorities,
    taskTypes,
    terms: termsApi,
    taskTags,
  } = useCatalogsCrud();

  // estado de datos
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // catálogos
  const [statuses, setStatuses] = React.useState([]);
  const [priorities, setPriorities] = React.useState([]);
  const [types, setTypes] = React.useState([]);
  const [terms, setTerms] = React.useState([]);
  const [tags, setTags] = React.useState([]);
  const [tagAssignments, setTagAssignments] = React.useState([]);

  // parámetros de consulta
  const [q, setQ] = React.useState("");

  // filtros aplicados (disparan carga)
  const [statusId, setStatusId] = React.useState(null);
  const [priorityId, setPriorityId] = React.useState(null);
  const [typeId, setTypeId] = React.useState(null);
  const [termId, setTermId] = React.useState(null);
  const [tagIds, setTagIds] = React.useState([]);
  const [dueFrom, setDueFrom] = React.useState(null);
  const [dueTo, setDueTo] = React.useState(null);

  // filtros en edición (no disparan carga)
  const [dStatusId, setDStatusId] = React.useState(null);
  const [dPriorityId, setDPriorityId] = React.useState(null);
  const [dTypeId, setDTypeId] = React.useState(null);
  const [dTermId, setDTermId] = React.useState(null);
  const [dTagIds, setDTagIds] = React.useState([]);
  const [dDueFrom, setDDueFrom] = React.useState(null);
  const [dDueTo, setDDueTo] = React.useState(null);

  // opciones generales
  const [archived, setArchived] = React.useState(false);
  const [orderByField, setOrderByField] = React.useState("dueAt");
  const [orderByDir, setOrderByDir] = React.useState("asc");
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);

  // selección múltiple
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());

  // crear/editar/detalle
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  const [drawerTask, setDrawerTask] = React.useState(null);
  const [mutating, setMutating] = React.useState(false);

  // visibilidad panel de filtros
  const [showFilters, setShowFilters] = React.useState(true);
  const filtersRef = React.useRef(null);

  // helper: scroll suave al panel de filtros
  function scrollToFilters() {
    const el = filtersRef.current;
    if (!el) return;
    let parent = el.parentElement;
    const isScrollable = (n) =>
      /(auto|scroll)/.test(window.getComputedStyle(n).overflowY);
    while (parent && !isScrollable(parent)) parent = parent.parentElement;
    const scroller = parent || window;
    const top = parent
      ? el.offsetTop - 8
      : el.getBoundingClientRect().top + window.scrollY - 8;
    if (parent) parent.scrollTo({ top, behavior: "smooth" });
    else window.scrollTo({ top, behavior: "smooth" });
  }

  // toggle filtros y sincroniza borradores
  function openFilters() {
    setShowFilters((v) => {
      const next = !v; // ← toggle
      setTimeout(() => {
        if (next) scrollToFilters();

        // sincroniza borradores con filtros aplicados al abrir
        if (next) {
          setDStatusId(statusId);
          setDPriorityId(priorityId);
          setDTypeId(typeId);
          setDTermId(termId);
          setDTagIds(tagIds);
          setDDueFrom(dueFrom);
          setDDueTo(dueTo);
        }
      }, 0);
      return next;
    });
  }

  React.useEffect(() => {
    let cancelled = false;

    const humanize = (code = "") =>
      String(code)
        .replace(/[_\-]+/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase())
        .trim();

    (async () => {
      try {
        const [S, P, T, Te, Tg] = await Promise.all([
          taskStatuses.list({ limit: 200 }),
          taskPriorities.list({ limit: 200 }),
          taskTypes.list({ limit: 200 }),
          termsApi.list({ limit: 200 }),
          taskTags.list({ limit: 500 }),
        ]);

        if (cancelled) return;

        // normaliza catálogos con 'name' derivado de 'code'
        const normStatuses = (S.items || []).map((x) => ({
          taskStatusId: x.taskStatusId,
          code: x.code,
          name: humanize(x.code), // ← crea 'name'
          isFinal: !!x.isFinal,
        }));

        const normPriorities = (P.items || [])
          .map((x) => ({
            taskPriorityId: x.taskPriorityId,
            code: x.code,
            name: humanize(x.code),
            weight: Number(x.weight ?? 0),
          }))
          .sort((a, b) => a.weight - b.weight);

        const normTypes = (T.items || []).map((x) => ({
          taskTypeId: x.taskTypeId,
          code: x.code,
          name: humanize(x.code),
        }));

        const normTerms = (Te.items || []).map((x) => ({
          termId: x.termId,
          name: x.name ?? humanize(x.code ?? ""),
        }));

        const normTags = (Tg.items || []).map((x) => ({
          taskTagId: x.taskTagId,
          name: x.name,
          color: x.color,
        }));

        setStatuses(normStatuses);
        setPriorities(normPriorities);
        setTypes(normTypes);
        setTerms(normTerms);
        setTags(normTags);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [taskStatuses, taskPriorities, taskTypes, termsApi, taskTags]);

  // construye query para API según filtros y paginación
  const query = React.useMemo(() => {
    const qparams = {
      include: "all",
      limit,
      offset,
      orderByField,
      orderByDir,
      archived: archived ? "true" : "false",
    };
    if (q?.trim()) qparams.q = q.trim();
    if (statusId) qparams.statusId = statusId;
    if (priorityId) qparams.priorityId = priorityId;
    if (typeId) qparams.typeId = typeId;
    if (termId) qparams.termId = termId;
    if (tagIds?.length) qparams.tagId = tagIds.map(String);
    if (dueFrom) qparams.dueFrom = dueFrom;
    if (dueTo) qparams.dueTo = dueTo;
    return qparams;
  }, [
    q,
    statusId,
    priorityId,
    typeId,
    termId,
    tagIds,
    dueFrom,
    dueTo,
    archived,
    limit,
    offset,
    orderByField,
    orderByDir,
  ]);

  // carga lista de tareas
  async function load() {
    if (!tasksApi?.list) return;
    setLoading(true);
    setError("");
    try {
      const [resp, assignsResp] = await Promise.all([
        tasksApi.list(query),
        tagAssignApi.list({ limit: 10000 }),
      ]);

      const baseItems = resp?.items ?? [];
      const assigns = assignsResp?.items ?? [];

      const byTask = new Map();
      for (const a of assigns) {
        const taskId = a.taskId ?? a.task_id;
        const tagId = a.taskTagId ?? a.task_tag_id;
        if (!taskId || !tagId) continue;
        (byTask.get(taskId) || byTask.set(taskId, []).get(taskId)).push(tagId);
      }

      // Mapas de referencia usando keys reales
      const mapStatus = new Map(statuses.map((s) => [s.taskStatusId, s]));
      const mapPriority = new Map(priorities.map((p) => [p.taskPriorityId, p]));
      const mapType = new Map(types.map((t) => [t.taskTypeId, t]));
      const mapTag = new Map(tags.map((t) => [t.taskTagId, t]));

      const viewItems = baseItems.map((row) => {
        const id = row.taskId ?? row.task_id;
        const statusId = row.taskStatusId ?? row.task_status_id;
        const priorityId = row.taskPriorityId ?? row.task_priority_id;
        const typeId = row.taskTypeId ?? row.task_type_id;
        const tagIds =
          row.taskTagIds ?? row.task_tag_ids ?? byTask.get(id) ?? [];

        return {
          id,
          title: row.title,
          description: row.description ?? "",
          dueAt: row.dueAt ?? row.due_at ?? null,
          estimatedMin: row.estimatedMin ?? row.estimated_min ?? 0,
          actualMin: row.actualMin ?? row.actual_min ?? null,
          completedAt: row.completedAt ?? row.completed_at ?? null,
          archivedAt: row.archivedAt ?? row.archived_at ?? null,

          status: mapStatus.get(statusId) || null,
          priority: mapPriority.get(priorityId) || null,
          type: mapType.get(typeId) || null,
          tags: tagIds.map((tid) => mapTag.get(tid)).filter(Boolean),
        };
      });

      setItems(viewItems);
      setTotal(resp?.total ?? 0);
      console.log("[TASK] viewItems[0]:", viewItems[0]);
    } catch (e) {
      setError(e?.payload?.message || e?.message || "Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [query, statuses, priorities, types, tags]);

  // helpers de selección
  function clearSelection() {
    setSelectedIds(new Set());
  }
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }
  function toggleSelectAll(checked) {
    if (!checked) return clearSelection();
    setSelectedIds(new Set(items.map((t) => t.id)));
  }

  // orden
  function handleSort(field) {
    setOrderByField((curr) => {
      if (curr === field) {
        setOrderByDir((d) => (d === "asc" ? "desc" : "asc"));
        return curr;
      }
      setOrderByDir("asc");
      return field;
    });
  }

  // filtros: aplicar o limpiar
  function handleApplyFilters() {
    setStatusId(dStatusId ?? null);
    setPriorityId(dPriorityId ?? null);
    setTypeId(dTypeId ?? null);
    setTermId(dTermId ?? null);
    setTagIds(dTagIds ?? []);
    setDueFrom(dDueFrom ?? null);
    setDueTo(dDueTo ?? null);
    setOffset(0);
    load();
  }
  function handleClearFilters() {
    setDStatusId(null);
    setDPriorityId(null);
    setDTypeId(null);
    setDTermId(null);
    setDTagIds([]);
    setDDueFrom(null);
    setDDueTo(null);
  }

  async function handleCreate(payload) {
    if (!tasksApi?.create) return;
    try {
      setMutating(true);
      const { tagIds = [], ...data } = payload;

      console.log("[TasksPage] CREATE data (sin tagIds):", data);

      const res = await tasksApi.create(data);
      const newId = res?.item?.taskId ?? res?.item?.id;

      if (newId && tagIds.length && tagAssignApi?.add) {
        await Promise.all(
          tagIds.map((id) => tagAssignApi.add({ taskId: newId, taskTagId: id }))
        );
      }

      setCreateOpen(false);
      await Swal.fire(
        "Creada",
        "La tarea fue creada correctamente.",
        "success"
      );
      setOffset(0);
      await load();
    } catch (e) {
      console.error("[TasksPage] CREATE error:", e);
      setCreateOpen(false);
      await Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudo crear",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  function openEdit(task) {
    setEditingTask(task);
  }
  async function handleUpdate(payload) {
    if (!tasksApi?.update) return;
    try {
      setMutating(true);

      // dterminar el ID
      const taskId =
        payload.taskId ??
        editingTask?.id ??
        editingTask?.taskId ??
        editingTask?.task_id;

      if (!taskId || typeof taskId !== "string") {
        throw new Error("No se pudo determinar taskId para update");
      }

      // mapear por anidación
      const data = {};
      if (payload.title !== undefined) data.title = payload.title;
      if (payload.description !== undefined)
        data.description = payload.description ?? null;
      if (payload.dueAt !== undefined) data.dueAt = payload.dueAt;
      if (payload.estimatedMin !== undefined)
        data.estimatedMin = payload.estimatedMin;

      if (payload.taskStatusId !== undefined) {
        data.status = {
          connect: { taskStatusId: Number(payload.taskStatusId) },
        };
      }
      if (payload.taskPriorityId !== undefined) {
        data.priority = {
          connect: { taskPriorityId: Number(payload.taskPriorityId) },
        };
      }
      if (payload.taskTypeId !== undefined) {
        data.type = { connect: { taskTypeId: Number(payload.taskTypeId) } };
      }
      if (payload.termId !== undefined) {
        data.term =
          payload.termId === null || payload.termId === ""
            ? { disconnect: true }
            : { connect: { termId: Number(payload.termId) } };
      }

      console.log("[TasksPage] UPDATE prisma-shaped:", { taskId, ...data });

      await tasksApi.update([{ taskId, ...data }]);
      setEditingTask(null);
      await Swal.fire("Guardado", "Cambios aplicados.", "success");
      await load();
    } catch (e) {
      setEditingTask(null);
      console.error("[TasksPage] UPDATE error:", e);
      await Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudo guardar",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  // drawer
  function openDrawer(task) {
    setDrawerTask(task);
  }

  // acciones rápidas (1 tarea)
  async function completeOne(task, opts) {
    if (!tasksApi?.update) return;
    try {
      setMutating(true);
      const nowIso = new Date().toISOString();
      const payload = {
        taskId: task.id,
        taskStatusId:
          (task.taskStatus || task.task_status)?.taskStatusId ||
          task.taskStatusId ||
          task.task_status_id,
        completedAt: nowIso,
        ...(typeof opts?.actualMin === "number"
          ? { actualMin: opts.actualMin }
          : {}),
      };
      await tasksApi.update([payload]);
      Swal.fire(
        "Completada",
        "La tarea fue marcada como completada.",
        "success"
      );
      await load();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudo completar",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  async function archiveOne(task) {
    if (!tasksApi?.update) return;
    try {
      setMutating(true);
      await tasksApi.update([
        {
          taskId: task.id,
          archivedAt: new Date().toISOString(),
        },
      ]);
      Swal.fire("Archivada", "La tarea fue archivada.", "success");
      await load();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudo archivar",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }
  async function deleteOne(task) {
    if (!tasksApi?.remove) return;
    try {
      setMutating(true);

      const rawId = task?.id ?? task?.taskId ?? task?.task_id ?? "";
      const id = String(rawId).trim();

      const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
      if (!isUuid) throw new Error(`taskId inválido para delete: "${id}"`);

      await tasksApi.remove([id]);
      Swal.fire("Eliminada", "La tarea fue eliminada.", "success");
      await load();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudo eliminar",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  // acciones masivas
  async function bulkComplete(opts) {
    if (!tasksApi?.update) return;
    try {
      setMutating(true);
      const now = new Date().toISOString();
      const arr = Array.from(selectedIds).map((id) => ({
        taskId: id,
        completedAt: now,
        ...(typeof opts?.actualMin === "number"
          ? { actualMin: opts.actualMin }
          : {}),
      }));
      await tasksApi.update(arr);
      clearSelection();
      Swal.fire("Completadas", "Tareas marcadas como completadas.", "success");
      await load();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudieron completar",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  async function bulkArchive() {
    if (!tasksApi?.update) return;
    try {
      setMutating(true);
      const now = new Date().toISOString();
      const arr = Array.from(selectedIds).map((id) => ({
        taskId: id,
        archivedAt: now,
      }));
      await tasksApi.update(arr);
      clearSelection();
      Swal.fire("Archivadas", "Tareas archivadas.", "success");
      await load();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudieron archivar",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  async function bulkDelete() {
    if (!tasksApi?.remove) return;
    try {
      setMutating(true);
      await tasksApi.remove(Array.from(selectedIds));
      clearSelection();
      Swal.fire("Eliminadas", "Tareas eliminadas.", "success");
      if (items.length === selectedIds.size && offset > 0)
        setOffset(Math.max(0, offset - limit));
      await load();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudieron eliminar",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  async function bulkChangeStatus(newStatusId) {
    if (!tasksApi?.update) return;
    try {
      setMutating(true);
      const chosen = statuses.find((s) => s.taskStatusId === newStatusId);
      const isFinal = !!chosen?.isFinal;
      const now = new Date().toISOString();
      const arr = Array.from(selectedIds).map((id) => ({
        taskId: id,
        taskStatusId: newStatusId,
        ...(isFinal ? { completedAt: now } : {}),
      }));
      await tasksApi.update(arr);
      clearSelection();
      Swal.fire(
        "Estados aplicados",
        `${arr.length} tarea(s) → ${chosen?.name || "Estado seleccionado"}`,
        "success"
      );
      await load();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.payload?.message || e?.message || "No se pudo cambiar el estado",
        "error"
      );
    } finally {
      setMutating(false);
    }
  }

  // renderizado principal
  if (error) return <ErrorState message={error} onRetry={load} />;

  const selectedCount = selectedIds.size;

  return (
    <Box className={styles.tasksPageRoot}>
      {/* encabezado */}
      <TasksHeader
        q={q}
        onChangeQuery={(val) => {
          setQ(val);
          setOffset(0);
        }}
        orderByField={orderByField}
        orderByDir={orderByDir}
        onChangeOrderByField={(f) => {
          setOrderByField(f);
          setOffset(0);
        }}
        onChangeOrderByDir={(d) => {
          setOrderByDir(d);
          setOffset(0);
        }}
        archived={archived}
        onToggleArchived={(v) => {
          setArchived(v);
          setOffset(0);
        }}
        onOpenFilters={openFilters}
        showFilters={showFilters}
        onCreateTask={() => setCreateOpen(true)}
        totalCount={total}
      />

      {/* filtros */}
      <Collapse in={showFilters} timeout="auto" unmountOnExit={false}>
        <Paper
          ref={filtersRef}
          id="tasks-filters"
          className={`${styles.sectionCard} ${styles.filtersCard}`}
        >
          <TasksFilters
            statusId={dStatusId}
            priorityId={dPriorityId}
            typeId={dTypeId}
            termId={dTermId}
            tagIds={dTagIds}
            dueFrom={dDueFrom}
            dueTo={dDueTo}
            statuses={statuses}
            priorities={priorities}
            types={types}
            terms={terms}
            tags={tags}
            onChangeStatus={setDStatusId}
            onChangePriority={setDPriorityId}
            onChangeType={setDTypeId}
            onChangeTerm={setDTermId}
            onChangeTags={setDTagIds}
            onChangeDueFrom={setDDueFrom}
            onChangeDueTo={setDDueTo}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </Paper>
      </Collapse>

      {/* barra de acciones masivas */}
      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        loading={mutating}
        statuses={statuses}
        onClearSelection={clearSelection}
        onBulkComplete={bulkComplete}
        onBulkDelete={bulkDelete}
        onApplyStatus={bulkChangeStatus}
      />

      {/* tabla y paginación */}
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
              onOpenDrawer={openDrawer}
              onEdit={openEdit}
              onComplete={completeOne}
              onArchive={archiveOne}
              onDelete={deleteOne}
              orderByField={orderByField}
              orderByDir={orderByDir}
              onSort={handleSort}
              statuses={statuses}
              priorities={priorities}
              types={types}
              tagsCatalog={tags}
            />
          )}
        </Paper>

        <PaginationControls
          limit={limit}
          offset={offset}
          total={total}
          onChangeLimit={(n) => {
            setLimit(n);
            setOffset(0);
          }}
          onChangeOffset={(n) => setOffset(n)}
        />
      </div>

      {/* modales y drawer */}
      <TaskModal
        open={createOpen}
        loading={mutating}
        statuses={statuses}
        priorities={priorities}
        types={types}
        terms={terms}
        tags={tags}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <TaskModal
        open={!!editingTask}
        loading={mutating}
        initialTask={editingTask}
        statuses={statuses}
        priorities={priorities}
        types={types}
        terms={terms}
        tags={tags}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdate}
      />

      <TaskDrawer
        open={!!drawerTask}
        task={drawerTask}
        statuses={statuses}
        priorities={priorities}
        types={types}
        terms={terms}
        tags={tags}
        loading={mutating}
        onClose={() => setDrawerTask(null)}
        onUpdate={async (payload) => {
          const id = drawerTask?.id || payload.taskId;
          setDrawerTask(null);
          await handleUpdate(payload);
          await load();
        }}
        onComplete={async (opts) => {
          if (!drawerTask) return;
          setDrawerTask(null);
          await completeOne({ id: drawerTask.id }, opts);
          await load();
        }}
        onArchive={async () => {
          if (!drawerTask) return;
          setDrawerTask(null);
          await archiveOne({ id: drawerTask.id });
          await load();
        }}
        onDelete={async () => {
          if (!drawerTask) return;
          setDrawerTask(null);
          await deleteOne({ taskId: drawerTask.taskId || drawerTask.id });
          await load();
        }}
      />
    </Box>
  );
}
