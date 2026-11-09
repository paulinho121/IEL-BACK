// Especificação OpenAPI 3 da API, exibida pelo Swagger UI em /docs
const { appUrl } = require("../config/env");

const errorResponse = (description) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const responses = {
  BadRequest: errorResponse("Dados da requisição incorretos"),
  Unauthorized: errorResponse("Token de autorização ausente ou inválido"),
  NotFound: errorResponse("Recurso não encontrado"),
};

const idParam = { name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } };
const limitParam = {
  name: "limit",
  in: "query",
  description: "Itens por página. Use -1 para buscar todos.",
  schema: { type: "integer", default: 12 },
};
const pageParam = {
  name: "page",
  in: "query",
  description: "Página. Ignorado quando limit = -1.",
  schema: { type: "integer", default: 1 },
};
const json = (schema) => ({ content: { "application/json": { schema } } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const secured = [{ bearerAuth: [] }];

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Digital Store API",
    version: "1.0.0",
    description:
      "API da Digital Store, projeto final de Back-end da Digital College.\n\n" +
      "**Autenticação:** gere um token em `POST /v1/user/token` e clique em **Authorize** para enviá-lo como " +
      "`Authorization: Bearer <token>`. O token é exigido em todos os POST, PUT e DELETE, exceto no cadastro de usuário e na geração do token.",
  },
  servers: [{ url: appUrl }],
  tags: [
    { name: "Usuários", description: "Cadastro, consulta e autenticação" },
    { name: "Categorias" },
    { name: "Produtos" },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    responses,
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Dados da requisição inválidos" },
          errors: { type: "array", items: { type: "string" }, example: ["name é obrigatório"] },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          firstname: { type: "string", example: "Paulo" },
          surname: { type: "string", example: "Fernando" },
          email: { type: "string", example: "user@mail.com" },
        },
      },
      UserCreate: {
        type: "object",
        required: ["firstname", "surname", "email", "password", "confirmPassword"],
        properties: {
          firstname: { type: "string", example: "user firstname" },
          surname: { type: "string", example: "user surname" },
          email: { type: "string", example: "user@mail.com" },
          password: { type: "string", minLength: 6, example: "123@123" },
          confirmPassword: { type: "string", example: "123@123" },
        },
      },
      UserUpdate: {
        type: "object",
        required: ["firstname", "surname", "email"],
        properties: {
          firstname: { type: "string", example: "user firstname" },
          surname: { type: "string", example: "user surname" },
          email: { type: "string", example: "user@mail.com" },
        },
      },
      Credentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@digitalstore.com" },
          password: { type: "string", example: "admin123" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Shoes" },
          slug: { type: "string", example: "shoes" },
          use_in_menu: { type: "boolean", example: true },
        },
      },
      CategoryInput: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string", example: "Shoes" },
          slug: { type: "string", example: "shoes" },
          use_in_menu: { type: "boolean", example: true },
        },
      },
      ProductOption: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          product_id: { type: "integer", example: 1 },
          title: { type: "string", example: "Tamanho" },
          shape: { type: "string", enum: ["square", "circle"], example: "square" },
          radius: { type: "integer", example: 4 },
          type: { type: "string", enum: ["text", "color"], example: "text" },
          values: { type: "array", items: { type: "string" }, example: ["39", "40", "41"] },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          enabled: { type: "boolean", example: true },
          name: { type: "string", example: "Produto 01" },
          slug: { type: "string", example: "produto-01" },
          use_in_menu: { type: "boolean", example: false },
          stock: { type: "integer", example: 10 },
          description: { type: "string", example: "Descrição do produto 01" },
          price: { type: "number", example: 119.9 },
          price_with_discount: { type: "number", example: 99.9 },
          category_ids: { type: "array", items: { type: "integer" }, example: [1, 2] },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                content: { type: "string", example: `${appUrl}/media/product-1/imagem.png` },
              },
            },
          },
          options: { type: "array", items: ref("ProductOption") },
        },
      },
      ProductInput: {
        type: "object",
        required: ["name", "slug", "price", "price_with_discount"],
        properties: {
          enabled: { type: "boolean", example: true },
          name: { type: "string", example: "Produto 01" },
          slug: { type: "string", example: "produto-01" },
          stock: { type: "integer", example: 10 },
          description: { type: "string", example: "Descrição do produto 01" },
          price: { type: "number", example: 119.9 },
          price_with_discount: { type: "number", example: 99.9 },
          category_ids: { type: "array", items: { type: "integer" }, example: [1] },
          images: {
            type: "array",
            description:
              "Novas imagens em base64. No PUT: `{ id, deleted: true }` remove, `{ id, content: <base64> }` troca e `{ id, content: <URL> }` mantém.",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                deleted: { type: "boolean" },
                type: { type: "string", example: "image/png" },
                content: {
                  type: "string",
                  example: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
                },
              },
            },
          },
          options: {
            type: "array",
            description:
              "No PUT: `{ id, deleted: true }` remove, `{ id, ...campos }` altera e um objeto sem id cria uma opção nova. Aceita `values` ou `value`.",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                deleted: { type: "boolean" },
                title: { type: "string", example: "Tamanho" },
                shape: { type: "string", enum: ["square", "circle"] },
                radius: { oneOf: [{ type: "integer" }, { type: "string" }], example: "4px" },
                type: { type: "string", enum: ["text", "color"] },
                values: { type: "array", items: { type: "string" }, example: ["39", "40", "41"] },
              },
            },
          },
        },
      },
      Page: {
        type: "object",
        properties: {
          total: { type: "integer", example: 15 },
          limit: { type: "integer", example: 12 },
          page: { type: "integer", example: 1 },
        },
      },
    },
  },
  paths: {
    "/v1/user/token": {
      post: {
        tags: ["Usuários"],
        summary: "Gera o token JWT",
        requestBody: { required: true, ...json(ref("Credentials")) },
        responses: {
          200: { description: "Token gerado", ...json({ type: "object", properties: { token: { type: "string" } } }) },
          400: responses.BadRequest,
        },
      },
    },
    "/v1/user": {
      post: {
        tags: ["Usuários"],
        summary: "Cadastra um usuário",
        requestBody: { required: true, ...json(ref("UserCreate")) },
        responses: { 201: { description: "Usuário criado", ...json(ref("User")) }, 400: responses.BadRequest },
      },
    },
    "/v1/user/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Usuários"],
        summary: "Obtém um usuário pelo ID",
        responses: { 200: { description: "Usuário encontrado", ...json(ref("User")) }, 404: responses.NotFound },
      },
      put: {
        tags: ["Usuários"],
        summary: "Atualiza um usuário",
        security: secured,
        requestBody: { required: true, ...json(ref("UserUpdate")) },
        responses: {
          204: { description: "Atualizado" },
          400: responses.BadRequest,
          401: responses.Unauthorized,
          404: responses.NotFound,
        },
      },
      delete: {
        tags: ["Usuários"],
        summary: "Remove um usuário",
        security: secured,
        responses: { 204: { description: "Removido" }, 401: responses.Unauthorized, 404: responses.NotFound },
      },
    },
    "/v1/category/search": {
      get: {
        tags: ["Categorias"],
        summary: "Lista categorias",
        parameters: [
          limitParam,
          pageParam,
          { name: "fields", in: "query", description: "Ex.: name,slug", schema: { type: "string" } },
          { name: "use_in_menu", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: {
            description: "Lista paginada",
            ...json({ allOf: [{ type: "object", properties: { data: { type: "array", items: ref("Category") } } }, ref("Page")] }),
          },
          400: responses.BadRequest,
        },
      },
    },
    "/v1/category": {
      post: {
        tags: ["Categorias"],
        summary: "Cadastra uma categoria",
        security: secured,
        requestBody: { required: true, ...json(ref("CategoryInput")) },
        responses: {
          201: { description: "Categoria criada", ...json(ref("Category")) },
          400: responses.BadRequest,
          401: responses.Unauthorized,
        },
      },
    },
    "/v1/category/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Categorias"],
        summary: "Obtém uma categoria pelo ID",
        responses: { 200: { description: "Categoria encontrada", ...json(ref("Category")) }, 404: responses.NotFound },
      },
      put: {
        tags: ["Categorias"],
        summary: "Atualiza uma categoria",
        security: secured,
        requestBody: { required: true, ...json(ref("CategoryInput")) },
        responses: {
          204: { description: "Atualizada" },
          400: responses.BadRequest,
          401: responses.Unauthorized,
          404: responses.NotFound,
        },
      },
      delete: {
        tags: ["Categorias"],
        summary: "Remove uma categoria",
        security: secured,
        responses: { 204: { description: "Removida" }, 401: responses.Unauthorized, 404: responses.NotFound },
      },
    },
    "/v1/product/search": {
      get: {
        tags: ["Produtos"],
        summary: "Lista produtos com filtros",
        parameters: [
          limitParam,
          pageParam,
          { name: "fields", in: "query", description: "Ex.: name,images,price", schema: { type: "string" } },
          { name: "match", in: "query", description: "Termo buscado no nome ou na descrição", schema: { type: "string" } },
          { name: "category_ids", in: "query", description: "Ex.: 1,2", schema: { type: "string" } },
          { name: "price-range", in: "query", description: "Ex.: 100-200", schema: { type: "string" } },
          {
            name: "option[1]",
            in: "query",
            description: "Filtra pelos valores da opção de ID 1 (troque o número pelo ID da opção). Ex.: 41,42",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Lista paginada",
            ...json({ allOf: [{ type: "object", properties: { data: { type: "array", items: ref("Product") } } }, ref("Page")] }),
          },
          400: responses.BadRequest,
        },
      },
    },
    "/v1/product": {
      post: {
        tags: ["Produtos"],
        summary: "Cadastra um produto",
        security: secured,
        requestBody: { required: true, ...json(ref("ProductInput")) },
        responses: {
          201: { description: "Produto criado", ...json(ref("Product")) },
          400: responses.BadRequest,
          401: responses.Unauthorized,
        },
      },
    },
    "/v1/product/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Produtos"],
        summary: "Obtém um produto pelo ID",
        responses: { 200: { description: "Produto encontrado", ...json(ref("Product")) }, 404: responses.NotFound },
      },
      put: {
        tags: ["Produtos"],
        summary: "Atualiza um produto",
        description: "Só os campos enviados são alterados.",
        security: secured,
        requestBody: { required: true, ...json(ref("ProductInput")) },
        responses: {
          204: { description: "Atualizado" },
          400: responses.BadRequest,
          401: responses.Unauthorized,
          404: responses.NotFound,
        },
      },
      delete: {
        tags: ["Produtos"],
        summary: "Remove um produto",
        security: secured,
        responses: { 204: { description: "Removido" }, 401: responses.Unauthorized, 404: responses.NotFound },
      },
    },
  },
};
