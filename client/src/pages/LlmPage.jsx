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
  IconButton,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faTrashCan,
  faCopy,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useLlmApi } from "@utils/apiResources";
import styles from "@styles/llm.module.scss";

export default function LlmPage() {
  const { recommendations, chat } = useLlmApi();
  const [tab, setTab] = useState(0);
  const [limitWeeks, setLimitWeeks] = useState(4);
  const [chatInput, setChatInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("md");

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

  const clearAll = () => {
    setChatInput("");
    setOutput("");
  };

  const copyOut = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  return (
    <Box className={styles.pageRoot}>
      <Paper className={`u-card ${styles.panel}`}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          className={styles.tabs}
          variant="scrollable"
        >
          <Tab label="Recomendaciones" />
          <Tab label="Chat libre" />
        </Tabs>

        <Divider className="u-divider" />

        {tab === 0 && (
          <Box className={styles.section}>
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              flexWrap="wrap"
            >
              <TextField
                type="number"
                label="Semanas"
                size="small"
                value={limitWeeks}
                onChange={(e) => setLimitWeeks(Number(e.target.value))}
                inputProps={{ min: 1, max: 16 }}
                className={styles.weeksInput}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">sem</InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleRecommendations}
                disabled={busy}
                startIcon={<FontAwesomeIcon icon={faPlay} />}
              >
                Generar
              </Button>
            </Stack>
          </Box>
        )}

        {tab === 1 && (
          <Box className={styles.section}>
            <TextField
              label="Mensaje"
              placeholder="Escribe tu prompt…"
              multiline
              minRows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className={styles.inputArea}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faTrashCan} />}
                onClick={clearAll}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                startIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                onClick={handleChat}
                disabled={busy}
              >
                Enviar
              </Button>
            </Stack>
          </Box>
        )}

        <Divider className="u-divider" />

        <Box className={styles.outputHeader}>
          <Typography variant="subtitle2" className={styles.outputTitle}>
            Respuesta
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={view}
              onChange={(_, v) => v && setView(v)}
              className={styles.viewToggle}
            >
              <ToggleButton value="md">Markdown</ToggleButton>
              <ToggleButton value="raw">Texto</ToggleButton>
            </ToggleButtonGroup>
            <IconButton
              onClick={copyOut}
              disabled={!output}
              aria-label="Copiar"
            >
              <FontAwesomeIcon icon={faCopy} />
            </IconButton>
          </Stack>
        </Box>

        <Box className={styles.outputBox}>
          {!output && !busy && (
            <Typography variant="body2" className={styles.placeholder}>
              {tab === 0
                ? "Sin resultados aún."
                : "Escribe un mensaje para comenzar."}
            </Typography>
          )}

          {busy && (
            <Box className={styles.loadingSkeleton}>
              <div className={styles.shimmer} />
            </Box>
          )}

          {!busy && output && view === "md" && (
            <div className={styles.md}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {output}
              </ReactMarkdown>
            </div>
          )}

          {!busy && output && view === "raw" && (
            <pre className={styles.pre}>{output}</pre>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
