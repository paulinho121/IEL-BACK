// Regras de negócio dos produtos: busca com filtros, cadastro, edição e remoção
const { Op } = require("sequelize");
const { sequelize, Product, ProductImage, ProductOption, ProductCategory, Category } = require("../models");
const HttpError = require("../utils/HttpError");
const imageStorage = require("../utils/imageStorage");
const { SLUG_REGEX, isNonEmptyString, assertValid, toBoolean } = require("../utils/validators");
const { parsePagination, parseFields, pickFields } = require("../utils/pagination");

const SEARCHABLE_FIELDS = [
  "id",
  "enabled",
  "name",
  "slug",
  "use_in_menu",
  "stock",
  "description",
  "price",
  "price_with_discount",
  "category_ids",
  "images",
  "options",
];
const COLUMNS = SEARCHABLE_FIELDS.filter((f) => !["category_ids", "images", "options"].includes(f));

/* ------------------------------------------------------------------ */
/* Serialização                                                        */
/* ------------------------------------------------------------------ */

/** Converte o model no formato de resposta da documentação. */
function serialize(product) {
  const data = product.get({ plain: true });
  const result = {};
  for (const column of COLUMNS) if (column in data) result[column] = data[column];
  if (data.categories) result.category_ids = data.categories.map((c) => c.id);
  if (data.images) result.images = data.images.map((img) => ({ id: img.id, content: imageStorage.toUrl(img.path) }));
  if (product.options) result.options = product.options.map((option) => option.toJSON());
  return result;
}

/** Includes do Sequelize, carregando só as associações que serão devolvidas. */
function buildIncludes(fields) {
  const wants = (field) => !fields || fields.includes(field);
  const include = [];
  if (wants("images")) include.push({ model: ProductImage, as: "images", attributes: ["id", "path"] });
  if (wants("options")) include.push({ model: ProductOption, as: "options" });
  if (wants("category_ids")) {
    include.push({ model: Category, as: "categories", attributes: ["id"], through: { attributes: [] } });
  }
  return include;
}

/** Ordena produtos e também imagens, opções e categorias incluídas, para a resposta ser sempre igual. */
function buildOrder(include) {
  return [["id", "ASC"], ...include.map((i) => [{ model: i.model, as: i.as }, "id", "ASC"])];
}

/* ------------------------------------------------------------------ */
/* Busca                                                               */
/* ------------------------------------------------------------------ */

function parseIdList(value, name) {
  const ids = String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map(Number);
  if (ids.length === 0 || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw HttpError.badRequest(`${name} deve ser uma lista de ids separados por vírgula (ex.: 15,24)`);
  }
  return ids;
}

/** "100-200" -> { min: 100, max: 200 } */
function parsePriceRange(value) {
  const match = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(String(value).trim());
  if (!match) throw HttpError.badRequest("price-range deve estar no formato min-max (ex.: 100-200)");
  const [min, max] = [Number(match[1]), Number(match[2])];
  if (min > max) throw HttpError.badRequest("Em price-range o valor mínimo não pode ser maior que o máximo");
  return { min, max };
}

/**
 * Lê os filtros option[45]=GG,PP. O Express 5 entrega a chave literal "option[45]";
 * com o parser estendido ela chega como { option: { 45: "GG,PP" } }. Os dois formatos são aceitos.
 */
function parseOptionFilters(query) {
  const filters = [];
  for (const [key, value] of Object.entries(query)) {
    const match = /^option\[(\d+)\]$/.exec(key);
    if (match) filters.push([Number(match[1]), value]);
  }
  if (query.option && typeof query.option === "object") {
    for (const [id, value] of Object.entries(query.option)) filters.push([Number(id), value]);
  }
  return filters.map(([optionId, value]) => {
    const values = String(value)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!Number.isInteger(optionId) || optionId <= 0 || values.length === 0) {
      throw HttpError.badRequest("option deve estar no formato option[ID]=valor1,valor2");
    }
    return { optionId, values };
  });
}

/** Interseção de conjuntos de ids (null = "sem restrição"). */
function intersect(current, ids) {
  if (current === null) return new Set(ids);
  return new Set(ids.filter((id) => current.has(id)));
}

