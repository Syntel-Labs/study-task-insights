import { useMemo } from "react";
import { Table, TableBody, TableCell, TableRow } from "@components/ui/table";
import SortableHeader, { type Column } from "./SortableHeader";
import TaskRow from "./TaskRow";

type Task = {
  id: string;
  title: string;
  description?: string;
  dueAt?: string | null;
  estimatedMin?: number;
  actualMin?: number | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  status?: { name?: string; code?: string; isFinal?: boolean } | null;
  priority?: { name?: string; weight?: number } | null;
  type?: { name?: string } | null;
  tags?: { taskTagId?: string; name: string; color?: string | null }[];
};

type Props = {
  items?: Task[];
  loading?: boolean;
  selectedIds?: Set<string> | string[];
  orderByField?: string;
  orderByDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  onOpenDrawer?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

const COLUMNS: Column[] = [
  { key: "title", label: "Título", sortable: true },
  { key: "status", label: "Estado" },
  { key: "priority", label: "Prioridad" },
  { key: "type", label: "Tipo" },
  { key: "tags", label: "Tags" },
  { key: "dueAt", label: "Vence", sortable: true },
  { key: "time", label: "Tiempo" },
  { key: "final", label: "Estado final" },
  { key: "actions", label: "Acciones", className: "text-right" },
];

export default function TasksTable({
  items = [],
  loading = false,
  selectedIds = new Set<string>(),
  orderByField,
  orderByDir,
  onSort,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDrawer,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
}: Props) {
  const selectedSet = useMemo(
    () => (selectedIds instanceof Set ? selectedIds : new Set(selectedIds)),
    [selectedIds]
  );

  const allChecked =
    items.length > 0 && items.every((t) => selectedSet.has(t.id));
  const someChecked = items.some((t) => selectedSet.has(t.id)) && !allChecked;

  return (
    <Table>
      <SortableHeader
        columns={COLUMNS}
        orderByField={orderByField}
        orderByDir={orderByDir}
        onSort={onSort}
        selectable
        allChecked={allChecked}
        someChecked={someChecked}
        onToggleAll={(c) => onToggleSelectAll?.(c)}
      />
      <TableBody>
        {!loading && items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={COLUMNS.length + 1}
              className="text-muted-foreground py-8 text-center"
            >
              Sin datos
            </TableCell>
          </TableRow>
        )}
        {items.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={selectedSet.has(task.id)}
            onToggleSelect={onToggleSelect}
            onOpenDrawer={onOpenDrawer}
            onEdit={onEdit}
            onComplete={onComplete}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
