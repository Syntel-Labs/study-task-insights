import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import styles from "@styles/catalogs.module.scss";

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.03 * i, duration: 0.25 },
  }),
};

export default function CatalogTable({ columns, rows, onEdit, onDelete }) {
  const { t } = useTranslation();

  if (!rows || rows.length === 0) {
    return (
      <Paper className={styles.emptyPaper}>
        <Typography variant="body2" color="text.secondary">
          {t("catalogs.empty")}
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} className={styles.tablePaper}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key} className={styles.headCell}>
                {c.label}
              </TableCell>
            ))}
            <TableCell align="right" className={styles.headCell}>
              {t("common.actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.__id}
              className={styles.bodyRow}
              variants={rowVariants}
              initial="hidden"
              animate="show"
              custom={i}
              whileHover={{ backgroundColor: "var(--color-surface-2)" }}
            >
              {columns.map((c) => (
                <TableCell key={c.key} className={styles.bodyCell}>
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </TableCell>
              ))}
              <TableCell align="right" className={styles.bodyCell}>
                <Tooltip title={t("common.edit")}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(row)}
                    className={styles.actionBtn}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("common.delete")}>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(row)}
                    className={`${styles.actionBtn} ${styles.actionDanger}`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function ColorSwatch({ color }) {
  if (!color) return "—";
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: "4px",
          bgcolor: color,
          border: "1px solid var(--color-border)",
        }}
      />
      <Typography variant="caption">{color}</Typography>
    </Box>
  );
}

export function StatusChip({ value }) {
  return (
    <Chip
      size="small"
      label={value}
      sx={{
        bgcolor: "var(--color-primary-weak)",
        color: "var(--color-primary)",
        fontWeight: 600,
      }}
    />
  );
}
