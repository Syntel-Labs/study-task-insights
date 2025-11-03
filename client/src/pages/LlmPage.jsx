import React, { useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Stack,
  Typography,
} from "@mui/material";
import { useLlmApi } from "@utils/apiResources";

export default function LlmPage() {
  const { recommendations, chat } = useLlmApi();
  const [tab, setTab] = useState(0);
  const [limitWeeks, setLimitWeeks] = useState(4);
  const [chatInput, setChatInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleRecommendations() {
    setBusy(true);
    try {
      const data = await recommendations({ limitWeeks });
      setOutput(data?.text || JSON.stringify(data, null, 2));
    } finally {
      setBusy(false);
    }
  }

  async function handleChat() {
    if (!chatInput.trim()) return;
    setBusy(true);
    try {
      const data = await chat([{ role: "user", content: chatInput.trim() }]);
      setOutput(data?.text || JSON.stringify(data, null, 2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Recomendaciones" />
        <Tab label="Chat libre" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              type="number"
              label="Semanas a considerar"
              value={limitWeeks}
              onChange={(e) => setLimitWeeks(Number(e.target.value))}
              inputProps={{ min: 1, max: 16 }}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleRecommendations}
              disabled={busy}
            >
              Generar
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {output || "Sin resultados aún."}
          </Typography>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Mensaje"
              multiline
              minRows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <Button variant="contained" onClick={handleChat} disabled={busy}>
              Enviar
            </Button>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {output || "Escribe un mensaje para comenzar."}
            </Typography>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
