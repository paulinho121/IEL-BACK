const { DataTypes, Model } = require("sequelize");

class ProductOption extends Model {
  static associate(models) {
    ProductOption.belongsTo(models.Product, { foreignKey: "product_id", as: "product" });
  }

  /** Devolve "values" como array, que é como o front consome. */
  toJSON() {
    const data = this.get();
    return { ...data, values: data.values ? data.values.split(",") : [] };
  }
}

module.exports = (sequelize) =>
  ProductOption.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      shape: { type: DataTypes.ENUM("square", "circle"), allowNull: false, defaultValue: "square" },
      radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      type: { type: DataTypes.ENUM("text", "color"), allowNull: false, defaultValue: "text" },
      // Todas as opções separadas por vírgula, como pede a documentação
      values: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, modelName: "ProductOption", tableName: "product_options", timestamps: false },
  );
