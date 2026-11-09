const { DataTypes, Model } = require("sequelize");

/** Tabela de ligação N:N entre produtos e categorias. */
class ProductCategory extends Model {}

module.exports = (sequelize) =>
  ProductCategory.init(
    {
      product_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      category_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    },
    { sequelize, modelName: "ProductCategory", tableName: "product_category", timestamps: false },
  );
