// Pequenas funções de validação reutilizadas pelos services
const HttpError = require("./HttpError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

/** Junta todos os erros encontrados e lança um único 400 com a lista. */
function assertValid(errors) {
  if (errors.length > 0) {
    throw HttpError.badRequest("Dados da requisição inválidos", errors);
  }
}

/** Converte o :id da URL em número inteiro positivo ou lança 400. */
function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw HttpError.badRequest("O id informado deve ser um número inteiro positivo");
  }
  return id;
}

/** Aceita true/false, 1/0 e "true"/"false". Retorna undefined se não for booleano. */
function toBoolean(value) {
  if (value === true || value === 1 || value === "true" || value === "1") return true;
  if (value === false || value === 0 || value === "false" || value === "0") return false;
  return undefined;
}

module.exports = { EMAIL_REGEX, SLUG_REGEX, isNonEmptyString, assertValid, parseId, toBoolean };
