import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faMoon,
  faSun,
  faGauge,
  faListCheck,
  faFolderTree,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "@context/AuthContext.jsx";
import { usePreferences } from "@context/PreferencesContext.jsx";
import styles from "@styles/app-layout.module.scss";

export default function AppLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { isDark, toggleTheme, lang, setLanguage } = usePreferences();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: faGauge },
    { to: "/tasks", label: t("nav.tasks"), icon: faListCheck },
    { to: "/catalogs", label: t("nav.catalogs"), icon: faFolderTree },
    { to: "/llm", label: t("nav.llm"), icon: faWandMagicSparkles },
  ];

  return (
    <div className={styles.layoutRoot}>
      <AppBar position="fixed" elevation={1} className={styles.appBar}>
        <Toolbar className={styles.toolbar}>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography variant="h6" className={styles.brand}>
              {t("app.brand")}
            </Typography>
          </motion.div>

          <nav className={styles.nav}>
            {navItems.map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 * i }}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? styles.linkActive : styles.link
                  }
                >
                  <FontAwesomeIcon icon={item.icon} className={styles.linkIcon} />
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>

          <Box sx={{ flex: 1 }} />

          <Box className={styles.toolbarActions}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={lang}
              onChange={(_, v) => v && setLanguage(v)}
              className={styles.langToggle}
            >
              <ToggleButton value="es">ES</ToggleButton>
              <ToggleButton value="en">EN</ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title={isDark ? t("common.theme_light") : t("common.theme_dark")}>
              <IconButton
                onClick={toggleTheme}
                size="small"
                className={styles.themeToggle}
                aria-label="toggle theme"
              >
                <motion.span
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "inline-flex" }}
                >
                  <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
                </motion.span>
              </IconButton>
            </Tooltip>

            <Button
              onClick={handleLogout}
              size="small"
              className={styles.logoutBtn}
              startIcon={<FontAwesomeIcon icon={faRightFromBracket} />}
            >
              {t("nav.logout")}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
