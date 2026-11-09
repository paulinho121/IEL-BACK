// Ponto de entrada: confere a conexão com o banco e sobe o servidor HTTP
const app = require("./app");
const { sequelize } = require("./models");
const { port, appUrl } = require("./config/env");

async function start() {
  try {
    await sequelize.authenticate();
    app.listen(port, () => {
      console.log(`Digital Store API rodando em ${appUrl}`);
      console.log(`Documentação Swagger em ${appUrl}/docs`);
    });
  } catch (error) {
    console.error("Não foi possível conectar ao banco de dados:", error.message);
    process.exit(1);
  }
}

start();
