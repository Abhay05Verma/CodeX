const mongoose = require("mongoose");
const { ok, fail } = require("../utils/response");
const productService = require("../services/productService");

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    fail(res, 503, "Database not connected");
    return false;
  }
  return true;
}

async function listProducts(req, res) {
  if (!requireDb(res)) return;
  try {
    const data = await productService.listProducts(req.query);
    return ok(res, data, "Products fetched");
  } catch (error) {
    return fail(res, 500, "Failed to fetch products", error.message);
  }
}

async function getProduct(req, res) {
  if (!requireDb(res)) return;
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return fail(res, 404, "Product not found");
    return ok(res, { product }, "Product fetched");
  } catch (error) {
    return fail(res, 400, "Invalid product id", error.message);
  }
}

async function createProduct(req, res) {
  if (!requireDb(res)) return;
  try {
    const product = await productService.createProduct(req.body, req.user);
    return ok(res, { product }, "Product created", 201);
  } catch (error) {
    return fail(res, 400, "Failed to create product", error.message);
  }
}

async function updateProduct(req, res) {
  if (!requireDb(res)) return;
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user);
    if (!product) return fail(res, 404, "Product not found");
    return ok(res, { product }, "Product updated");
  } catch (error) {
    if (error.code === "FORBIDDEN") return fail(res, 403, error.message);
    return fail(res, 400, "Failed to update product", error.message);
  }
}

async function deleteProduct(req, res) {
  if (!requireDb(res)) return;
  try {
    const result = await productService.deleteProduct(req.params.id, req.user);
    if (!result) return fail(res, 404, "Product not found");
    return ok(res, {}, "Product deleted");
  } catch (error) {
    if (error.code === "FORBIDDEN") return fail(res, 403, error.message);
    return fail(res, 400, "Failed to delete product", error.message);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
