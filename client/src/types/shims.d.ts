declare module "*.css";
declare module "*.scss";

declare module "@context/AuthContext.jsx" {
  export function useAuth(): {
    isAuthenticated: boolean;
    loading: boolean;
    login: (secret: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshSession: (opts?: { silent?: boolean }) => Promise<void>;
  };
  export function AuthProvider(props: { children: React.ReactNode }): JSX.Element;
}

declare module "@hooks/api" {
  type ApiResponse<T = unknown> = { code?: number; message?: string; data?: T; items?: unknown[]; meta?: { pagination?: { totalItems?: number } } };
  export function useHealthApi(): {
    check: () => Promise<ApiResponse>;
  };
  export function useGateApi(): {
    login: (body: { secret: string }) => Promise<ApiResponse>;
    logout: () => Promise<ApiResponse>;
  };
  export function useTasksApi(): {
    list: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    get: (id: number | string) => Promise<ApiResponse<unknown>>;
    create: (body: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    update: (id: number | string, body: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    remove: (id: number | string) => Promise<ApiResponse<unknown>>;
    bulkDelete: (ids: Array<number | string>) => Promise<ApiResponse<unknown>>;
  };
  export function useCatalogsApi(): {
    listStatuses: () => Promise<ApiResponse<unknown>>;
    listPriorities: () => Promise<ApiResponse<unknown>>;
    listTypes: () => Promise<ApiResponse<unknown>>;
    listTerms: () => Promise<ApiResponse<unknown>>;
    listTags: () => Promise<ApiResponse<unknown>>;
  };
  type CatalogCrud = {
    list: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown> & { items?: unknown[] }>;
    create: (body: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    update: (body: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    remove: (ids: Array<string | number>) => Promise<ApiResponse<unknown>>;
  };
  export function useCatalogsCrud(): {
    taskStatuses: CatalogCrud;
    taskPriorities: CatalogCrud;
    taskTypes: CatalogCrud;
    terms: CatalogCrud;
    taskTags: CatalogCrud;
  };
  export function useLlmApi(): {
    ping?: () => Promise<ApiResponse<unknown>>;
    analyze?: (body: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    suggest?: (body: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    recommendations: (body: Record<string, unknown>) => Promise<ApiResponse<{ text?: string }>>;
    chat: (messages: Array<{ role: string; content: string }>) => Promise<ApiResponse<{ text?: string }>>;
  };
  export function useWeeklyProductivityApi(): {
    list: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    refresh: (body?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
  };
  export function useStudySessionsApi(): {
    list: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
  };
  export function useImportBatchApi(): {
    run: (body: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
  };
  export function useTaskTagAssignmentsApi(): {
    list: (params?: Record<string, unknown>) => Promise<ApiResponse<unknown>>;
    listByTask: (params: { taskId: string }) => Promise<{ items?: unknown[] } & Record<string, unknown>>;
    add: (body: { taskId: string; taskTagId: string }) => Promise<ApiResponse<unknown>>;
    remove: (body: { ids: string[] }) => Promise<ApiResponse<unknown>>;
  };
}

declare module "@hooks/api/tasks" {
  export * from "@hooks/api";
}

declare module "@hooks/api/taskTagAssignments" {
  export * from "@hooks/api";
}

declare module "@hooks/api/catalogs" {
  export * from "@hooks/api";
}

declare module "@hooks/api/llm" {
  export * from "@hooks/api";
}

declare module "@hooks/useTasksFilters" {
  type Draft = {
    statusId: string | null;
    priorityId: string | null;
    typeId: string | null;
    termId: string | null;
    tagIds: string[];
    dueFrom: string | null;
    dueTo: string | null;
  };
  export function useTasksFilters(): {
    q: string;
    setQ: (v: string) => void;
    archived: boolean;
    setArchived: (v: boolean) => void;
    sortBy: string;
    sortOrder: "asc" | "desc";
    handleSort: (field: string) => void;
    page: number;
    setPage: (n: number) => void;
    pageSize: number;
    setPageSize: (n: number) => void;
    draft: Draft;
    setDraft: (fn: Draft | ((d: Draft) => Draft)) => void;
    syncDraftFromApplied: () => void;
    applyFilters: () => void;
    clearDraft: () => void;
    apiQuery: Record<string, unknown>;
  };
}

declare module "@hooks/useTasksMutations" {
  type ApiLike = {
    list: (params?: Record<string, unknown>) => Promise<unknown>;
    create?: (body: Record<string, unknown>) => Promise<unknown>;
    update?: (id: string | number, body: Record<string, unknown>) => Promise<unknown>;
    remove?: (id: string | number) => Promise<unknown>;
    bulkDelete?: (ids: Array<string | number>) => Promise<unknown>;
  };
  export function useTasksMutations(args: {
    tasksApi: ApiLike;
    tagAssignApi: unknown;
    onRefresh: () => Promise<void> | void;
  }): {
    mutating: boolean;
    handleCreate: (payload: Record<string, unknown>) => Promise<boolean>;
    handleUpdate: (payload: Record<string, unknown>, id?: string) => Promise<boolean>;
    completeOne: (task: { id?: string; taskId?: string }, opts?: { actualMin?: number }) => Promise<void>;
    archiveOne: (task: { id?: string }) => Promise<void>;
    deleteOne: (task: { id?: string; taskId?: string }) => Promise<void>;
    bulkComplete: (ids: Set<string> | string[], opts?: { actualMin?: number }) => Promise<void>;
    bulkDelete: (ids: Set<string> | string[]) => Promise<void>;
    bulkChangeStatus: (ids: Set<string> | string[], statusId: string, statuses: unknown[]) => Promise<void>;
  };
}
