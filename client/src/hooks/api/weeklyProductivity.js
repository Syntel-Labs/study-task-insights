import { apiPaths } from "@utils/config";
import { useApi } from "@hooks/useApi";

export function useWeeklyProductivityApi() {
  const { get, post } = useApi();
  const base = apiPaths.weeklyProductivity;

  return {
    list: (q) => get(base, q),
    refresh: (q) => post(`${base}/refresh`, q ?? {}),
  };
}
