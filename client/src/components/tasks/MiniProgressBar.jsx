import React, { useMemo } from "react";
import styles from "@styles/tasks.module.scss";

/**
 * Barra de progreso compacta que compara minutos reales vs estimados.
 *
 * Props:
 * - estimatedMin: número de minutos estimados
 * - actualMin: número de minutos reales (null para no mostrar)
 * - height: altura en px (opcional, default 8)
 * - showLabel: mostrar etiqueta con texto "actual / estimado min (%)" (opcional, default true)
 */
export default function MiniProgressBar({
  estimatedMin = 0,
  actualMin,
  height = 8,
  showLabel = true,
}) {
  if (actualMin == null) {
    return <span className={styles.muted}>&mdash;</span>;
  }

  const { pct, barWidth, toneClass, label } = useMemo(() => {
    const a = Math.max(0, Number(actualMin) || 0);
    const e = Math.max(0, Number(estimatedMin) || 0);

    const rawPct = e > 0 ? (a / e) * 100 : 100;
    const pct = Math.round(rawPct);

    const barWidth = Math.max(0, Math.min(100, rawPct));

    let toneClass = styles.progressSuccess;
    if (e === 0 && a > 0) {
      toneClass = styles.progressWarning;
    } else if (e > 0 && a > e * 1.25) {
      toneClass = styles.progressError;
    } else if (e > 0 && a > e) {
      toneClass = styles.progressWarning;
    }

    const label = `${a} / ${e} min (${
      isFinite(pct) ? Math.min(pct, 999) : 0
    }%)`;
    return { pct, barWidth, toneClass, label };
  }, [actualMin, estimatedMin]);

  return (
    <div className={styles.miniProgress} style={{ height }}>
      <div
        className={`${styles.miniProgressBar} ${toneClass}`}
        style={{ width: `${barWidth}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      />
      {showLabel && <div className={styles.miniProgressLabel}>{label}</div>}
    </div>
  );
}
