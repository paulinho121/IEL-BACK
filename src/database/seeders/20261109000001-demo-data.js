"use strict";

// Dados de exemplo: um usuário administrador, as categorias e os produtos usados no front-end
const bcrypt = require("bcryptjs");

const now = new Date();

const categories = [
  { id: 1, name: "Tênis", slug: "tenis", use_in_menu: true },
  { id: 2, name: "Esporte e lazer", slug: "esporte-lazer", use_in_menu: true },
  { id: 3, name: "Casual", slug: "casual", use_in_menu: true },
  { id: 4, name: "Utilitário", slug: "utilitario", use_in_menu: false },
  { id: 5, name: "Corrida", slug: "corrida", use_in_menu: true },
  { id: 6, name: "Ofertas", slug: "ofertas", use_in_menu: false },
];

// [nome, preço, preço com desconto, id da categoria de estilo]
const products = [
  ["K-Swiss V8 - Masculino", 200, 100, 2],
  ["Tênis Nike Revolution 6 Next Nature Masculino", 219, 219, 5],
  ["Air Jordan 1 Mid - Unissex", 899.9, 749.9, 3],
  ["Adidas Superstar - Feminino", 499.99, 399.99, 3],
  ["Puma Suede Classic - Unissex", 349.9, 349.9, 3],
  ["Balenciaga Triple S - Masculino", 5999, 4799, 4],
  ["Adidas Ultraboost 22 - Masculino", 999.99, 699.99, 5],
  ["Nike Air Max 90 - Feminino", 799.99, 799.99, 2],
  ["K-Swiss Court Express - Feminino", 279.9, 199.9, 2],
  ["Puma RS-X - Masculino", 649.9, 649.9, 5],
  ["Balenciaga Speed - Feminino", 4299, 4299, 4],
  ["Adidas Forum Low - Unissex", 599.99, 479.99, 3],
  ["Nike Pegasus 40 - Masculino", 899.99, 629.99, 5],
  ["K-Swiss Classic VN - Unissex", 329.9, 329.9, 3],
  ["Puma Cali Dream - Feminino", 499.9, 349.9, 2],
];

const slugify = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        firstname: "Admin",
        surname: "Digital Store",
        email: "admin@digitalstore.com",
        password: await bcrypt.hash("admin123", 10),
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert(
      "categories",
      categories.map((c) => ({ ...c, created_at: now, updated_at: now })),
    );

    await queryInterface.bulkInsert(
      "products",
      products.map(([name, price, discount], i) => ({
        id: i + 1,
        enabled: true,
        name,
        slug: slugify(name),
        use_in_menu: false,
        stock: 10 + i,
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        price,
        price_with_discount: discount,
        created_at: now,
        updated_at: now,
      })),
    );

    // Cada produto: miniatura + as 5 imagens da galeria
    await queryInterface.bulkInsert(
      "product_images",
      products.flatMap((_, i) => [
        { product_id: i + 1, enabled: true, path: `seed/product-thumb-${(i % 5) + 1}.jpeg` },
        ...[1, 2, 3, 4, 5].map((n) => ({ product_id: i + 1, enabled: true, path: `seed/product-image-${n}.jpeg` })),
      ]),
    );

    await queryInterface.bulkInsert(
      "product_options",
      products.flatMap((_, i) => [
        { product_id: i + 1, title: "Tamanho", shape: "square", radius: 4, type: "text", values: "39,40,41,42,43" },
        { product_id: i + 1, title: "Cor", shape: "circle", radius: 0, type: "color", values: "#6FEEFF,#FF6969,#5E5E5E,#6D70B7" },
      ]),
    );

    await queryInterface.bulkInsert(
      "product_category",
      products.flatMap(([, price, discount, styleCategory], i) => [
        { product_id: i + 1, category_id: 1 },
        { product_id: i + 1, category_id: styleCategory },
        ...(discount < price ? [{ product_id: i + 1, category_id: 6 }] : []),
      ]),
    );
  },

  async down(queryInterface) {
    // A ordem respeita as chaves estrangeiras
    for (const table of ["product_category", "product_options", "product_images", "products", "categories", "users"]) {
      await queryInterface.bulkDelete(table, null, {});
    }
  },
};
