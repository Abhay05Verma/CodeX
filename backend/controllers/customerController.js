const mongoose = require("mongoose");
const customerService = require("../services/customerService");
const { ok, fail } = require("../utils/response");

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    fail(res, 503, "Database not connected");
    return false;
  }
  return true;
}

async function getMe(req, res) {
  if (!requireDb(res)) return;
  try {
    const customer = await customerService.getProfile(req.user.id);
    return ok(res, { customer }, "Customer profile");
  } catch (e) {
    return fail(res, 500, "Failed to get customer profile", e.message);
  }
}

async function updateMe(req, res) {
  if (!requireDb(res)) return;
  try {
    const customer = await customerService.updateProfile(req.user.id, req.body);
    return ok(res, { customer }, "Customer updated");
  } catch (e) {
    return fail(res, 400, "Failed to update customer", e.message);
  }
}

async function getCart(req, res) {
  if (!requireDb(res)) return;
  try {
    const doc = await customerService.getCart(req.user.id);
    return ok(res, { cart: doc.cart || [] }, "Cart");
  } catch (e) {
    return fail(res, 500, "Failed to get cart", e.message);
  }
}

async function updateCart(req, res) {
  if (!requireDb(res)) return;
  try {
    const doc = await customerService.updateCart(req.user.id, req.body.cart);
    return ok(res, { cart: doc.cart || [] }, "Cart updated");
  } catch (e) {
    return fail(res, 400, e.message || "Failed to update cart");
  }
}

async function getFavorites(req, res) {
  if (!requireDb(res)) return;
  try {
    const favorites = await customerService.getFavorites(req.user.id);
    return ok(res, { favorites }, "Favorites");
  } catch (e) {
    return fail(res, 500, "Failed to get favorites", e.message);
  }
}

async function addFavorite(req, res) {
  if (!requireDb(res)) return;
  try {
    const vendorId = req.params.vendorId;
    if (!vendorId) return fail(res, 400, "vendorId required");
    const customer = await customerService.addFavorite(req.user.id, vendorId);
    return ok(res, { customer, favorites: customer.favorites }, "Favorite added");
  } catch (e) {
    return fail(res, 400, e.message || "Failed to add favorite");
  }
}

async function removeFavorite(req, res) {
  if (!requireDb(res)) return;
  try {
    const vendorId = req.params.vendorId;
    if (!vendorId) return fail(res, 400, "vendorId required");
    const customer = await customerService.removeFavorite(req.user.id, vendorId);
    return ok(res, { customer, favorites: customer.favorites }, "Favorite removed");
  } catch (e) {
    return fail(res, 400, e.message || "Failed to remove favorite");
  }
}

module.exports = {
  getMe,
  updateMe,
  getCart,
  updateCart,
  getFavorites,
  addFavorite,
  removeFavorite,
};
