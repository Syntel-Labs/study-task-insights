import { apiPaths } from "@utils/config";
import { useApi } from "@hooks/useApi";

/** Hook para interacción con el modelo LLM */
export function useLlmApi() {
  const { get, post } = useApi();
  const base = apiPaths.llm;

  // obtiene recomendaciones desde /api/llm/recommendations
  const recommendations = (q) => get(`${base}/recommendations`, q);

  // envía mensajes al endpoint /api/llm/chat para interacción tipo chat
  const chat = (messages) => post(`${base}/chat`, { messages });

  return { recommendations, chat };
}
