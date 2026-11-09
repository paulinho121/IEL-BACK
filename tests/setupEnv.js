// Ambiente dos testes: SQLite em memória, segredo fixo e imagens numa pasta temporária
const os = require("os");
const path = require("path");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.APP_URL = "http://localhost:3333";
process.env.MEDIA_DIR = path.join(os.tmpdir(), `digital-store-test-media-${process.pid}`);