async function search(query = {}) {
  const { limit, page, offset, sqlLimit } = parsePagination(query);
  const fields = parseFields(query.fields, SEARCHABLE_FIELDS);
  const where = {};

  if (isNonEmptyString(query.match)) {
    const term = `%${query.match.trim()}%`;
    where[Op.or] = [{ name: { [Op.like]: term } }, { description: { [Op.like]: term } }];
  }

  if (query["price-range"] !== undefined) {
    const { min, max } = parsePriceRange(query["price-range"]);
    where.price = { [Op.between]: [min, max] };
  }

  // Filtros por tabelas relacionadas viram uma lista de ids permitidos
  let allowedIds = null;

  if (query.category_ids !== undefined) {
    const categoryIds = parseIdList(query.category_ids, "category_ids");
    const links = await ProductCategory.findAll({
      where: { category_id: { [Op.in]: categoryIds } },
      attributes: ["product_id"],
      raw: true,
    });
    allowedIds = intersect(allowedIds, links.map((l) => l.product_id));
  }

  for (const { optionId, values } of parseOptionFilters(query)) {
    const option = await ProductOption.findByPk(optionId, { attributes: ["product_id", "values"], raw: true });
    const available = option ? option.values.split(",").map((v) => v.trim()) : [];
    const matches = values.some((v) => available.includes(v));
    allowedIds = intersect(allowedIds, matches ? [option.product_id] : []);
  }

  if (allowedIds !== null) where.id = { [Op.in]: [...allowedIds] };

  const attributes = fields ? COLUMNS.filter((c) => c === "id" || fields.includes(c)) : COLUMNS;

  // Conta e pagina só os ids, sem joins, e depois carrega as associações da página atual
  const { rows: pageRows, count } = await Product.findAndCountAll({
    where,
    attributes: ["id"],
    order: [["id", "ASC"]],
    limit: sqlLimit,
    offset,
    raw: true,
  });
  const pageIds = pageRows.map((row) => row.id);

  const products = pageIds.length
    ? await Product.findAll({
        where: { id: { [Op.in]: pageIds } },
        attributes,
        include: buildIncludes(fields),
        order: buildOrder(buildIncludes(fields)),
      })
    : [];

  return {
    data: products.map((p) => pickFields(serialize(p), fields)),
    total: count,
    limit,
    page,
  };
}

async function findById(id) {
  const include = buildIncludes(null);
  const product = await Product.findByPk(id, { attributes: COLUMNS, include, order: buildOrder(include) });
  if (!product) throw HttpError.notFound("Produto não encontrado");
  return serialize(product);
}

/* ------------------------------------------------------------------ */
/* Validação do payload                                                */
/* ------------------------------------------------------------------ */

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

/**
 * Valida os campos simples do produto.
 * partial = true (PUT) só valida o que veio no corpo.
 */
function validateProductFields(data, { partial }) {
  const errors = [];
  const values = {};
  const has = (key) => data[key] !== undefined;

  if (!partial || has("name")) {
    if (!isNonEmptyString(data.name)) errors.push("name é obrigatório");
    else values.name = data.name.trim();
  }
  if (!partial || has("slug")) {
    if (!isNonEmptyString(data.slug) || !SLUG_REGEX.test(data.slug)) {
      errors.push("slug é obrigatório e deve ter só letras minúsculas, números e hífens");
    } else values.slug = data.slug;
  }
  if (!partial || has("price")) {
    if (!isNumber(data.price) || data.price < 0) errors.push("price é obrigatório e deve ser um número >= 0");
    else values.price = data.price;
  }
  if (!partial || has("price_with_discount")) {
    if (!isNumber(data.price_with_discount) || data.price_with_discount < 0) {
      errors.push("price_with_discount é obrigatório e deve ser um número >= 0");
    } else values.price_with_discount = data.price_with_discount;
  }
  for (const key of ["enabled", "use_in_menu"]) {
    if (has(key)) {
      const bool = toBoolean(data[key]);
      if (bool === undefined) errors.push(`${key} deve ser booleano`);
      else values[key] = bool;
    }
  }
  if (has("stock")) {
    if (!Number.isInteger(data.stock) || data.stock < 0) errors.push("stock deve ser um inteiro >= 0");
    else values.stock = data.stock;
  }
  if (has("description")) {
    if (data.description !== null && typeof data.description !== "string") errors.push("description deve ser texto");
    else values.description = data.description;
  }
  if (has("category_ids")) {
    if (!Array.isArray(data.category_ids) || data.category_ids.some((id) => !Number.isInteger(id) || id <= 0)) {
      errors.push("category_ids deve ser uma lista de ids");
    }
  }
  if (has("images") && !Array.isArray(data.images)) errors.push("images deve ser uma lista");
  if (has("options") && !Array.isArray(data.options)) errors.push("options deve ser uma lista");

  return { errors, values };
}

