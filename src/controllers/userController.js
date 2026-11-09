// Controllers só traduzem HTTP <-> service; as regras ficam em services/userService.js
const userService = require("../services/userService");
const { parseId } = require("../utils/validators");

async function show(req, res) {
  const user = await userService.findById(parseId(req.params.id));
  res.status(200).json(user);
}

async function store(req, res) {
  const user = await userService.create(req.body);
  res.status(201).json(user);
}

async function update(req, res) {
  await userService.update(parseId(req.params.id), req.body);
  res.status(204).end();
}

async function destroy(req, res) {
  await userService.remove(parseId(req.params.id));
  res.status(204).end();
}

async function token(req, res) {
  res.status(200).json(await userService.generateToken(req.body));
}

module.exports = { show, store, update, destroy, token };
