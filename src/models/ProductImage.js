const { DataTypes, Model } = require("sequelize");

class ProductImage extends Model {
  static associate(models) {
    ProductImage.belongsTo(models.Product, { foreignKey: "product_id", as: "product" });
  }
}

module.exports = (sequelize) =>
  ProductImage.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // Caminho relativo do arquivo salvo no servidor (ex.: media/product-1/abc.png)
      path: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, modelName: "ProductImage", tableName: "product_images", timestamps: false },
  );
