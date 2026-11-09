"use strict";

/** Requisito 04 - tabela de imagens do produto */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_images", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        // Apagar o produto apaga as imagens dele
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      path: { type: Sequelize.STRING, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_images");
  },
};
