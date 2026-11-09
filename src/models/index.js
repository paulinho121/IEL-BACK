// Cria a conexão com o banco, registra os models e monta os relacionamentos
const { Sequelize } = require("sequelize");
const configs = require("../config/database");

const env = process.env.NODE_ENV || "development";
const config = configs[env];

const sequelize = config.dialect === "sqlite"
  ? new Sequelize({ ...config })
  : new Sequelize(config.database, config.username, config.password, config);

const models = {
  User: require("./User")(sequelize),
  Category: require("./Category")(sequelize),
  Product: require("./Product")(sequelize),
  ProductImage: require("./ProductImage")(sequelize),
  ProductOption: require("./ProductOption")(sequelize),
  ProductCategory: require("./ProductCategory")(sequelize),
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") model.associate(models);
});

module.exports = { sequelize, Sequelize, ...models };
