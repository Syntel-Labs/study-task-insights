import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Tabs,
  Tab,
  Button,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { useCatalogsCrud } from "@hooks/api/catalogs";
import CatalogTable, {
  ColorSwatch,
  StatusChip,
} from "@components/catalogs/CatalogTable.jsx";
import CatalogDialog from "@components/catalogs/CatalogDialog.jsx";
import styles from "@styles/catalogs.module.scss";

// Definición de cada catálogo: columnas de tabla + campos editables + idKey
function useCatalogDefs() {
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
                <Chip size="small" color="success" label={t("common.yes")} />
              ) : (
                <Chip size="small" label={t("common.no")} />
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
            render: (r) => <StatusChip value={r.weight} />,
          },
        ],
        fields: [
          { key: "code", label: t("common.code"), required: true },
          { key: "weight", label: t("common.weight"), type: "number", required: true },
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
            render: (r) => (
              <Chip
                size="small"
                color={r.status === "active" ? "success" : "default"}
                label={
                  r.status === "active"
                    ? t("catalogs.term_active")
                    : t("catalogs.term_inactive")
                }
              />
            ),
          },
        ],
        fields: [
          { key: "name", label: t("common.name"), required: true },
          { key: "startDate", label: t("common.startDate"), type: "date", required: true },
          { key: "endDate", label: t("common.endDate"), type: "date", required: true },
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
            render: (r) => <ColorSwatch color={r.color} />,
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

// Map: clave de tab => API hook
function useApiFor(catalogKey) {
  const apis = useCatalogsCrud();
  const map = {
    statuses: apis.taskStatuses,
    priorities: apis.taskPriorities,
    types: apis.taskTypes,
    terms: apis.terms,
    tags: apis.taskTags,
  };
  return map[catalogKey];
}

export default function CatalogsPage() {
  const { t } = useTranslation();
  const defs = useCatalogDefs();
  const keys = Object.keys(defs);
  const [tab, setTab] = useState(0);
  const currentKey = keys[tab];
  const current = defs[currentKey];
  const api = useApiFor(currentKey);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (q = "") => {
      setLoading(true);
      try {
        const data = await api.list({ pageSize: 200, q: q || undefined });
        const items = data?.items || data?.data || [];
        setRows(
          items.map((it) => ({
            ...it,
            __id: it[current.idKey],
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
  }, [tab, load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleSubmit(values) {
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...values, [current.idKey]: editing[current.idKey] };
        await api.update(payload);
        Swal.fire({
          icon: "success",
          title: t("common.success"),
          text: t("messages.catalog_updated"),
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await api.create(values);
        Swal.fire({
          icon: "success",
          title: t("common.success"),
          text: t("messages.catalog_created"),
          timer: 1800,
          showConfirmButton: false,
        });
      }
      setDialogOpen(false);
      await load(search);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || "",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    const confirm = await Swal.fire({
      icon: "warning",
      title: t("catalogs.deleteConfirm", { count: 1 }),
      showCancelButton: true,
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.remove([row[current.idKey]]);
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: t("messages.catalog_deleted"),
        timer: 1800,
        showConfirmButton: false,
      });
      await load(search);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || "",
      });
    }
  }

  const initialValues = editing
    ? current.fields.reduce((acc, f) => {
        acc[f.key] =
          f.type === "date"
            ? String(editing[f.key] || "").slice(0, 10)
            : editing[f.key];
        return acc;
      }, {})
    : current.fields.reduce((acc, f) => {
        if (f.type === "boolean") acc[f.key] = false;
        else if (f.type === "color") acc[f.key] = "#3B82F6";
        return acc;
      }, {});

  const dialogTitle = editing
    ? t(`catalogs.editTitle_${currentKey}`)
    : t(`catalogs.addTitle_${currentKey}`);

  return (
    <Stack spacing={3} className={styles.pageRoot}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="h5" className={styles.title}>
              {t("catalogs.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("catalogs.subtitle")}
            </Typography>
          </Box>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained"
              onClick={openCreate}
              startIcon={<FontAwesomeIcon icon={faPlus} />}
            >
              {t("catalogs.add")}
            </Button>
          </motion.div>
        </Stack>
      </motion.div>

      <Paper className={styles.tabsPaper}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          className={styles.tabs}
        >
          {keys.map((k) => (
            <Tab key={k} label={t(defs[k].labelKey)} />
          ))}
        </Tabs>
      </Paper>

      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          size="small"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load(search);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />
        <IconButton onClick={() => load(search)} title={t("common.refresh")}>
          <FontAwesomeIcon icon={faArrowsRotate} />
        </IconButton>
      </Stack>

      <motion.div
        key={currentKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <CatalogTable
          columns={current.columns}
          rows={rows}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </motion.div>

      <CatalogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={dialogTitle}
        fields={current.fields}
        initialValues={initialValues}
        loading={saving}
      />
    </Stack>
  );
}
