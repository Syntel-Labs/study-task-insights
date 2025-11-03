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

import { useTasksApi, useCatalogsApi } from "@utils/apiResources";
import { toIsoDateString } from "@utils/dates";

/** página de tareas: lista, filtros, paginación, acciones masivas y detalle/modal */
export default function TasksPage() {
  // apis
  const tasksApi = useTasksApi?.();
  const catalogsApi = useCatalogsApi?.();

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

  // carga catálogos una vez
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [st, pr, ty, te, tg] = await Promise.all([
          catalogsApi?.taskStatuses?.({ limit: 200 }) ?? { items: [] },
          catalogsApi?.taskPriorities?.({ limit: 200 }) ?? { items: [] },
          catalogsApi?.taskTypes?.({ limit: 200 }) ?? { items: [] },
          catalogsApi?.terms?.({ limit: 200 }) ?? { items: [] },
          catalogsApi?.taskTags?.({ limit: 500 }) ?? { items: [] },
        ]);
        if (!cancelled) {
          const norm = {
            statuses: (a = []) =>
              a.map((x) => ({
                taskStatusId: x.taskStatusId ?? x.task_status_id ?? x.id,
                name: x.name ?? x.label ?? x.title,
                isFinal: x.isFinal ?? x.is_final ?? false,
              })),
            priorities: (a = []) =>
              a.map((x) => ({
                taskPriorityId: x.taskPriorityId ?? x.task_priority_id ?? x.id,
                name: x.name ?? x.label ?? x.title,
                weight: x.weight ?? x.order ?? 0,
              })),
            types: (a = []) =>
              a.map((x) => ({
                taskTypeId: x.taskTypeId ?? x.task_type_id ?? x.id,
                name: x.name ?? x.label ?? x.title,
              })),
            terms: (a = []) =>
              a.map((x) => ({
                termId: x.termId ?? x.term_id ?? x.id,
                name: x.name ?? x.label ?? x.title,
              })),
            tags: (a = []) =>
              a.map((x) => ({
                taskTagId: x.taskTagId ?? x.task_tag_id ?? x.id,
                name: x.name ?? x.label ?? x.title,
              })),
          };
          const S = norm.statuses(st.items || []);
          const P = norm
            .priorities(pr.items || [])
            .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
          const Ty = norm.types(ty.items || []);
          const Te = norm.terms(te.items || []);
          const Tg = norm.tags(tg.items || []);
          setStatuses(S);
          setPriorities(P);
          setTypes(Ty);
          setTerms(Te);
          setTags(Tg);
        }
      } catch {
        // no bloquea render inicial
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogsApi]);

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
      const resp = await tasksApi.list(query);
      setItems(resp?.items ?? []);
      setTotal(resp?.total ?? 0);
    } catch (e) {
      setError(e?.payload?.message || e?.message || "Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    load();
  }, [query]);

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
    setSelectedIds(new Set(items.map((t) => t.taskId || t.task_id)));
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

  // acciones de crear y actualizar
  async function handleCreate(payload) {
    if (!tasksApi?.create) return;
    try {
      setMutating(true);
      await tasksApi.create(payload);
      setCreateOpen(false);
      Swal.fire("Creada", "La tarea fue creada correctamente.", "success");
      setOffset(0);
      await load();
    } catch (e) {
      Swal.fire(
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
      await tasksApi.update([payload]);
      setEditingTask(null);
      Swal.fire("Guardado", "Cambios aplicados.", "success");
      await load();
    } catch (e) {
      Swal.fire(
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
        taskId: task.taskId || task.task_id,
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
          taskId: task.taskId || task.task_id,
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
      await tasksApi.remove([task.taskId || task.task_id]);
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
        "Estado actualizado en tareas seleccionadas.",
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
        selectedCount={selectedCount}
        disabled={mutating}
        statuses={statuses}
        onClearSelection={clearSelection}
        onBulkComplete={bulkComplete}
        onBulkArchive={bulkArchive}
        onBulkDelete={bulkDelete}
        onBulkChangeStatus={bulkChangeStatus}
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
          await handleUpdate(payload);
          const id = payload.taskId;
          if (id && tasksApi?.get) {
            try {
              const fresh = await tasksApi.get({ id, include: "all" });
              setDrawerTask(fresh?.item || null);
            } catch {}
          }
        }}
        onComplete={async (opts) => {
          if (!drawerTask) return;
          await completeOne(drawerTask, opts);
          setDrawerTask(null);
        }}
        onArchive={async () => {
          if (!drawerTask) return;
          await archiveOne(drawerTask);
          setDrawerTask(null);
        }}
        onDelete={async () => {
          if (!drawerTask) return;
          await deleteOne(drawerTask);
          setDrawerTask(null);
        }}
        onAfterTagsChange={() => {
          load();
        }}
      />
    </Box>
  );
}
