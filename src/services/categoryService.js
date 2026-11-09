// Regras de negócio das categorias
const { Category } = require("../models");
const HttpError = require("../utils/HttpError");
const { SLUG_REGEX, isNonEmptyString, assertValid, toBoolean } = require("../utils/validators");
const { parsePagination, parseFields } = require("../utils/pagination");

const PUBLIC_FIELDS = ["id", "name", "slug", "use_in_menu"];

function validate(data) {
  const errors = [];
  if (!isNonEmptyString(data.name)) errors.push("name é obrigatório");
  if (!isNonEmptyString(data.slug) || !SLUG_REGEX.test(data.slug)) {
    errors.push("slug é obrigatório e deve ter só letras minúsculas, números e hífens (ex.: black-friday)");
  }
  if (data.use_in_menu !== undefined && toBoolean(data.use_in_menu) === undefined) {
    errors.push("use_in_menu deve ser booleano");
  }
  assertValid(errors);
  return {
    name: data.name.trim(),
    slug: data.slug,
    use_in_menu: toBoolean(data.use_in_menu) ?? false,
  };
}

async function search(query = {}) {
  const { limit, page, offset, sqlLimit } = parsePagination(query);
  const fields = parseFields(query.fields, PUBLIC_FIELDS);

  const where = {};
  if (query.use_in_menu !== undefined) {
    const useInMenu = toBoolean(query.use_in_menu);
    if (useInMenu === undefined) throw HttpError.badRequest("use_in_menu deve ser true ou false");
    where.use_in_menu = useInMenu;
  }

  const { rows, count } = await Category.findAndCountAll({
    where,
    // Busca no banco só as colunas pedidas, mais o id
    attributes: fields ? Array.from(new Set(["id", ...fields])) : PUBLIC_FIELDS,
    order: [["id", "ASC"]],
    limit: sqlLimit,
    offset,
  });

  return { data: rows, total: count, limit, page };
}

async function findById(id) {
  const category = await Category.findByPk(id, { attributes: PUBLIC_FIELDS });
  if (!category) throw HttpError.notFound("Categoria não encontrada");
  return category;
}

async function create(data = {}) {
  const category = await Category.create(validate(data));
  return findById(category.id);
}

async function update(id, data = {}) {
  const values = validate(data);
  const category = await findById(id);
  await category.update(values);
}

async function remove(id) {
  const category = await findById(id);
  await category.destroy();
}

module.exports = { search, findById, create, update, remove };
