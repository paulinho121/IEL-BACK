/**
 * Erro com status HTTP. Os services lançam esse erro e o middleware
 * de erros o transforma na resposta correta (400, 401, 404...).
 */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = "Token de autorização ausente ou inválido") {
    return new HttpError(401, message);
  }

  static notFound(message = "Recurso não encontrado") {
    return new HttpError(404, message);
  }
}

module.exports = HttpError;
