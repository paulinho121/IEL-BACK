// Carrega o .env uma única vez e centraliza as variáveis usadas pela aplicação
require("./loadEnv")();

module.exports = {
  port: Number(process.env.PORT) || 3333,
  appUrl: (process.env.APP_URL || `http://localhost:${process.env.PORT || 3333}`).replace(/\/$/, ""),
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
