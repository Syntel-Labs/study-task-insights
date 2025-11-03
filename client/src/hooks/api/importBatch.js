import { apiPaths } from "@utils/config";
import { useApi } from "@hooks/useApi";

/** Hook para importaciones por lote */
export function useImportApi() {
  const { post } = useApi();

  // envia payload al endpoint /api/import/batch
  const batch = (payload) => post(apiPaths.importBatch, payload);

  return { batch };
}