/** "4px" ou 4 -> 4 */
function parseRadius(value) {
  const radius = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(radius) && radius >= 0 ? radius : undefined;
}

/**
 * Normaliza uma opção do produto. A documentação usa ora "value" ora "values",
 * então os dois nomes são aceitos, como array ou texto separado por vírgula.
 */
function normalizeOption(option, { partial }) {
  const errors = [];
  const values = {};
  const has = (key) => option[key] !== undefined;

  if (!partial || has("title")) {
    if (!isNonEmptyString(option.title)) errors.push("title da opção é obrigatório");
    else values.title = option.title.trim();
  }
  if (has("shape")) {
    if (!["square", "circle"].includes(option.shape)) errors.push("shape deve ser square ou circle");
    else values.shape = option.shape;
  }
  if (has("type")) {
    if (!["text", "color"].includes(option.type)) errors.push("type deve ser text ou color");
    else values.type = option.type;
  }
  if (has("radius")) {
    const radius = parseRadius(option.radius);
    if (radius === undefined) errors.push("radius deve ser um número em pixels (ex.: 4 ou \"4px\")");
    else values.radius = radius;
  }

  const rawValues = option.values ?? option.value;
  if (!partial || rawValues !== undefined) {
    const list = (Array.isArray(rawValues) ? rawValues : String(rawValues ?? "").split(","))
      .map((v) => String(v).trim())
      .filter(Boolean);
    if (list.length === 0) errors.push("values da opção deve ter pelo menos um valor");
    else if (list.some((v) => v.includes(","))) errors.push("os valores da opção não podem conter vírgula");
    else values.values = list.join(",");
  }

  return { errors, values };
}

async function ensureCategoriesExist(categoryIds, transaction) {
  const unique = [...new Set(categoryIds)];
  const found = await Category.count({ where: { id: { [Op.in]: unique } }, transaction });
  if (found !== unique.length) throw HttpError.badRequest("Uma ou mais categorias em category_ids não existem");
  return unique;
}

/* ------------------------------------------------------------------ */
/* Criação, edição e remoção                                           */
/* ------------------------------------------------------------------ */

/**
 * Executa o trabalho numa transação. Se algo falhar, desfaz o banco
 * e apaga as imagens que já tinham sido gravadas em disco.
 */
async function withTransaction(work) {
  const savedFiles = [];
  const filesToRemove = [];
  try {
    const result = await sequelize.transaction((transaction) => work({ transaction, savedFiles, filesToRemove }));
    // Só apaga arquivos antigos depois que o banco confirmou a alteração
    await Promise.all(filesToRemove.map((file) => imageStorage.remove(file)));
    return result;
  } catch (error) {
    await Promise.all(savedFiles.map((file) => imageStorage.remove(file)));
    throw error;
  }
}

async function create(data = {}) {
  const { errors, values } = validateProductFields(data, { partial: false });
  const options = (Array.isArray(data.options) ? data.options : []).map((o) => normalizeOption(o ?? {}, { partial: false }));
  options.forEach((o, i) => o.errors.forEach((e) => errors.push(`options[${i}]: ${e}`)));
  assertValid(errors);

  const id = await withTransaction(async ({ transaction, savedFiles }) => {
    const product = await Product.create(values, { transaction });

    if (data.category_ids?.length) {
      const categoryIds = await ensureCategoriesExist(data.category_ids, transaction);
      await ProductCategory.bulkCreate(
        categoryIds.map((categoryId) => ({ product_id: product.id, category_id: categoryId })),
        { transaction },
      );
    }

    for (const image of data.images ?? []) {
      const path = await saveImage(product.id, image);
      savedFiles.push(path);
      await ProductImage.create({ product_id: product.id, path, enabled: true }, { transaction });
    }

    if (options.length) {
      await ProductOption.bulkCreate(
        options.map((o) => ({ ...o.values, product_id: product.id })),
        { transaction },
      );
    }

    return product.id;
  });

  return findById(id);
}

/** Uma imagem nova pode vir em base64 ({ type, content }) ou já como URL externa. */
async function saveImage(productId, image = {}) {
  if (imageStorage.isUrl(image.content)) return image.content;
  return imageStorage.save(productId, image);
}

