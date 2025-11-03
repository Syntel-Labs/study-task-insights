import React, { useEffect, useState } from "react";
import { Paper, Stack, TextField, Button, Typography } from "@mui/material";
import { useSessionsApi } from "@utils/apiResources";

export default function StudySessionsPage() {
  const { list, create } = useSessionsApi();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    taskId: "",
    startedAt: "",
    endedAt: "",
    notes: "",
  });

  async function load() {
    const data = await list({});
    setRows(data?.items ?? data ?? []);
  }

  async function handleCreate() {
    await create(form);
    setForm({ taskId: "", startedAt: "", endedAt: "", notes: "" });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Sesiones de estudio</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Task Id (opcional)"
            size="small"
            value={form.taskId}
            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
          />
          <TextField
            label="Inicio (ISO)"
            size="small"
            value={form.startedAt}
            onChange={(e) => setForm({ ...form, startedAt: e.target.value })}
          />
          <TextField
            label="Fin (ISO)"
            size="small"
            value={form.endedAt}
            onChange={(e) => setForm({ ...form, endedAt: e.target.value })}
          />
          <TextField
            label="Notas"
            size="small"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button variant="contained" onClick={handleCreate}>
            Agregar
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {rows.length === 0
          ? "Sin datos"
          : rows.map((s) => (
              <div
                key={s.study_session_id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--color-divider)",
                }}
              >
                {s.started_at} → {s.ended_at} — {s.notes}
              </div>
            ))}
      </Paper>
    </Stack>
  );
}
