import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@context/AuthContext.jsx";
import styles from "@styles/login-page.module.scss";

export default function LoginPage() {
  const { login, loading, isAuthenticated } = useAuth();
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [fieldTouched, setFieldTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);
  const inputRef = useRef(null);
  const isEmptyError = fieldTouched && !secret.trim();

  // Marca el campo como tocado para mostrar validación básica
  function handleBlur() {
    setFieldTouched(true);
  }

  // Alterna visibilidad de la clave sin perder el foco ni la selección
  function handleToggleShow() {
    const el = inputRef.current;
    const start = el?.selectionStart ?? null;
    const end = el?.selectionEnd ?? null;

    setShowSecret((v) => !v);

    requestAnimationFrame(() => {
      const node = inputRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      if (start !== null && end !== null) {
        try {
          node.setSelectionRange(start, end);
        } catch {}
      }
    });
  }

  // Envía la clave para autenticación
  async function handleSubmit(e) {
    e.preventDefault();
    if (!secret.trim()) {
      setFieldTouched(true);
      return;
    }

    try {
      setSubmitting(true);
      await login(secret.trim());
      Swal.fire("Acceso concedido", "Inicio de sesión exitoso", "success");
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.payload?.message || err.message || "Error de autenticación";
      Swal.fire("Error", msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm" className={styles.loginContainer}>
      <Paper elevation={3} className={styles.loginCard}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          className={styles.loginForm}
          noValidate
        >
          <Typography
            variant="h5"
            className={styles.loginSubtitle}
            sx={{
              fontFamily: "var(--font-family-base, inherit)",
              fontWeight: "bold",
            }}
          >
            Ingresa la clave para continuar
          </Typography>

          {/* Campo de clave con toggle de visibilidad */}
          <TextField
            id="secret"
            type={showSecret ? "text" : "password"}
            label="Clave de acceso"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onBlur={handleBlur}
            disabled={submitting || loading}
            autoFocus
            fullWidth
            required
            margin="normal"
            autoComplete="current-password"
            error={isEmptyError}
            helperText={isEmptyError ? "Este campo es obligatorio" : " "}
            inputRef={inputRef}
            InputLabelProps={{ className: styles.inputLabel }}
            FormHelperTextProps={{ className: styles.helperText }}
            InputProps={{
              className: styles.inputRoot,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showSecret ? "Ocultar clave" : "Mostrar clave"}
                    disabled={submitting || loading}
                    onClick={handleToggleShow}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    size="small"
                  >
                    <FontAwesomeIcon
                      icon={showSecret ? faEyeSlash : faEye}
                      className={styles.toggleIcon}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              fontFamily: "var(--font-family-base, inherit)",
              "& .MuiInputBase-input": { color: "var(--input-text)" },
              "& .MuiInputLabel-root": { color: "var(--color-text-muted)" },
            }}
          />

          {/* Botón principal de ingreso */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting || loading}
            className={styles.loginSubmit}
            sx={{
              bgcolor: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
              fontFamily: "var(--font-family-base, inherit)",
            }}
          >
            {submitting ? "Verificando..." : "Ingresar"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