async function update(id, data = {}) {
  const { errors, values } = validateProductFields(data, { partial: true });
  assertValid(errors);

  const product = await Product.findByPk(id);
  if (!product) throw HttpError.notFound("Produto não encontrado");

  await withTransaction(async ({ transaction, savedFiles, filesToRemove }) => {
    if (Object.keys(values).length) await product.update(values, { transaction });

    if (data.category_ids !== undefined) {
      const categoryIds = await ensureCategoriesExist(data.category_ids, transaction);
      await ProductCategory.destroy({ where: { product_id: id }, transaction });
      await ProductCategory.bulkCreate(
        categoryIds.map((categoryId) => ({ product_id: id, category_id: categoryId })),
        { transaction },
      );
    }

    if (data.images !== undefined) {
      await updateImages(id, data.images, { transaction, savedFiles, filesToRemove });
    }
    if (data.options !== undefined) {
      await updateOptions(id, data.options, transaction);
    }
  });
}

/**
 * Aplica a lista de imagens do PUT:
 * - { id, deleted: true }  remove a imagem
 * - { id, content: URL }   mantém a imagem como está
 * - { id, content: base64 } troca o arquivo da imagem
 * - { type, content }      adiciona uma imagem nova
 */
async function updateImages(productId, images, { transaction, savedFiles, filesToRemove }) {
  const current = await ProductImage.findAll({ where: { product_id: productId }, transaction });
  const byId = new Map(current.map((img) => [img.id, img]));

  for (const [index, image] of images.entries()) {
    if (!image || typeof image !== "object") throw HttpError.badRequest(`images[${index}] inválida`);

    if (image.id === undefined) {
      const path = await saveImage(productId, image);
      savedFiles.push(path);
      await ProductImage.create({ product_id: productId, path, enabled: true }, { transaction });
      continue;
    }

    const existing = byId.get(image.id);
    if (!existing) throw HttpError.badRequest(`A imagem ${image.id} não pertence a este produto`);

    if (image.deleted === true) {
      filesToRemove.push(existing.path);
      await existing.destroy({ transaction });
    } else if (image.content !== undefined && !imageStorage.isUrl(image.content)) {
      // Sem "type" no payload, mantém a extensão do arquivo atual
      const type = image.type ?? `image/${existing.path.split(".").pop().replace("jpg", "jpeg")}`;
      const path = await imageStorage.save(productId, { type, content: image.content });
      savedFiles.push(path);
      filesToRemove.push(existing.path);
      await existing.update({ path }, { transaction });
    }
  }
}

/**
 * Aplica a lista de opções do PUT:
 * - { id, deleted: true } remove a opção
 * - { id, ...campos }     altera só os campos enviados
 * - { title, ... }        cria uma opção nova
 */
async function updateOptions(productId, options, transaction) {
  const current = await ProductOption.findAll({ where: { product_id: productId }, transaction });
  const byId = new Map(current.map((option) => [option.id, option]));

  for (const [index, option] of options.entries()) {
    if (!option || typeof option !== "object") throw HttpError.badRequest(`options[${index}] inválida`);
    const isNew = option.id === undefined;
    const existing = isNew ? null : byId.get(option.id);
    if (!isNew && !existing) throw HttpError.badRequest(`A opção ${option.id} não pertence a este produto`);

    if (existing && option.deleted === true) {
      await existing.destroy({ transaction });
      continue;
    }

    const { errors, values } = normalizeOption(option, { partial: !isNew });
    assertValid(errors.map((e) => `options[${index}]: ${e}`));

    if (isNew) await ProductOption.create({ ...values, product_id: productId }, { transaction });
    else await existing.update(values, { transaction });
  }
}

async function remove(id) {
  const product = await Product.findByPk(id);
  if (!product) throw HttpError.notFound("Produto não encontrado");

  const images = await ProductImage.findAll({ where: { product_id: id }, attributes: ["path"], raw: true });
  // Apaga as dependências explicitamente (o banco também tem ON DELETE CASCADE como garantia)
  await sequelize.transaction(async (transaction) => {
    await ProductImage.destroy({ where: { product_id: id }, transaction });
    await ProductOption.destroy({ where: { product_id: id }, transaction });
    await ProductCategory.destroy({ where: { product_id: id }, transaction });
    await product.destroy({ transaction });
  });

  await Promise.all(images.map((img) => imageStorage.remove(img.path)));
  await imageStorage.removeProductFolder(id);
}

module.exports = { search, findById, create, update, remove };
