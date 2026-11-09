"use strict";

/** Requisito 05 - tabela de opções do produto */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_options", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      title: { type: Sequelize.STRING, allowNull: false },
      shape: { type: Sequelize.ENUM("square", "circle"), allowNull: false, defaultValue: "square" },
      radius: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      type: { type: Sequelize.ENUM("text", "color"), allowNull: false, defaultValue: "text" },
      values: { type: Sequelize.STRING, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_options");
  },
};
