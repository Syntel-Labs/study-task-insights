import React, { useState } from "react";
import { Paper, Stack, Typography, Button, TextField } from "@mui/material";
import { useImportApi } from "@utils/apiResources";
import Swal from "sweetalert2";

export default function ImportPage() {
  const { batch } = useImportApi();
  const [json, setJson] = useState(
    '{\n  "tasks": [],\n  "assignments": [],\n  "sessions": []\n}'
  );

  async function handleImport() {
    try {
      const payload = JSON.parse(json);
      await batch(payload);
      Swal.fire("OK", "Importación completada", "success");
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Importación masiva</Typography>
      <Paper sx={{ p: 2 }}>
        <TextField
          label="JSON"
          multiline
          minRows={12}
          fullWidth
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        <Button sx={{ mt: 2 }} variant="contained" onClick={handleImport}>
          Enviar
        </Button>
      </Paper>
    </Stack>
  );
}
