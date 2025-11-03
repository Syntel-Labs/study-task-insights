import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@context/AuthContext.jsx";
import styles from "@styles/route-guard.module.scss";

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  const loc = useLocation();

  if (loading)
    return (
      <Box className={styles.guardContainer}>
        <CircularProgress />
      </Box>
    );

  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: loc }} />;

  return <Outlet />;
}
