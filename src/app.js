// Monta a aplicação Express (sem abrir porta), o que permite usá-la nos testes com o supertest
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const routes = require("./routes");
const openapi = require("./docs/openapi");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { PUBLIC_DIR, MEDIA_DIR } = require("./utils/imageStorage");

const app = express();

app.use(cors());
// Limite maior por causa das imagens em base64
app.use(express.json({ limit: "15mb" }));

// Imagens dos produtos: /media (enviadas pela API) e /seed (dados de exemplo)
app.use("/media", express.static(MEDIA_DIR));
app.use("/seed", express.static(`${PUBLIC_DIR}/seed`));

app.get("/", (_req, res) => res.json({ name: "Digital Store API", docs: "/docs" }));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: "Digital Store API" }));
app.get("/docs.json", (_req, res) => res.json(openapi));

app.use("/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
