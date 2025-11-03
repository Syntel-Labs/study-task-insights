import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@context/AuthContext.jsx";
import styles from "@styles/app-layout.module.scss";

export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className={styles.layoutRoot}>
      <AppBar position="fixed" elevation={1} className={styles.appBar}>
        <Toolbar className={styles.toolbar}>
          {/* Brand */}
          <Typography variant="h6" className={styles.brand}>
            Study Task Insights
          </Typography>

          {/* Nav */}
          <nav className={styles.nav}>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? styles.linkActive : styles.link
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                isActive ? styles.linkActive : styles.link
              }
            >
              Tareas
            </NavLink>
            <NavLink
              to="/sessions"
              className={({ isActive }) =>
                isActive ? styles.linkActive : styles.link
              }
            >
              Sesiones
            </NavLink>
            <NavLink
              to="/catalogs"
              className={({ isActive }) =>
                isActive ? styles.linkActive : styles.link
              }
              title="Administrar catálogos: términos, estados, prioridades, tipos, etiquetas"
            >
              Catálogos
            </NavLink>
            <NavLink
              to="/llm"
              className={({ isActive }) =>
                isActive ? styles.linkActive : styles.link
              }
            >
              LLM
            </NavLink>
            <NavLink
              to="/import"
              className={({ isActive }) =>
                isActive ? styles.linkActive : styles.link
              }
            >
              Importar
            </NavLink>
          </nav>

          <Box sx={{ flex: 1 }} />

          {/* Logout */}
          <Button
            onClick={handleLogout}
            size="small"
            className={styles.logoutBtn}
            startIcon={<FontAwesomeIcon icon={faRightFromBracket} />}
          >
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
