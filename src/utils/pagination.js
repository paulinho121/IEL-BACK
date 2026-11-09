// Interpreta os query params comuns das buscas: limit, page e fields
const HttpError = require("./HttpError");

const DEFAULT_LIMIT = 12;

/**
 * @returns {{ limit: number, page: number, offset: number | undefined, sqlLimit: number | undefined }}
 * limit = -1 busca todos os itens (sem LIMIT/OFFSET no SQL).
 */
function parsePagination(query) {
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);

  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1)) {
    throw HttpError.badRequest("O parâmetro limit deve ser um inteiro positivo ou -1");
  }
  if (!Number.isInteger(page) || page < 1) {
    throw HttpError.badRequest("O parâmetro page deve ser um inteiro maior que zero");
  }

  if (limit === -1) return { limit, page: 1, offset: undefined, sqlLimit: undefined };
  return { limit, page, offset: (page - 1) * limit, sqlLimit: limit };
}

/** Lê "fields=name,slug" e garante que só campos permitidos sejam pedidos. */
function parseFields(fields, allowed) {
  if (fields === undefined || fields === "") return null;
  const list = String(fields)
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const invalid = list.filter((f) => !allowed.includes(f));
  if (invalid.length > 0) {
    throw HttpError.badRequest(`Campos inválidos em fields: ${invalid.join(", ")}`, { allowed });
  }
  return list;
}

/** Mantém só as chaves pedidas em fields (o id sempre volta, para o front conseguir referenciar). */
function pickFields(object, fields) {
  if (!fields) return object;
  return Object.fromEntries(Object.entries(object).filter(([key]) => key === "id" || fields.includes(key)));
}

module.exports = { parsePagination, parseFields, pickFields };
