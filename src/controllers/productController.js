const productService = require("../services/productService");
const { parseId } = require("../utils/validators");

async function search(req, res) {
  res.status(200).json(await productService.search(req.query));
}

async function show(req, res) {
  res.status(200).json(await productService.findById(parseId(req.params.id)));
}

async function store(req, res) {
  res.status(201).json(await productService.create(req.body));
}

async function update(req, res) {
  await productService.update(parseId(req.params.id), req.body);
  res.status(204).end();
}

async function destroy(req, res) {
  await productService.remove(parseId(req.params.id));
  res.status(204).end();
}

module.exports = { search, show, store, update, destroy };
