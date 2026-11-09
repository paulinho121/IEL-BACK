// Utilitários compartilhados entre os testes de integração
const fs = require("fs");
const request = require("supertest");
const app = require("../src/app");
const { sequelize } = require("../src/models");

/** Recria as tabelas antes de cada arquivo de teste. */
async function resetDatabase() {
  await sequelize.sync({ force: true });
}

async function closeDatabase() {
  await sequelize.close();
  fs.rmSync(process.env.MEDIA_DIR, { recursive: true, force: true });
}

/** Cadastra um usuário e devolve o cabeçalho Authorization pronto para uso. */
async function authHeader(email = "tester@mail.com") {
  const password = "123@123";
  await request(app)
    .post("/v1/user")
    .send({ firstname: "Test", surname: "User", email, password, confirmPassword: password });
  const res = await request(app).post("/v1/user/token").send({ email, password });
  return { Authorization: `Bearer ${res.body.token}` };
}

// PNG 1x1 transparente em base64
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

module.exports = { app, request, resetDatabase, closeDatabase, authHeader, PNG_BASE64 };
