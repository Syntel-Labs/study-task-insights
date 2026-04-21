/** Successful response with optional data and meta */
export const ok = (res, code, data, meta, status = 200) => {
  const body = { code, message: code };
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
};

/** 201 Created response */
export const created = (res, code, data) =>
  res.status(201).json({ code, message: code, data });

/** 204 No Content response */
export const noContent = (res) => res.status(204).end();

/** Build pagination meta object */
export const paginationMeta = (page, pageSize, totalItems) => ({
  pagination: {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  },
});
