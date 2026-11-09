const { app, request, resetDatabase, closeDatabase, authHeader } = require("./helpers");

let headers;

beforeAll(async () => {
  await resetDatabase();
  headers = await authHeader();
});
afterAll(closeDatabase);

describe("Categorias", () => {
  let shoesId;

  test("POST /v1/category exige token", async () => {
    const res = await request(app).post("/v1/category").send({ name: "Shoes", slug: "shoes" });
    expect(res.status).toBe(401);
  });

  test("POST /v1/category cria com 201", async () => {
    const res = await request(app).post("/v1/category").set(headers).send({ name: "Shoes", slug: "shoes", use_in_menu: true });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), name: "Shoes", slug: "shoes", use_in_menu: true });
    shoesId = res.body.id;

    await request(app).post("/v1/category").set(headers).send({ name: "Offers", slug: "offers", use_in_menu: true });
    await request(app).post("/v1/category").set(headers).send({ name: "Black Friday", slug: "black-friday" });
  });

  test("POST /v1/category valida slug e duplicidade", async () => {
    const invalid = await request(app).post("/v1/category").set(headers).send({ name: "X", slug: "Slug Errado" });
    expect(invalid.status).toBe(400);

    const duplicated = await request(app).post("/v1/category").set(headers).send({ name: "Shoes 2", slug: "shoes" });
    expect(duplicated.status).toBe(400);
  });

  test("GET /v1/category/search pagina, filtra e limita campos", async () => {
    const all = await request(app).get("/v1/category/search?limit=-1");
    expect(all.status).toBe(200);
    expect(all.body).toMatchObject({ total: 3, limit: -1, page: 1 });
    expect(all.body.data).toHaveLength(3);

    const page2 = await request(app).get("/v1/category/search?limit=2&page=2");
    expect(page2.body.data.map((c) => c.slug)).toEqual(["black-friday"]);

    const menu = await request(app).get("/v1/category/search?use_in_menu=true&fields=name,slug");
    expect(menu.body.total).toBe(2);
    expect(Object.keys(menu.body.data[0]).sort()).toEqual(["id", "name", "slug"]);
  });

  test("GET /v1/category/search recusa parâmetros inválidos com 400", async () => {
    expect((await request(app).get("/v1/category/search?limit=0")).status).toBe(400);
    expect((await request(app).get("/v1/category/search?fields=senha")).status).toBe(400);
  });

  test("GET /v1/category/:id", async () => {
    expect((await request(app).get(`/v1/category/${shoesId}`)).body.slug).toBe("shoes");
    expect((await request(app).get("/v1/category/9999")).status).toBe(404);
  });

  test("PUT /v1/category/:id atualiza com 204", async () => {
    const res = await request(app)
      .put(`/v1/category/${shoesId}`)
      .set(headers)
      .send({ name: "Tênis", slug: "tenis", use_in_menu: false });
    expect(res.status).toBe(204);
    expect((await request(app).get(`/v1/category/${shoesId}`)).body).toMatchObject({ name: "Tênis", use_in_menu: false });

    const missing = await request(app).put("/v1/category/9999").set(headers).send({ name: "A", slug: "a" });
    expect(missing.status).toBe(404);
  });

  test("DELETE /v1/category/:id", async () => {
    expect((await request(app).delete(`/v1/category/${shoesId}`)).status).toBe(401);
    expect((await request(app).delete(`/v1/category/${shoesId}`).set(headers)).status).toBe(204);
    expect((await request(app).get(`/v1/category/${shoesId}`)).status).toBe(404);
  });
});
