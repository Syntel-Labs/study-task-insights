import React from "react";
import { Box, Button, TextField, Typography, InputAdornment } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faChartLine } from "@fortawesome/free-solid-svg-icons";
import styles from "@styles/dashboard.module.scss";

export default function DashboardHeader({
  limitWeeks,
  setLimitWeeks,
  updating,
  onRefresh,
  lastUpdate,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "es";

  return (
    <motion.div
      className={styles.headerHero}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box className={styles.headerRow}>
        <Box>
          <Typography variant="h5" className={styles.title}>
            <FontAwesomeIcon icon={faChartLine} className={styles.titleIcon} />
            {t("dashboard.title")}
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            {t("dashboard.subtitle")}
          </Typography>
        </Box>

        <div className={styles.headerRight}>
          <TextField
            label={t("dashboard.weeksLabel")}
            type="number"
            size="small"
            value={limitWeeks}
            onChange={(e) =>
              setLimitWeeks(
                Math.max(1, Math.min(52, Number(e.target.value) || 1))
              )
            }
            inputProps={{ min: 1, max: 52 }}
          />

          <div className={styles.refreshGroup}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="contained"
                onClick={onRefresh}
                disabled={updating}
                className={styles.refreshBtn}
                startIcon={<FontAwesomeIcon icon={faArrowsRotate} spin={updating} />}
              >
                {updating ? t("dashboard.refreshing") : t("dashboard.refresh")}
              </Button>
            </motion.div>
            {lastUpdate && (
              <Typography variant="caption" className={styles.updatedAt}>
                {t("dashboard.updatedAt", {
                  time: new Intl.DateTimeFormat(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(lastUpdate),
                })}
              </Typography>
            )}
          </div>
        </div>
      </Box>
    </motion.div>
  );
}
