// Carrega as variáveis do arquivo .env (ou de outro arquivo indicado em ENV_FILE, ex.: .env.production)
const path = require("path");
const dotenv = require("dotenv");

let loaded = false;

module.exports = function loadEnv() {
  if (loaded) return;
  loaded = true;
  dotenv.config({ path: path.resolve(process.env.ENV_FILE || ".env"), quiet: true });
};
