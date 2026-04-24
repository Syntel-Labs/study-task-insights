import { useState, useMemo, useCallback } from "react";

/** Manages tasks filter state: applied filters, draft filters, pagination and sort */
export function useTasksFilters() {
  const [q, setQ] = useState("");
  const [statusId, setStatusId] = useState(null);
  const [priorityId, setPriorityId] = useState(null);
  const [typeId, setTypeId] = useState(null);
  const [termId, setTermId] = useState(null);
  const [tagIds, setTagIds] = useState([]);
  const [dueFrom, setDueFrom] = useState(null);
  const [dueTo, setDueTo] = useState(null);
  const [archived, setArchived] = useState(false);
  const [sortBy, setSortBy] = useState("dueAt");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Draft filters (not yet applied)
  const [draft, setDraft] = useState({
    statusId: null, priorityId: null, typeId: null,
    termId: null, tagIds: [], dueFrom: null, dueTo: null,
  });

  const syncDraftFromApplied = useCallback(() => {
    setDraft({ statusId, priorityId, typeId, termId, tagIds, dueFrom, dueTo });
  }, [statusId, priorityId, typeId, termId, tagIds, dueFrom, dueTo]);

  const applyFilters = useCallback(() => {
    setStatusId(draft.statusId);
    setPriorityId(draft.priorityId);
    setTypeId(draft.typeId);
    setTermId(draft.termId);
    setTagIds(draft.tagIds);
    setDueFrom(draft.dueFrom);
    setDueTo(draft.dueTo);
    setPage(1);
  }, [draft]);

  const clearDraft = useCallback(() => {
    setDraft({ statusId: null, priorityId: null, typeId: null, termId: null, tagIds: [], dueFrom: null, dueTo: null });
  }, []);

  const handleSort = useCallback((field) => {
    setSortBy((curr) => {
      if (curr === field) {
        setSortOrder((d) => (d === "asc" ? "desc" : "asc"));
        return curr;
      }
      setSortOrder("asc");
      return field;
    });
  }, []);

  const apiQuery = useMemo(() => {
    const params = {
      include: "all",
      pageSize,
      page,
      sortBy,
      sortOrder,
      archived: archived ? "true" : "false",
    };
    if (q?.trim()) params.q = q.trim();
    if (statusId) params.statusId = statusId;
    if (priorityId) params.priorityId = priorityId;
    if (typeId) params.typeId = typeId;
    if (termId) params.termId = termId;
    if (tagIds?.length) params.tagId = tagIds.map(String);
    if (dueFrom) params.dueFrom = dueFrom;
    if (dueTo) params.dueTo = dueTo;
    return params;
  }, [q, statusId, priorityId, typeId, termId, tagIds, dueFrom, dueTo, archived, page, pageSize, sortBy, sortOrder]);

  return {
    q, setQ,
    archived, setArchived,
    sortBy, sortOrder, handleSort,
    page, setPage, pageSize, setPageSize,
    draft, setDraft,
    syncDraftFromApplied, applyFilters, clearDraft,
    apiQuery,
  };
}
