const { app, request, resetDatabase, closeDatabase, authHeader } = require("./helpers");

const newUser = {
  firstname: "Paulo",
  surname: "Fernando",
  email: "paulo@mail.com",
  password: "123@123",
  confirmPassword: "123@123",
};

beforeAll(resetDatabase);
afterAll(closeDatabase);

describe("Usuários", () => {
  let userId;
  let headers;

  test("POST /v1/user cadastra e não devolve a senha", async () => {
    const res = await request(app).post("/v1/user").send(newUser);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), firstname: "Paulo", surname: "Fernando", email: "paulo@mail.com" });
    userId = res.body.id;
  });

  test("POST /v1/user recusa dados inválidos com 400", async () => {
    const res = await request(app)
      .post("/v1/user")
      .send({ ...newUser, email: "invalido", confirmPassword: "outra" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining(["email deve ser um e-mail válido"]));
  });

  test("POST /v1/user recusa e-mail repetido com 400", async () => {
    const res = await request(app).post("/v1/user").send(newUser);
    expect(res.status).toBe(400);
  });

  test("POST /v1/user/token devolve um JWT com credenciais corretas", async () => {
    const res = await request(app).post("/v1/user/token").send({ email: newUser.email, password: newUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token.split(".")).toHaveLength(3);
    headers = { Authorization: `Bearer ${res.body.token}` };
  });

  test("POST /v1/user/token recusa senha errada com 400", async () => {
    const res = await request(app).post("/v1/user/token").send({ email: newUser.email, password: "errada" });
    expect(res.status).toBe(400);
  });

  test("GET /v1/user/:id devolve o usuário e 404 quando não existe", async () => {
    const found = await request(app).get(`/v1/user/${userId}`);
    expect(found.status).toBe(200);
    expect(found.body.email).toBe(newUser.email);

    const missing = await request(app).get("/v1/user/9999");
    expect(missing.status).toBe(404);
  });

  test("PUT /v1/user/:id exige token", async () => {
    const res = await request(app).put(`/v1/user/${userId}`).send({ firstname: "X", surname: "Y", email: "x@mail.com" });
    expect(res.status).toBe(401);
  });

  test("PUT /v1/user/:id rejeita token adulterado", async () => {
    const res = await request(app)
      .put(`/v1/user/${userId}`)
      .set({ Authorization: "Bearer abc.def.ghi" })
      .send({ firstname: "X", surname: "Y", email: "x@mail.com" });
    expect(res.status).toBe(401);
  });

  test("PUT /v1/user/:id atualiza com 204", async () => {
    const res = await request(app)
      .put(`/v1/user/${userId}`)
      .set(headers)
      .send({ firstname: "Paulo F.", surname: "Fernando", email: "paulo@mail.com" });
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const updated = await request(app).get(`/v1/user/${userId}`);
    expect(updated.body.firstname).toBe("Paulo F.");
  });

  test("DELETE /v1/user/:id remove e depois responde 404", async () => {
    const other = await authHeader("other@mail.com");
    expect((await request(app).delete(`/v1/user/${userId}`).set(other)).status).toBe(204);
    expect((await request(app).delete(`/v1/user/${userId}`).set(other)).status).toBe(404);
  });

  test("id não numérico responde 400", async () => {
    expect((await request(app).get("/v1/user/abc")).status).toBe(400);
  });

  test("JSON mal formado responde 400", async () => {
    const res = await request(app).post("/v1/user").set("Content-Type", "application/json").send("{ruim");
    expect(res.status).toBe(400);
  });

  test("rota inexistente responde 404", async () => {
    expect((await request(app).get("/v1/nada")).status).toBe(404);
  });
});
