import { useState } from "react";
import Swal from "sweetalert2";

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
      await Swal.fire("Creada", "La tarea fue creada correctamente.", "success");
      await onRefresh();
      return true;
    } catch (e) {
      await Swal.fire("Error", e?.payload?.message || e?.message || "No se pudo crear", "error");
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
      await Swal.fire("Guardado", "Cambios aplicados.", "success");
      await onRefresh();
      return true;
    } catch (e) {
      await Swal.fire("Error", e?.payload?.message || e?.message || "No se pudo guardar", "error");
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
      Swal.fire("Completada", "La tarea fue marcada como completada.", "success");
      await onRefresh();
    } catch (e) {
      Swal.fire("Error", e?.payload?.message || e?.message || "No se pudo completar", "error");
    } finally {
      setMutating(false);
    }
  }

  async function archiveOne(task) {
    if (!tasksApi?.update) return;
    setMutating(true);
    try {
      await tasksApi.update([{ taskId: task.id, archivedAt: new Date().toISOString() }]);
      Swal.fire("Archivada", "La tarea fue archivada.", "success");
      await onRefresh();
    } catch (e) {
      Swal.fire("Error", e?.payload?.message || e?.message || "No se pudo archivar", "error");
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
      Swal.fire("Eliminada", "La tarea fue eliminada.", "success");
      await onRefresh();
    } catch (e) {
      Swal.fire("Error", e?.payload?.message || e?.message || "No se pudo eliminar", "error");
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
      Swal.fire("Completadas", "Tareas marcadas como completadas.", "success");
      await onRefresh();
    } catch (e) {
      Swal.fire("Error", e?.payload?.message || e?.message || "No se pudieron completar", "error");
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
      Swal.fire("Archivadas", "Tareas archivadas.", "success");
      await onRefresh();
    } catch (e) {
      Swal.fire("Error", e?.payload?.message || e?.message || "No se pudieron archivar", "error");
    } finally {
      setMutating(false);
    }
  }

  async function bulkDelete(selectedIds) {
    if (!tasksApi?.remove) return;
    setMutating(true);
    try {
      await tasksApi.remove(Array.from(selectedIds));
      Swal.fire("Eliminadas", "Tareas eliminadas.", "success");
      await onRefresh();
    } catch (e) {
      Swal.fire("Error", e?.payload?.message || e?.message || "No se pudieron eliminar", "error");
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
      Swal.fire("Estados aplicados", `${selectedIds.size} tarea(s) actualizadas.`, "success");
      await onRefresh();
    } catch (e) {
      Swal.fire("Error", e?.payload?.message || e?.message || "No se pudo cambiar el estado", "error");
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
