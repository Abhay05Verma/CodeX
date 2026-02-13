const Order = require("../models/Order");
const Product = require("../models/Product");

const SUPPLIER_STATUSES = new Set(["confirmed", "preparing", "shipped", "delivered", "cancelled"]);

function makeError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function populateOrderQuery(query) {
  return query
    .populate("buyer", "name email")
    .populate("supplier", "name email")
    .populate("items.product", "name price unit image");
}

async function listBuyerOrders(user) {
  const filter = user.role === "admin" ? {} : { buyer: user.id };
  return populateOrderQuery(
    Order.find(filter).sort({ createdAt: -1 }).limit(200)
  );
}

async function listSupplierOrders(user) {
  const filter = user.role === "admin" ? {} : { supplier: user.id };
  return populateOrderQuery(
    Order.find(filter).sort({ createdAt: -1 }).limit(200)
  );
}

async function getOrderById(id) {
  return Order.findById(id)
    .populate("buyer", "name email")
    .populate("supplier", "name email")
    .populate("items.product", "name price unit image description");
}

function ensureOrderAccess(order, user) {
  const buyerId = String(order.buyer?._id || order.buyer);
  const supplierId = String(order.supplier?._id || order.supplier);
  if (user.role !== "admin" && user.id !== buyerId && user.id !== supplierId) {
    throw makeError("Forbidden", "FORBIDDEN");
  }
}

async function createOrder(payload, user) {
  const { items, supplierId, notes } = payload || {};
  if (!Array.isArray(items) || items.length === 0) {
    throw makeError("Order must contain at least one item", "BAD_REQUEST");
  }
  if (!supplierId) {
    throw makeError("supplierId is required", "BAD_REQUEST");
  }

  let totalAmount = 0;
  const normalizedItems = [];
  const supplierObjectId = String(supplierId);

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw makeError(`Product not found: ${item.productId}`, "NOT_FOUND");
    if (String(product.supplier) !== supplierObjectId) {
      throw makeError("All products must belong to supplierId", "BAD_REQUEST");
    }
    const quantity = Number(item.quantity) || 0;
    if (quantity < 1) throw makeError("Quantity must be at least 1", "BAD_REQUEST");
    if (product.stock < quantity) {
      throw makeError(`Insufficient stock for ${product.name}`, "BAD_REQUEST");
    }

    const lineTotal = product.price * quantity;
    totalAmount += lineTotal;
    normalizedItems.push({
      product: product._id,
      quantity,
      price: product.price,
      total: lineTotal,
    });
  }

  const order = await Order.create({
    buyer: user.id,
    supplier: supplierObjectId,
    items: normalizedItems,
    totalAmount,
    notes: notes || "",
  });

  for (const line of normalizedItems) {
    await Product.findByIdAndUpdate(line.product, { $inc: { stock: -line.quantity } });
  }

  return populateOrderQuery(Order.findById(order._id));
}

async function updateOrderStatus(id, status, user) {
  if (!SUPPLIER_STATUSES.has(status)) {
    throw makeError("Invalid status value", "BAD_REQUEST");
  }

  const order = await Order.findById(id);
  if (!order) throw makeError("Order not found", "NOT_FOUND");
  if (user.role !== "admin" && String(order.supplier) !== user.id) {
    throw makeError("You can only update your supplier orders", "FORBIDDEN");
  }

  order.status = status;
  await order.save();
  return populateOrderQuery(Order.findById(order._id));
}

async function addOrderReview(id, rating, review, user) {
  const parsedRating = Number(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw makeError("rating must be between 1 and 5", "BAD_REQUEST");
  }

  const order = await Order.findById(id);
  if (!order) throw makeError("Order not found", "NOT_FOUND");
  if (user.role !== "admin" && String(order.buyer) !== user.id) {
    throw makeError("You can only review your own orders", "FORBIDDEN");
  }
  if (order.status !== "delivered") {
    throw makeError("Only delivered orders can be reviewed", "BAD_REQUEST");
  }

  order.rating = parsedRating;
  order.review = String(review || "");
  await order.save();
  return order;
}

module.exports = {
  listBuyerOrders,
  listSupplierOrders,
  getOrderById,
  ensureOrderAccess,
  createOrder,
  updateOrderStatus,
  addOrderReview,
};
