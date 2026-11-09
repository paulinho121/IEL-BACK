// Valida o cabeçalho "Authorization: Bearer <jwt>" nas rotas protegidas
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const HttpError = require("../utils/HttpError");

function auth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(HttpError.unauthorized());
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    // Disponibiliza o usuário logado para os controllers
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(HttpError.unauthorized());
  }
}

module.exports = auth;
