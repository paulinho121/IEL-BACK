const { DataTypes, Model } = require("sequelize");

class Product extends Model {
  static associate(models) {
    Product.hasMany(models.ProductImage, { foreignKey: "product_id", as: "images" });
    Product.hasMany(models.ProductOption, { foreignKey: "product_id", as: "options" });
    Product.belongsToMany(models.Category, {
      through: models.ProductCategory,
      foreignKey: "product_id",
      otherKey: "category_id",
      as: "categories",
    });
  }
}

module.exports = (sequelize) =>
  Product.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      description: { type: DataTypes.STRING },
      price: { type: DataTypes.FLOAT, allowNull: false },
      price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
    },
    { sequelize, modelName: "Product", tableName: "products" },
  );
