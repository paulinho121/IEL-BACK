// Regras de negócio dos usuários: cadastro, consulta, edição, remoção e login
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const HttpError = require("../utils/HttpError");
const { EMAIL_REGEX, isNonEmptyString, assertValid } = require("../utils/validators");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

function validateProfile({ firstname, surname, email }) {
  const errors = [];
  if (!isNonEmptyString(firstname)) errors.push("firstname é obrigatório");
  if (!isNonEmptyString(surname)) errors.push("surname é obrigatório");
  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) errors.push("email deve ser um e-mail válido");
  return errors;
}

async function ensureEmailIsFree(email, ignoreUserId) {
  const existing = await User.findOne({ where: { email }, attributes: ["id"] });
  if (existing && existing.id !== ignoreUserId) {
    throw HttpError.badRequest("Este e-mail já está cadastrado");
  }
}

async function findById(id) {
  const user = await User.findByPk(id);
  if (!user) throw HttpError.notFound("Usuário não encontrado");
  return user;
}

async function create(data = {}) {
  const errors = validateProfile(data);
  if (typeof data.password !== "string" || data.password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`password deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  } else if (data.password !== data.confirmPassword) {
    errors.push("password e confirmPassword devem ser iguais");
  }
  assertValid(errors);

  const email = data.email.trim().toLowerCase();
  await ensureEmailIsFree(email);

  return User.create({
    firstname: data.firstname.trim(),
    surname: data.surname.trim(),
    email,
    password: await bcrypt.hash(data.password, SALT_ROUNDS),
  });
}

async function update(id, data = {}) {
  assertValid(validateProfile(data));
  const user = await findById(id);
  const email = data.email.trim().toLowerCase();
  await ensureEmailIsFree(email, user.id);

  await user.update({ firstname: data.firstname.trim(), surname: data.surname.trim(), email });
}

async function remove(id) {
  const user = await findById(id);
  await user.destroy();
}

/** Confere e-mail e senha e devolve um JWT assinado. */
async function generateToken({ email, password } = {}) {
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw HttpError.badRequest("Informe email e password");
  }

  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  // Mesma mensagem para e-mail e senha errados, para não revelar quais e-mails existem
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) throw HttpError.badRequest("E-mail ou senha incorretos");

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token };
}

module.exports = { findById, create, update, remove, generateToken };
