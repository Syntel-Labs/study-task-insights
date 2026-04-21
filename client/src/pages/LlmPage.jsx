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
  Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faTrashCan,
  faCopy,
  faPlay,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useTranslation } from "react-i18next";
import { useLlmApi } from "@hooks/api/llm";
import styles from "@styles/llm.module.scss";

export default function LlmPage() {
  const { t } = useTranslation();
  const { recommendations, chat } = useLlmApi();
  const [tab, setTab] = useState(0);
  const [limitWeeks, setLimitWeeks] = useState(4);
  const [chatInput, setChatInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("md");

  function handleError(err) {
    if (err?.status === 503) {
      setError(t("llm.error_modelUnavailable"));
    } else {
      setError(err?.message || t("llm.error_generic"));
    }
    setOutput("");
  }

  async function handleRecommendations() {
    setBusy(true);
    setError(null);
    try {
      const data = await recommendations({ limitWeeks });
      setOutput(data?.data?.text || JSON.stringify(data, null, 2));
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleChat() {
    if (!chatInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const data = await chat([{ role: "user", content: chatInput.trim() }]);
      setOutput(data?.data?.text || JSON.stringify(data, null, 2));
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  const clearAll = () => {
    setChatInput("");
    setOutput("");
    setError(null);
  };

  const copyOut = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  return (
    <Box className={styles.pageRoot}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Paper className={`u-card ${styles.panel}`}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            className={styles.tabs}
            variant="scrollable"
          >
            <Tab label={t("llm.tab_recommendations")} />
            <Tab label={t("llm.tab_chat")} />
          </Tabs>

          <Divider className="u-divider" />

          {tab === 0 && (
            <Box className={styles.section}>
              <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
                <TextField
                  type="number"
                  label={t("dashboard.weeksLabel")}
                  size="small"
                  value={limitWeeks}
                  onChange={(e) => setLimitWeeks(Number(e.target.value))}
                  inputProps={{ min: 1, max: 16 }}
                  className={styles.weeksInput}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">sem</InputAdornment>,
                  }}
                />
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="contained"
                    onClick={handleRecommendations}
                    disabled={busy}
                    startIcon={<FontAwesomeIcon icon={faPlay} />}
                  >
                    {t("llm.generate")}
                  </Button>
                </motion.div>
              </Stack>
            </Box>
          )}

          {tab === 1 && (
            <Box className={styles.section}>
              <TextField
                label={t("llm.tab_chat")}
                placeholder={t("llm.placeholder_chat")}
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
                  {t("llm.clear")}
                </Button>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="contained"
                    startIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                    onClick={handleChat}
                    disabled={busy}
                  >
                    {t("llm.send")}
                  </Button>
                </motion.div>
              </Stack>
            </Box>
          )}

          <Divider className="u-divider" />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Alert
                  severity="warning"
                  icon={<FontAwesomeIcon icon={faTriangleExclamation} />}
                  sx={{ m: 2 }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Box className={styles.outputHeader}>
            <Typography variant="subtitle2" className={styles.outputTitle}>
              {t("llm.response")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <ToggleButtonGroup
                size="small"
                exclusive
                value={view}
                onChange={(_, v) => v && setView(v)}
                className={styles.viewToggle}
              >
                <ToggleButton value="md">{t("llm.view_md")}</ToggleButton>
                <ToggleButton value="raw">{t("llm.view_raw")}</ToggleButton>
              </ToggleButtonGroup>
              <IconButton onClick={copyOut} disabled={!output} aria-label="Copy">
                <FontAwesomeIcon icon={faCopy} />
              </IconButton>
            </Stack>
          </Box>

          <Box className={styles.outputBox}>
            {!output && !busy && !error && (
              <Typography variant="body2" className={styles.placeholder}>
                {tab === 0 ? t("llm.placeholder_empty_rec") : t("llm.placeholder_empty_chat")}
              </Typography>
            )}

            {busy && (
              <Box className={styles.loadingSkeleton}>
                <div className={styles.shimmer} />
                <motion.div
                  className={styles.thinking}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span>{t("llm.thinking")}</span>
                  <span className={styles.dotWrap}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </span>
                </motion.div>
              </Box>
            )}

            {!busy && output && view === "md" && (
              <motion.div
                className={styles.md}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {output}
                </ReactMarkdown>
              </motion.div>
            )}

            {!busy && output && view === "raw" && (
              <pre className={styles.pre}>{output}</pre>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}
