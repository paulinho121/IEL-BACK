// Salva as imagens recebidas em base64 na pasta public/media e monta a URL pública delas
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const HttpError = require("./HttpError");
const { appUrl } = require("../config/env");

const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "public");
// Pasta física das imagens enviadas. Os testes apontam MEDIA_DIR para uma pasta temporária.
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(PUBLIC_DIR, "media");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB por imagem

const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const isUrl = (value) => typeof value === "string" && /^https?:\/\//i.test(value);

/** Decodifica o base64 (aceita também o formato data:image/png;base64,...). */
function decode(type, content) {
  const ext = EXTENSIONS[type];
  if (!ext) throw HttpError.badRequest(`Tipo de imagem não suportado: ${type}`, { allowed: Object.keys(EXTENSIONS) });
  if (typeof content !== "string" || content.length === 0) throw HttpError.badRequest("content da imagem é obrigatório");

  const base64 = content.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw HttpError.badRequest("content da imagem não é um base64 válido");

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) throw HttpError.badRequest("content da imagem está vazio");
  if (buffer.length > MAX_BYTES) throw HttpError.badRequest("Cada imagem pode ter no máximo 5 MB");
  return { buffer, ext };
}

/** Grava a imagem e devolve o caminho relativo salvo no banco (ex.: media/product-1/abc.png). */
async function save(productId, { type, content }) {
  const { buffer, ext } = decode(type, content);
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const relative = path.posix.join("media", `product-${productId}`, fileName);
  const absolute = path.join(MEDIA_DIR, `product-${productId}`, fileName);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, buffer);
  return relative;
}

/**
 * Remove o arquivo de uma imagem enviada pela API; ignora se ele já não existir.
 * URLs externas e as imagens de exemplo em seed/ (compartilhadas entre produtos) nunca são apagadas.
 */
async function remove(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.startsWith("media/")) return;
  await fs.rm(path.join(MEDIA_DIR, relativePath.slice("media/".length)), { force: true });
}

async function removeProductFolder(productId) {
  await fs.rm(path.join(MEDIA_DIR, `product-${productId}`), { recursive: true, force: true });
}

/** Caminho relativo -> URL completa servida pela API. */
function toUrl(relativePath) {
  return isUrl(relativePath) ? relativePath : `${appUrl}/${relativePath}`;
}

module.exports = { save, remove, removeProductFolder, toUrl, isUrl, PUBLIC_DIR, MEDIA_DIR };
