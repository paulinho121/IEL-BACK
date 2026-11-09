const { DataTypes, Model } = require("sequelize");

class Category extends Model {
  static associate(models) {
    Category.belongsToMany(models.Product, {
      through: models.ProductCategory,
      foreignKey: "category_id",
      otherKey: "product_id",
      as: "products",
    });
  }
}

module.exports = (sequelize) =>
  Category.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, modelName: "Category", tableName: "categories" },
  );
