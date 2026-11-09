// Configuração do Sequelize, usada tanto pela aplicação quanto pelo sequelize-cli (migrations e seeders)
const fs = require("fs");
const loadEnv = require("./loadEnv");

loadEnv();

const common = {
  define: {
    // created_at / updated_at e colunas em snake_case
    underscored: true,
    timestamps: true,
  },
  logging: false,
};

/**
 * Certificado da autoridade do banco hospedado (a Aiven usa um certificado próprio).
 * Vem do conteúdo em DB_SSL_CA ou de um arquivo em DB_SSL_CA_FILE.
 */
function readCa() {
  if (process.env.DB_SSL_CA) return process.env.DB_SSL_CA.replace(/\\n/g, "\n");
  if (process.env.DB_SSL_CA_FILE) return fs.readFileSync(process.env.DB_SSL_CA_FILE, "utf8");
  return null;
}

/**
 * Dados de conexão do MySQL. Aceita DATABASE_URL (formato mysql://usuario:senha@host:porta/banco,
 * como a Aiven fornece) ou as variáveis separadas DB_HOST, DB_USER etc.
 */
function mysqlConfig() {
  const ca = readCa();
  const ssl = ca ? { dialectOptions: { ssl: { ca, rejectUnauthorized: true } } } : {};

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      ...common,
      ...ssl,
      dialect: "mysql",
      host: url.hostname,
      port: Number(url.port) || 3306,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, "") || "defaultdb",
      // Em hospedagem serverless cada instância abre poucas conexões
      pool: { max: 3, min: 0, idle: 10000 },
    };
  }

  return {
    ...common,
    ...ssl,
    dialect: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "digital_store",
  };
}

module.exports = {
  development: mysqlConfig(),
  production: mysqlConfig(),
  // Os testes rodam num SQLite em memória: não precisam de um MySQL instalado
  test: {
    ...common,
    dialect: "sqlite",
    storage: ":memory:",
  },
};
