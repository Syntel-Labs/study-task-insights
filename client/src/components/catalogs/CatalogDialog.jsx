import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export default function CatalogDialog({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  initialValues,
  loading,
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState({});

  useEffect(() => {
    if (open) setValues(initialValues || {});
  }, [open, initialValues]);

  function setField(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {fields.map((f) => {
              const val = values[f.key] ?? (f.type === "boolean" ? false : "");
              if (f.type === "boolean") {
                return (
                  <FormControlLabel
                    key={f.key}
                    control={
                      <Switch
                        checked={!!val}
                        onChange={(e) => setField(f.key, e.target.checked)}
                      />
                    }
                    label={f.label}
                  />
                );
              }
              if (f.type === "select") {
                return (
                  <TextField
                    key={f.key}
                    select
                    label={f.label}
                    value={val}
                    onChange={(e) => setField(f.key, e.target.value)}
                    required={f.required}
                    fullWidth
                    size="small"
                  >
                    {f.options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }
              if (f.type === "color") {
                return (
                  <Stack key={f.key} direction="row" spacing={2} alignItems="center">
                    <TextField
                      label={f.label}
                      value={val}
                      onChange={(e) => setField(f.key, e.target.value)}
                      required={f.required}
                      fullWidth
                      size="small"
                      placeholder="#3B82F6"
                    />
                    <input
                      type="color"
                      value={val || "#000000"}
                      onChange={(e) => setField(f.key, e.target.value)}
                      style={{
                        width: 44,
                        height: 38,
                        border: "1px solid var(--color-border)",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "var(--color-surface)",
                      }}
                    />
                  </Stack>
                );
              }
              return (
                <TextField
                  key={f.key}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  label={f.label}
                  value={val}
                  onChange={(e) =>
                    setField(
                      f.key,
                      f.type === "number"
                        ? e.target.value === "" ? "" : Number(e.target.value)
                        : e.target.value
                    )
                  }
                  required={f.required}
                  disabled={f.readOnly}
                  multiline={f.multiline}
                  rows={f.multiline ? 3 : undefined}
                  fullWidth
                  size="small"
                  InputLabelProps={f.type === "date" ? { shrink: true } : undefined}
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
