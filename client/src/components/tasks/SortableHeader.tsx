import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@components/ui/table";
import { cn } from "@lib/utils";

export type Column = {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

type Props = {
  columns: Column[];
  orderByField?: string;
  orderByDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  selectable?: boolean;
  allChecked?: boolean;
  someChecked?: boolean;
  onToggleAll?: (checked: boolean) => void;
};

export default function SortableHeader({
  columns = [],
  orderByField,
  orderByDir = "asc",
  onSort,
  selectable = false,
  allChecked = false,
  someChecked = false,
  onToggleAll,
}: Props) {
  return (
    <TableHeader>
      <TableRow>
        {selectable && (
          <TableHead className="w-10">
            <Checkbox
              checked={allChecked ? true : someChecked ? "indeterminate" : false}
              onCheckedChange={(c) => onToggleAll?.(c === true)}
            />
          </TableHead>
        )}
        {columns.map((col) => {
          const active = orderByField === col.key;
          const Icon = !active ? ArrowUpDown : orderByDir === "asc" ? ArrowUp : ArrowDown;
          return (
            <TableHead key={col.key} className={col.className} style={col.style}>
              {col.sortable ? (
                <button
                  type="button"
                  onClick={() => onSort?.(col.key)}
                  className={cn(
                    "hover:text-foreground inline-flex items-center gap-1 transition-colors",
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <span>{col.label}</span>
                  <Icon className="size-3.5" />
                </button>
              ) : (
                <span>{col.label}</span>
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
