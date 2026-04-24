import { useMemo, useState } from "react";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { cn } from "@lib/utils";
import ConfirmDialog from "./ConfirmDialog";

type Status = {
  taskStatusId: string;
  name: string;
  isFinal?: boolean;
};

type Props = {
  selectedIds?: string[];
  loading?: boolean;
  statuses?: Status[];
  onClearSelection?: () => void;
  onBulkComplete?: (ids: string[], payload?: { actualMin?: number }) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onApplyStatus?: (statusId: string) => void | Promise<void>;
};

type ConfirmType = "complete" | "delete" | null;

export default function BulkActionsBar({
  selectedIds = [],
  loading = false,
  statuses = [],
  onClearSelection,
  onBulkComplete,
  onBulkDelete,
  onApplyStatus,
}: Props) {
  const [confirm, setConfirm] = useState<{ type: ConfirmType; open: boolean }>({
    type: null,
    open: false,
  });
  const [statusId, setStatusId] = useState<string>("");
  const [confirmStatus, setConfirmStatus] = useState(false);

  const hasSelection = selectedIds.length > 0;

  const finalStatuses = useMemo(
    () => statuses.filter((s) => s.isFinal),
    [statuses]
  );

  const openConfirm = (type: ConfirmType) => setConfirm({ type, open: true });
  const closeConfirm = () => setConfirm({ type: null, open: false });

  async function handleConfirm(payload?: { actualMin?: number }) {
    try {
      if (confirm.type === "complete") await onBulkComplete?.(selectedIds, payload);
      else if (confirm.type === "delete") await onBulkDelete?.(selectedIds);
    } finally {
      closeConfirm();
    }
  }

  async function handleConfirmStatus() {
    if (!statusId) return;
    try {
      await onApplyStatus?.(statusId);
      setStatusId("");
    } finally {
      setConfirmStatus(false);
    }
  }

  return (
    <>
      <div
        role="region"
        aria-live="polite"
        aria-hidden={!hasSelection}
        className={cn(
          "bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 shadow-sm transition-opacity",
          !hasSelection && "pointer-events-none opacity-0"
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm font-medium">
            {selectedIds.length} seleccionada(s)
          </span>

          <div className="flex items-center gap-2">
            <Label htmlFor="bulk-status" className="text-xs">
              Estado
            </Label>
            <Select value={statusId} onValueChange={setStatusId} disabled={loading}>
              <SelectTrigger id="bulk-status" size="sm" className="w-40">
                <SelectValue placeholder="Cambiar estado…" />
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

          <Button
            variant="outline"
            size="sm"
            disabled={!statusId || loading || !hasSelection}
            onClick={() => setConfirmStatus(true)}
          >
            Aplicar estado
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={!hasSelection || loading}
            onClick={() => openConfirm("complete")}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Completar
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={!hasSelection || loading}
            onClick={() => openConfirm("delete")}
          >
            Eliminar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={!hasSelection || loading}
          >
            Limpiar selección
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open && confirm.type === "complete"}
        title="Completar tareas seleccionadas"
        tone="primary"
        message={
          <span>
            Vas a marcar <b>{selectedIds.length}</b> tarea(s) como{" "}
            <b>completadas</b>.
          </span>
        }
        askActualMin
        confirmLabel="Completar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={confirm.open && confirm.type === "delete"}
        title="Eliminar tareas seleccionadas"
        tone="danger"
        message={
          <span>
            Esta acción es <b>definitiva</b>. Se eliminarán{" "}
            <b>{selectedIds.length}</b> tarea(s).
          </span>
        }
        confirmLabel="Eliminar"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={confirmStatus}
        title="Aplicar estado a seleccionadas"
        tone="primary"
        message={
          <span>
            Aplicarás el estado a <b>{selectedIds.length}</b> tarea(s).
            {finalStatuses.some((s) => s.taskStatusId === statusId) && (
              <>
                {" "}
                El estado elegido es <b>final</b>; quedarán como completadas.
              </>
            )}
          </span>
        }
        confirmLabel="Aplicar"
        onClose={() => setConfirmStatus(false)}
        onConfirm={handleConfirmStatus}
      />
    </>
  );
}
