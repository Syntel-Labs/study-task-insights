import { useState } from "react";
import { toast } from "sonner";

const msg = (e, fallback) => e?.payload?.message || e?.message || fallback;

/** Handles all task mutation operations: create, update, delete, bulk actions */
export function useTasksMutations({ tasksApi, tagAssignApi, onRefresh }) {
  const [mutating, setMutating] = useState(false);

  async function handleCreate(payload) {
    if (!tasksApi?.create) return;
    setMutating(true);
    try {
      const { tagIds = [], ...data } = payload;
      const res = await tasksApi.create(data);
      const newId = res?.data?.items?.[0]?.taskId ?? res?.data?.item?.taskId;

      if (newId && tagIds.length && tagAssignApi?.add) {
        await Promise.all(
          tagIds.map((id) => tagAssignApi.add({ taskId: newId, taskTagId: id }))
        );
      }
      toast.success("Tarea creada");
      await onRefresh();
      return true;
    } catch (e) {
      toast.error("No se pudo crear", { description: msg(e, "Error") });
      return false;
    } finally {
      setMutating(false);
    }
  }

  async function handleUpdate(payload, taskId) {
    if (!tasksApi?.update) return;
    setMutating(true);
    try {
      const id = taskId ?? payload.taskId;
      if (!id) throw new Error("Cannot determine taskId for update");

      const { tagIds: _tags, taskId: _tid, ...rest } = payload;
      await tasksApi.update([{ taskId: id, ...rest }]);
      toast.success("Cambios guardados");
      await onRefresh();
      return true;
    } catch (e) {
      toast.error("No se pudo guardar", { description: msg(e, "Error") });
      return false;
    } finally {
      setMutating(false);
    }
  }

  async function completeOne(task, opts) {
    if (!tasksApi?.update) return;
    setMutating(true);
    try {
      await tasksApi.update([{
        taskId: task.id,
        completedAt: new Date().toISOString(),
        ...(typeof opts?.actualMin === "number" ? { actualMin: opts.actualMin } : {}),
      }]);
      toast.success("Tarea completada");
      await onRefresh();
    } catch (e) {
      toast.error("No se pudo completar", { description: msg(e, "Error") });
    } finally {
      setMutating(false);
    }
  }

  async function archiveOne(task) {
    if (!tasksApi?.update) return;
    setMutating(true);
    try {
      await tasksApi.update([{ taskId: task.id, archivedAt: new Date().toISOString() }]);
      toast.success("Tarea archivada");
      await onRefresh();
    } catch (e) {
      toast.error("No se pudo archivar", { description: msg(e, "Error") });
    } finally {
      setMutating(false);
    }
  }

  async function deleteOne(task) {
    if (!tasksApi?.remove) return;
    setMutating(true);
    try {
      const id = String(task?.id ?? task?.taskId ?? "").trim();
      if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new Error(`Invalid taskId: "${id}"`);
      await tasksApi.remove([id]);
      toast.success("Tarea eliminada");
      await onRefresh();
    } catch (e) {
      toast.error("No se pudo eliminar", { description: msg(e, "Error") });
    } finally {
      setMutating(false);
    }
  }

  async function bulkComplete(selectedIds, opts) {
    if (!tasksApi?.update) return;
    setMutating(true);
    try {
      const now = new Date().toISOString();
      await tasksApi.update(
        Array.from(selectedIds).map((id) => ({
          taskId: id,
          completedAt: now,
          ...(typeof opts?.actualMin === "number" ? { actualMin: opts.actualMin } : {}),
        }))
      );
      toast.success("Tareas completadas");
      await onRefresh();
    } catch (e) {
      toast.error("No se pudieron completar", { description: msg(e, "Error") });
    } finally {
      setMutating(false);
    }
  }

  async function bulkArchive(selectedIds) {
    if (!tasksApi?.update) return;
    setMutating(true);
    try {
      const now = new Date().toISOString();
      await tasksApi.update(Array.from(selectedIds).map((id) => ({ taskId: id, archivedAt: now })));
      toast.success("Tareas archivadas");
      await onRefresh();
    } catch (e) {
      toast.error("No se pudieron archivar", { description: msg(e, "Error") });
    } finally {
      setMutating(false);
    }
  }

  async function bulkDelete(selectedIds) {
    if (!tasksApi?.remove) return;
    setMutating(true);
    try {
      await tasksApi.remove(Array.from(selectedIds));
      toast.success("Tareas eliminadas");
      await onRefresh();
    } catch (e) {
      toast.error("No se pudieron eliminar", { description: msg(e, "Error") });
    } finally {
      setMutating(false);
    }
  }

  async function bulkChangeStatus(selectedIds, newStatusId, statuses) {
    if (!tasksApi?.update) return;
    setMutating(true);
    try {
      const chosen = statuses.find((s) => s.taskStatusId === newStatusId);
      const now = new Date().toISOString();
      await tasksApi.update(
        Array.from(selectedIds).map((id) => ({
          taskId: id,
          taskStatusId: newStatusId,
          ...(chosen?.isFinal ? { completedAt: now } : {}),
        }))
      );
      toast.success(`${selectedIds.size ?? selectedIds.length} tarea(s) actualizadas`);
      await onRefresh();
    } catch (e) {
      toast.error("No se pudo cambiar el estado", { description: msg(e, "Error") });
    } finally {
      setMutating(false);
    }
  }

  return {
    mutating,
    handleCreate, handleUpdate,
    completeOne, archiveOne, deleteOne,
    bulkComplete, bulkArchive, bulkDelete, bulkChangeStatus,
  };
}
