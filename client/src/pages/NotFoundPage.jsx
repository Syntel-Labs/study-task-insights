import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button } from "@mui/material";
import styles from "@styles/not-found.module.scss";

export default function NotFoundPage() {
  const navigate = useNavigate();
  function handleBack() {
    navigate("/");
  }

  return (
    <Box className={styles.bg}>
      <Container maxWidth="md" disableGutters>
        <div className={styles.content}>
          <img
            src="/assets/images/404-illustration.png"
            alt="Ilustración de página no encontrada"
            className={styles.image}
          />

          <Typography variant="h6" className={styles.message}>
            La página que intentas acceder no existe o fue movida.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={handleBack}
            className={styles.backButton}
            sx={{
              bgcolor: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              "&:hover": { bgcolor: "var(--btn-primary-bg-hover)" },
              fontFamily: "var(--font-family-base, inherit)",
            }}
          >
            Volver al inicio
          </Button>
        </div>
      </Container>
    </Box>
  );
}
