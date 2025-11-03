import React from "react";
import { Checkbox } from "@mui/material";
import styles from "@styles/tasks.module.scss";

/**
 * Encabezado de tabla para Tasks con soporte de ordenamiento y selección opcional.
 *
 * Props:
 * - columns: array de columnas { key, label, sortable?, className?, style? }
 * - orderByField: campo actualmente ordenado
 * - orderByDir: "asc" | "desc" (por defecto "asc")
 * - onSort: callback al hacer click en una columna sortable
 * - selectable: boolean, muestra checkbox de selección global
 * - allChecked: boolean, indica si todos están seleccionados
 * - someChecked: boolean, indica selección parcial
 * - onToggleAll: callback al cambiar checkbox global
 */
export default function SortableHeader({
  columns = [],
  orderByField,
  orderByDir = "asc",
  onSort,
  selectable = false,
  allChecked = false,
  someChecked = false,
  onToggleAll,
}) {
  function renderCell(col) {
    if (!col.sortable) {
      return <span>{col.label}</span>;
    }

    const active = orderByField === col.key;
    const dir = active ? orderByDir : "asc";

    return (
      <button
        type="button"
        className={`${styles.sortBtn} ${active ? styles.sortActive : ""}`}
        onClick={() => onSort?.(col.key)}
        title={`Ordenar por ${col.label}`}
      >
        <span>{col.label}</span>
        <span
          className={`${styles.sortIcon} ${styles[`dir-${dir}`]}`}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <thead>
      <tr>
        {selectable && (
          <th className={styles.colCheck}>
            <Checkbox
              size="small"
              checked={allChecked}
              indeterminate={!allChecked && someChecked}
              onChange={(e) => onToggleAll?.(e.target.checked)}
            />
          </th>
        )}

        {columns.map((col) => (
          <th key={col.key} className={col.className} style={col.style}>
            {renderCell(col)}
          </th>
        ))}
      </tr>
    </thead>
  );
}
