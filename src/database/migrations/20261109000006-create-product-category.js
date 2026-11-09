"use strict";

/** Requisito 06 - tabela de ligação entre produtos e categorias */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_category", {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "categories", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    });
    // A chave primária já cobre buscas por product_id; este índice cobre o filtro "category_ids"
    await queryInterface.addIndex("product_category", ["category_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("product_category");
  },
};
