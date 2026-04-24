import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
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
import { Textarea } from "@components/ui/textarea";

export type CatalogField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "boolean" | "select" | "color";
  required?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  options?: { value: string; label: string }[];
};

type Values = Record<string, unknown>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Values) => void;
  title: string;
  fields: CatalogField[];
  initialValues?: Values;
  loading?: boolean;
};

export default function CatalogDialog({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  initialValues,
  loading = false,
}: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Values>({});

  useEffect(() => {
    if (open) setValues(initialValues ?? {});
  }, [open, initialValues]);

  function setField(key: string, val: unknown) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          id="catalog-dialog-form"
          className="flex flex-col gap-3"
        >
          {fields.map((f) => {
            const val = values[f.key] ?? (f.type === "boolean" ? false : "");
            if (f.type === "boolean") {
              return (
                <div key={f.key} className="flex items-center gap-2">
                  <Switch
                    id={`cat-${f.key}`}
                    checked={!!val}
                    onCheckedChange={(c) => setField(f.key, !!c)}
                  />
                  <Label htmlFor={`cat-${f.key}`} className="font-normal">
                    {f.label}
                  </Label>
                </div>
              );
            }
            if (f.type === "select") {
              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label>
                    {f.label}
                    {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={String(val ?? "")}
                    onValueChange={(v) => setField(f.key, v)}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }
            if (f.type === "color") {
              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`cat-${f.key}`}>
                    {f.label}
                    {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`cat-${f.key}`}
                      value={String(val ?? "")}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder="#3B82F6"
                      required={f.required}
                    />
                    <input
                      type="color"
                      value={String(val || "#000000")}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className="border-input bg-background size-9 cursor-pointer rounded-md border"
                      aria-label={`${f.label} picker`}
                    />
                  </div>
                </div>
              );
            }
            if (f.multiline) {
              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`cat-${f.key}`}>
                    {f.label}
                    {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    id={`cat-${f.key}`}
                    value={String(val ?? "")}
                    onChange={(e) => setField(f.key, e.target.value)}
                    required={f.required}
                    rows={3}
                  />
                </div>
              );
            }
            return (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`cat-${f.key}`}>
                  {f.label}
                  {f.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`cat-${f.key}`}
                  type={
                    f.type === "number"
                      ? "number"
                      : f.type === "date"
                        ? "date"
                        : "text"
                  }
                  value={String(val ?? "")}
                  onChange={(e) =>
                    setField(
                      f.key,
                      f.type === "number"
                        ? e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                        : e.target.value
                    )
                  }
                  required={f.required}
                  disabled={f.readOnly}
                />
              </div>
            );
          })}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="catalog-dialog-form"
            disabled={loading}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
