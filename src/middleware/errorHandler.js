// Último middleware da cadeia: converte qualquer erro numa resposta JSON padronizada
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require("sequelize");
const HttpError = require("../utils/HttpError");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.details && { errors: err.details }) });
  }

  // JSON mal formado no corpo da requisição
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "JSON inválido no corpo da requisição" });
  }
  if (err.type === "entity.too.large") {
    return res.status(400).json({ message: "Corpo da requisição grande demais" });
  }

  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {});
    return res.status(400).json({ message: `Já existe um registro com este valor: ${fields.join(", ")}` });
  }
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: "Referência inválida a outro registro" });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ message: "Dados inválidos", errors: err.errors.map((e) => e.message) });
  }

  console.error(err);
  return res.status(500).json({ message: "Erro interno do servidor" });
}

module.exports = errorHandler;
