import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import CatalogDialog, {
  type CatalogField,
} from "@components/catalogs/CatalogDialog";
import CatalogTable, {
  ColorSwatch,
  StatusChip,
  type CatalogColumn,
} from "@components/catalogs/CatalogTable";
import ConfirmDialog from "@components/tasks/ConfirmDialog";
import { useCatalogsCrud } from "@hooks/api";

type Row = Record<string, unknown> & { __id: string | number };

type CatalogKey = "statuses" | "priorities" | "types" | "terms" | "tags";

type CatalogDef = {
  labelKey: string;
  idKey: string;
  columns: CatalogColumn<Row>[];
  fields: CatalogField[];
};

function useCatalogDefs(): Record<CatalogKey, CatalogDef> {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      statuses: {
        labelKey: "catalogs.tab_statuses",
        idKey: "taskStatusId",
        columns: [
          { key: "taskStatusId", label: "ID" },
          { key: "code", label: t("common.code") },
          { key: "description", label: t("common.description") },
          {
            key: "isFinal",
            label: t("common.isFinal"),
            render: (r) =>
              r.isFinal ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  {t("common.yes")}
                </Badge>
              ) : (
                <Badge variant="secondary">{t("common.no")}</Badge>
              ),
          },
        ],
        fields: [
          { key: "code", label: t("common.code"), required: true },
          { key: "description", label: t("common.description") },
          { key: "isFinal", label: t("common.isFinal"), type: "boolean" },
        ],
      },
      priorities: {
        labelKey: "catalogs.tab_priorities",
        idKey: "taskPriorityId",
        columns: [
          { key: "taskPriorityId", label: "ID" },
          { key: "code", label: t("common.code") },
          {
            key: "weight",
            label: t("common.weight"),
            render: (r) => <StatusChip value={r.weight as React.ReactNode} />,
          },
        ],
        fields: [
          { key: "code", label: t("common.code"), required: true },
          {
            key: "weight",
            label: t("common.weight"),
            type: "number",
            required: true,
          },
        ],
      },
      types: {
        labelKey: "catalogs.tab_types",
        idKey: "taskTypeId",
        columns: [
          { key: "taskTypeId", label: "ID" },
          { key: "code", label: t("common.code") },
          { key: "description", label: t("common.description") },
        ],
        fields: [
          { key: "code", label: t("common.code"), required: true },
          { key: "description", label: t("common.description") },
        ],
      },
      terms: {
        labelKey: "catalogs.tab_terms",
        idKey: "termId",
        columns: [
          { key: "termId", label: "ID" },
          { key: "name", label: t("common.name") },
          {
            key: "startDate",
            label: t("common.startDate"),
            render: (r) => String(r.startDate || "").slice(0, 10),
          },
          {
            key: "endDate",
            label: t("common.endDate"),
            render: (r) => String(r.endDate || "").slice(0, 10),
          },
          {
            key: "status",
            label: t("common.status"),
            render: (r) =>
              r.status === "active" ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  {t("catalogs.term_active")}
                </Badge>
              ) : (
                <Badge variant="secondary">{t("catalogs.term_inactive")}</Badge>
              ),
          },
        ],
        fields: [
          { key: "name", label: t("common.name"), required: true },
          {
            key: "startDate",
            label: t("common.startDate"),
            type: "date",
            required: true,
          },
          {
            key: "endDate",
            label: t("common.endDate"),
            type: "date",
            required: true,
          },
          {
            key: "status",
            label: t("common.status"),
            type: "select",
            options: [
              { value: "active", label: t("catalogs.term_active") },
              { value: "inactive", label: t("catalogs.term_inactive") },
            ],
          },
        ],
      },
      tags: {
        labelKey: "catalogs.tab_tags",
        idKey: "taskTagId",
        columns: [
          { key: "name", label: t("common.name") },
          {
            key: "color",
            label: t("common.color"),
            render: (r) => <ColorSwatch color={r.color as string | null} />,
          },
        ],
        fields: [
          { key: "name", label: t("common.name"), required: true },
          { key: "color", label: t("common.color"), type: "color" },
        ],
      },
    }),
    [t]
  );
}

export default function CatalogsPage() {
  const { t } = useTranslation();
  const defs = useCatalogDefs();
  const keys = Object.keys(defs) as CatalogKey[];
  const [currentKey, setCurrentKey] = useState<CatalogKey>("statuses");
  const current = defs[currentKey];

  const apis = useCatalogsCrud();
  const apiFor = (k: CatalogKey) =>
    ({
      statuses: apis.taskStatuses,
      priorities: apis.taskPriorities,
      types: apis.taskTypes,
      terms: apis.terms,
      tags: apis.taskTags,
    })[k];
  const api = apiFor(currentKey);

  const [rows, setRows] = useState<Row[]>([]);
  const [, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const load = useCallback(
    async (q = "") => {
      setLoading(true);
      try {
        const data = await api.list({ pageSize: 200, q: q || undefined });
        const items =
          (data as { items?: unknown[] })?.items ??
          ((data as { data?: unknown }).data as unknown[]) ??
          [];
        setRows(
          (items as Record<string, unknown>[]).map((it) => ({
            ...it,
            __id: (it[current.idKey] as string | number) ?? "",
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [api, current.idKey]
  );

  useEffect(() => {
    load("");
    setSearch("");
  }, [currentKey, load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    setSaving(true);
    try {
      if (editing) {
        const payload = {
          ...values,
          [current.idKey]: editing[current.idKey],
        };
        await api.update(payload);
        toast.success(t("messages.catalog_updated"));
      } else {
        await api.create(values);
        toast.success(t("messages.catalog_created"));
      }
      setDialogOpen(false);
      await load(search);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "";
      toast.error(t("common.error"), { description: msg });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteRow) return;
    try {
      await api.remove([deleteRow[current.idKey] as string | number]);
      toast.success(t("messages.catalog_deleted"));
      await load(search);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "";
      toast.error(t("common.error"), { description: msg });
    } finally {
      setDeleteRow(null);
    }
  }

  const initialValues: Record<string, unknown> = editing
    ? current.fields.reduce<Record<string, unknown>>((acc, f) => {
        acc[f.key] =
          f.type === "date"
            ? String(editing[f.key] ?? "").slice(0, 10)
            : editing[f.key];
        return acc;
      }, {})
    : current.fields.reduce<Record<string, unknown>>((acc, f) => {
        if (f.type === "boolean") acc[f.key] = false;
        else if (f.type === "color") acc[f.key] = "#3B82F6";
        return acc;
      }, {});

  const dialogTitle = editing
    ? t(`catalogs.editTitle_${currentKey}`)
    : t(`catalogs.addTitle_${currentKey}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {t("catalogs.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("catalogs.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("catalogs.add")}
        </Button>
      </div>

      <Tabs
        value={currentKey}
        onValueChange={(v) => setCurrentKey(v as CatalogKey)}
      >
        <TabsList>
          {keys.map((k) => (
            <TabsTrigger key={k} value={k} className="min-w-[8rem] px-3">
              {t(defs[k].labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load(search);
            }}
            placeholder={t("common.search")}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => load(search)}
          aria-label={t("common.refresh")}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <CatalogTable
        columns={current.columns}
        rows={rows}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row)}
      />

      <CatalogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={dialogTitle}
        fields={current.fields}
        initialValues={initialValues}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteRow}
        title={t("catalogs.deleteConfirm", { count: 1 })}
        tone="danger"
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        onClose={() => setDeleteRow(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
