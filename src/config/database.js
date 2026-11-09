// Configuração do Sequelize, usada tanto pela aplicação quanto pelo sequelize-cli (migrations e seeders)
require("dotenv").config({ quiet: true });

const common = {
  define: {
    // created_at / updated_at e colunas em snake_case
    underscored: true,
    timestamps: true,
  },
  logging: false,
};

const mysql = {
  ...common,
  dialect: "mysql",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || "digital_store",
};

module.exports = {
  development: mysql,
  production: mysql,
  // Os testes rodam num SQLite em memória: não precisam de um MySQL instalado
  test: {
    ...common,
    dialect: "sqlite",
    storage: ":memory:",
  },
};
