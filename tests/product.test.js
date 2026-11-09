const fs = require("fs");
const path = require("path");
const { app, request, resetDatabase, closeDatabase, authHeader, PNG_BASE64 } = require("./helpers");

let headers;
let categoryIds;

const baseProduct = {
  enabled: true,
  name: "Produto 01",
  slug: "produto-01",
  stock: 10,
  description: "Descrição do produto 01",
  price: 119.9,
  price_with_discount: 99.9,
};

/** Converte a URL pública de uma imagem no arquivo gravado na pasta temporária dos testes. */
const fileFromUrl = (url) => path.join(process.env.MEDIA_DIR, url.split("/media/")[1]);

beforeAll(async () => {
  await resetDatabase();
  headers = await authHeader();
  const create = (name, slug) => request(app).post("/v1/category").set(headers).send({ name, slug });
  categoryIds = [(await create("Tênis", "tenis")).body.id, (await create("Ofertas", "ofertas")).body.id];
});
afterAll(closeDatabase);

describe("Produtos", () => {
  let product;

  test("POST /v1/product exige token", async () => {
    expect((await request(app).post("/v1/product").send(baseProduct)).status).toBe(401);
  });

  test("POST /v1/product cria com imagens, opções e categorias", async () => {
    const res = await request(app)
      .post("/v1/product")
      .set(headers)
      .send({
        ...baseProduct,
        category_ids: categoryIds,
        images: [
          { type: "image/png", content: PNG_BASE64 },
          { type: "image/png", content: `data:image/png;base64,${PNG_BASE64}` },
        ],
        options: [
          { title: "Tamanho", shape: "square", radius: "4px", type: "text", value: ["PP", "GG", "M"] },
          { title: "Cor", shape: "circle", type: "color", values: ["#000", "#333"] },
        ],
      });

    expect(res.status).toBe(201);
    product = res.body;
    expect(product).toMatchObject({ ...baseProduct, category_ids: categoryIds });
    expect(product.images).toHaveLength(2);
    expect(product.images[0].content).toMatch(/^http:\/\/localhost:3333\/media\/product-\d+\/.+\.png$/);
    expect(fs.existsSync(fileFromUrl(product.images[0].content))).toBe(true);
    expect(product.options[0]).toMatchObject({ title: "Tamanho", radius: 4, values: ["PP", "GG", "M"] });
    expect(product.options[1]).toMatchObject({ shape: "circle", type: "color", values: ["#000", "#333"] });
  });

  test("POST /v1/product valida o corpo com 400", async () => {
    const missing = await request(app).post("/v1/product").set(headers).send({ name: "Sem preço" });
    expect(missing.status).toBe(400);
    expect(missing.body.errors).toEqual(expect.arrayContaining(["price é obrigatório e deve ser um número >= 0"]));

    const badCategory = await request(app)
      .post("/v1/product")
      .set(headers)
      .send({ ...baseProduct, slug: "outro", category_ids: [999] });
    expect(badCategory.status).toBe(400);

    const badImage = await request(app)
      .post("/v1/product")
      .set(headers)
      .send({ ...baseProduct, slug: "outro-2", images: [{ type: "application/pdf", content: PNG_BASE64 }] });
    expect(badImage.status).toBe(400);
    // A transação foi desfeita: nenhum produto "outro-2" ficou salvo
    expect((await request(app).get("/v1/product/search?match=outro")).body.total).toBe(0);

    const duplicatedSlug = await request(app).post("/v1/product").set(headers).send(baseProduct);
    expect(duplicatedSlug.status).toBe(400);
  });

  test("GET /v1/product/:id", async () => {
    const res = await request(app).get(`/v1/product/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(product);
    expect((await request(app).get("/v1/product/9999")).status).toBe(404);
  });

  test("GET /v1/product/search aplica filtros, paginação e fields", async () => {
    const create = (extra) => request(app).post("/v1/product").set(headers).send({ ...baseProduct, ...extra });
    await create({ name: "Camiseta básica", slug: "camiseta-basica", price: 49.9, price_with_discount: 39.9, category_ids: [categoryIds[1]] });
    await create({ name: "Boné", slug: "bone", description: "Tênis de brinde", price: 300, price_with_discount: 300 });

    const all = await request(app).get("/v1/product/search?limit=-1");
    expect(all.body).toMatchObject({ total: 3, limit: -1, page: 1 });

    const paged = await request(app).get("/v1/product/search?limit=2&page=2");
    expect(paged.body.data).toHaveLength(1);
    expect(paged.body.total).toBe(3);

    // match procura no nome e na descrição
    const match = await request(app).get(`/v1/product/search?match=${encodeURIComponent("Tênis")}`);
    expect(match.body.data.map((p) => p.slug)).toEqual(["bone"]);

    const byCategory = await request(app).get(`/v1/product/search?category_ids=${categoryIds[1]}`);
    expect(byCategory.body.data.map((p) => p.slug).sort()).toEqual(["camiseta-basica", "produto-01"]);

    const byPrice = await request(app).get("/v1/product/search?price-range=100-200");
    expect(byPrice.body.data.map((p) => p.slug)).toEqual(["produto-01"]);

    const sizeOption = product.options[0];
    const byOption = await request(app).get(`/v1/product/search?option[${sizeOption.id}]=GG,XG`);
    expect(byOption.body.data.map((p) => p.slug)).toEqual(["produto-01"]);
    const noOption = await request(app).get(`/v1/product/search?option[${sizeOption.id}]=XG`);
    expect(noOption.body.total).toBe(0);

    const fields = await request(app).get("/v1/product/search?fields=name,images,price&limit=1");
    expect(Object.keys(fields.body.data[0]).sort()).toEqual(["id", "images", "name", "price"]);
  });

  test("GET /v1/product/search recusa filtros inválidos com 400", async () => {
    expect((await request(app).get("/v1/product/search?price-range=abc")).status).toBe(400);
    expect((await request(app).get("/v1/product/search?price-range=200-100")).status).toBe(400);
    expect((await request(app).get("/v1/product/search?category_ids=a,b")).status).toBe(400);
    expect((await request(app).get("/v1/product/search?page=0")).status).toBe(400);
  });

  test("PUT /v1/product/:id atualiza campos, imagens, opções e categorias", async () => {
    const [keep, remove] = product.images;
    const [sizeOption, colorOption] = product.options;

    const res = await request(app)
      .put(`/v1/product/${product.id}`)
      .set(headers)
      .send({
        name: "Produto 01 atualizado",
        slug: "produto-01-atualizado",
        price: 49.9,
        price_with_discount: 0,
        category_ids: [categoryIds[0]],
        images: [
          { type: "image/png", content: PNG_BASE64 },
          { id: remove.id, deleted: true },
          { id: keep.id, content: keep.content },
        ],
        options: [
          { id: colorOption.id, deleted: true },
          { id: sizeOption.id, radius: "10px", value: ["42/43", "44/45"] },
          { title: "Tipo", shape: "square", type: "text", values: ["100% algodão", "65% algodão"] },
        ],
      });
    expect(res.status).toBe(204);

    const updated = (await request(app).get(`/v1/product/${product.id}`)).body;
    expect(updated).toMatchObject({ name: "Produto 01 atualizado", price: 49.9, price_with_discount: 0, stock: 10 });
    expect(updated.category_ids).toEqual([categoryIds[0]]);
    expect(updated.images.map((i) => i.id)).toContain(keep.id);
    expect(updated.images.map((i) => i.id)).not.toContain(remove.id);
    expect(updated.images).toHaveLength(2);
    expect(fs.existsSync(fileFromUrl(remove.content))).toBe(false);
    expect(updated.options).toHaveLength(2);
    expect(updated.options.find((o) => o.id === sizeOption.id)).toMatchObject({ title: "Tamanho", radius: 10, values: ["42/43", "44/45"] });
    expect(updated.options.find((o) => o.title === "Tipo").values).toEqual(["100% algodão", "65% algodão"]);
    product = updated;
  });

  test("PUT /v1/product/:id responde 400, 401 e 404", async () => {
    expect((await request(app).put(`/v1/product/${product.id}`).send({ stock: 1 })).status).toBe(401);
    expect((await request(app).put(`/v1/product/${product.id}`).set(headers).send({ stock: -1 })).status).toBe(400);
    const otherImage = await request(app).put(`/v1/product/${product.id}`).set(headers).send({ images: [{ id: 9999, deleted: true }] });
    expect(otherImage.status).toBe(400);
    expect((await request(app).put("/v1/product/9999").set(headers).send({ stock: 1 })).status).toBe(404);
  });

  test("DELETE /v1/product/:id apaga o produto e as imagens do disco", async () => {
    const imageFile = fileFromUrl(product.images[0].content);
    expect((await request(app).delete(`/v1/product/${product.id}`)).status).toBe(401);
    expect((await request(app).delete(`/v1/product/${product.id}`).set(headers)).status).toBe(204);
    expect((await request(app).get(`/v1/product/${product.id}`)).status).toBe(404);
    expect(fs.existsSync(imageFile)).toBe(false);
    expect((await request(app).delete(`/v1/product/${product.id}`).set(headers)).status).toBe(404);
  });
});
