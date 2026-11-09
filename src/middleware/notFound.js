/** Responde 404 para qualquer rota que não exista na API. */
function notFound(req, res) {
  res.status(404).json({ message: `Rota ${req.method} ${req.originalUrl} não encontrada` });
}

module.exports = notFound;
