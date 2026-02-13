const mongoose = require("mongoose");
const orderService = require("../services/orderService");
const { ok, fail } = require("../utils/response");

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    fail(res, 503, "Database not connected");
    return false;
  }
  return true;
}

function mapServiceError(res, error, fallbackMessage) {
  if (error.code === "BAD_REQUEST") return fail(res, 400, error.message);
  if (error.code === "NOT_FOUND") return fail(res, 404, error.message);
  if (error.code === "FORBIDDEN") return fail(res, 403, error.message);
  return fail(res, 500, fallbackMessage, error.message);
}

async function listMyOrders(req, res) {
  if (!requireDb(res)) return;
  try {
    const orders = await orderService.listBuyerOrders(req.user);
    return ok(res, { orders }, "Orders fetched");
  } catch (error) {
    return mapServiceError(res, error, "Failed to fetch orders");
  }
}

async function listSupplierOrders(req, res) {
  if (!requireDb(res)) return;
  try {
    const orders = await orderService.listSupplierOrders(req.user);
    return ok(res, { orders }, "Supplier orders fetched");
  } catch (error) {
    return mapServiceError(res, error, "Failed to fetch supplier orders");
  }
}

async function getOrder(req, res) {
  if (!requireDb(res)) return;
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return fail(res, 404, "Order not found");
    orderService.ensureOrderAccess(order, req.user);
    return ok(res, { order }, "Order fetched");
  } catch (error) {
    return mapServiceError(res, error, "Invalid order id");
  }
}

async function createOrder(req, res) {
  if (!requireDb(res)) return;
  try {
    const order = await orderService.createOrder(req.body, req.user);
    return ok(res, { order }, "Order created", 201);
  } catch (error) {
    return mapServiceError(res, error, "Failed to create order");
  }
}

async function updateOrderStatus(req, res) {
  if (!requireDb(res)) return;
  try {
    const { status } = req.body || {};
    const order = await orderService.updateOrderStatus(req.params.id, status, req.user);
    return ok(res, { order }, "Order status updated");
  } catch (error) {
    return mapServiceError(res, error, "Failed to update order status");
  }
}

async function addReview(req, res) {
  if (!requireDb(res)) return;
  try {
    const { rating, review } = req.body || {};
    const order = await orderService.addOrderReview(req.params.id, rating, review, req.user);
    return ok(res, { order }, "Order reviewed");
  } catch (error) {
    return mapServiceError(res, error, "Failed to add review");
  }
}

module.exports = {
  listMyOrders,
  listSupplierOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  addReview,
};
