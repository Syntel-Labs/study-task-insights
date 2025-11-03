import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Controles de paginación para listas de tareas.
 *
 * Props:
 * - limit: cantidad de items por página (default 20)
 * - offset: posición inicial del listado (default 0)
 * - total: total de items disponibles
 * - onChangeLimit: callback al cambiar items por página
 * - onChangeOffset: callback al cambiar offset
 * - limitOptions: array de opciones de límite por página
 */
export default function PaginationControls({
  limit = 20,
  offset = 0,
  total = 0,
  onChangeLimit,
  onChangeOffset,
  limitOptions = [10, 20, 50, 100, 200],
}) {
  const { page, pages } = useMemo(() => {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 1));
    const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / safeLimit));
    const currentPage = Math.min(
      totalPages,
      Math.max(1, Math.floor((Number(offset) || 0) / safeLimit) + 1)
    );
    return { page: currentPage, pages: totalPages };
  }, [limit, offset, total]);

  const [pageInput, setPageInput] = useState(page);
  useEffect(() => setPageInput(page), [page]);

  function goToPage(p) {
    const target = Math.max(1, Math.min(pages, Number(p) || 1));
    const newOffset =
      (target - 1) * Math.max(1, Math.min(200, Number(limit) || 1));
    onChangeOffset?.(newOffset);
  }

  function handleSubmitPage(e) {
    e.preventDefault();
    goToPage(pageInput);
  }

  return (
    <Box
      className={styles.paginationBar}
      role="navigation"
      aria-label="Paginación"
    >
      <div className={styles.paginationLeft}>
        <FormControl size="small" className={styles.limitControl}>
          <InputLabel id="limit-label">Por página</InputLabel>
          <Select
            labelId="limit-label"
            label="Por página"
            value={limit}
            onChange={(e) => onChangeLimit?.(Number(e.target.value))}
            MenuProps={{ disableScrollLock: true }}
          >
            {limitOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <Stack
        direction="row"
        spacing={0}
        alignItems="center"
        className={styles.paginationCenter}
      >
        <div className={styles.pageButtons}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => goToPage(1)}
            disabled={page <= 1}
          >
            « Primero
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            ‹ Anterior
          </Button>
        </div>

        <form onSubmit={handleSubmitPage} className={styles.pageForm}>
          <Typography variant="body2" className={styles.pageLabel}>
            Página
          </Typography>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 1, max: pages }}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className={styles.pageInput}
          />
          <Typography variant="body2" className={styles.pagesTotal}>
            de {pages}
          </Typography>
        </form>

        <div className={styles.pageButtons}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pages}
          >
            Siguiente ›
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => goToPage(pages)}
            disabled={page >= pages}
          >
            Último »
          </Button>
        </div>
      </Stack>
    </Box>
  );
}
