import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip";

export type CatalogColumn<T = Record<string, unknown>> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type Row = Record<string, unknown> & { __id: string | number };

type Props = {
  columns: CatalogColumn<Row>[];
  rows: Row[];
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
};

export default function CatalogTable({ columns, rows, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  if (!rows || rows.length === 0) {
    return (
      <Card className="text-muted-foreground p-6 text-center text-sm">
        {t("catalogs.empty")}
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key}>{c.label}</TableHead>
            ))}
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.__id} className="hover:bg-muted/40">
              {columns.map((c) => (
                <TableCell key={c.key}>
                  {c.render
                    ? c.render(row)
                    : ((row[c.key] as React.ReactNode) ?? "—")}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(row)}
                        aria-label={t("common.edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("common.edit")}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDelete(row)}
                        className="text-destructive hover:text-destructive"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("common.delete")}</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ColorSwatch({ color }: { color?: string | null }) {
  if (!color) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="border-border size-4 rounded border"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground text-xs tabular-nums">
        {color}
      </span>
    </span>
  );
}

export function StatusChip({ value }: { value: React.ReactNode }) {
  return (
    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-semibold">
      {value}
    </Badge>
  );
}
