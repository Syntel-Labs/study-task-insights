import { Filter, Plus, Search } from "lucide-react";
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
import { Switch } from "@components/ui/switch";

type Props = {
  q?: string;
  onChangeQuery?: (value: string) => void;
  orderByField?: string;
  orderByDir?: "asc" | "desc";
  onChangeOrderByField?: (field: string) => void;
  onChangeOrderByDir?: (dir: "asc" | "desc") => void;
  archived?: boolean;
  onToggleArchived?: (value: boolean) => void;
  onOpenFilters?: () => void;
  onCreateTask?: () => void;
  totalCount?: number;
  showFilters?: boolean;
};

export default function TasksHeader({
  q = "",
  onChangeQuery,
  orderByField = "dueAt",
  orderByDir = "asc",
  onChangeOrderByField,
  onChangeOrderByDir,
  archived = false,
  onToggleArchived,
  onOpenFilters,
  onCreateTask,
  totalCount = 0,
  showFilters,
}: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
      <div className="flex items-baseline gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Tareas
        </h1>
        {totalCount > 0 && (
          <span className="text-muted-foreground text-sm">
            {totalCount} en total
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-[200px] md:w-64">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Título o descripción…"
            value={q}
            onChange={(e) => onChangeQuery?.(e.target.value)}
            className="pl-8"
            aria-label="Buscar"
          />
        </div>

        <Select
          value={orderByField}
          onValueChange={(v) => onChangeOrderByField?.(v)}
        >
          <SelectTrigger size="sm" className="w-40" aria-label="Ordenar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueAt">Vencimiento</SelectItem>
            <SelectItem value="createdAt">Creación</SelectItem>
            <SelectItem value="updatedAt">Actualización</SelectItem>
            <SelectItem value="title">Título</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={orderByDir}
          onValueChange={(v) => onChangeOrderByDir?.(v as "asc" | "desc")}
        >
          <SelectTrigger size="sm" className="w-24" aria-label="Dirección">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Asc</SelectItem>
            <SelectItem value="desc">Desc</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 px-2">
          <Switch
            id="archived-switch"
            checked={!!archived}
            onCheckedChange={(c) => onToggleArchived?.(!!c)}
          />
          <Label htmlFor="archived-switch" className="text-sm font-normal">
            Incluir archivadas
          </Label>
        </div>

        <Button
          variant="outline"
          onClick={onOpenFilters}
          aria-controls="tasks-filters"
          aria-expanded={!!showFilters}
        >
          <Filter className="size-4" />
          Filtros
        </Button>

        <Button onClick={onCreateTask}>
          <Plus className="size-4" />
          Nueva tarea
        </Button>
      </div>
    </div>
  );
}
