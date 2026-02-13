const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, authorizeRoles } = require("../middleware/auth");
const { validateOrderCreate } = require("../middleware/validate");
const { ok, fail } = require("../utils/response");

const router = express.Router();

const SUPPLIER_STATUSES = new Set(["confirmed", "preparing", "shipped", "delivered", "cancelled"]);

router.get("/my-orders", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const filter = req.user.role === "admin" ? {} : { buyer: req.user.id };
    const orders = await Order.find(filter)
      .populate("buyer", "name email")
      .populate("supplier", "name email")
      .populate("items.product", "name price unit image")
      .sort({ createdAt: -1 })
      .limit(200);

    return ok(res, { orders }, "Orders fetched");
  } catch (error) {
    return fail(res, 500, "Failed to fetch orders", error.message);
  }
});

router.get(
  "/supplier-orders",
  protect,
  authorizeRoles("supplier", "admin"),
  async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
      return fail(res, 503, "Database not connected");
    }

    try {
      const filter = req.user.role === "admin" ? {} : { supplier: req.user.id };
      const orders = await Order.find(filter)
        .populate("buyer", "name email")
        .populate("supplier", "name email")
        .populate("items.product", "name price unit image")
        .sort({ createdAt: -1 })
        .limit(200);

      return ok(res, { orders }, "Supplier orders fetched");
    } catch (error) {
      return fail(res, 500, "Failed to fetch supplier orders", error.message);
    }
  }
);

router.get("/:id", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("supplier", "name email")
      .populate("items.product", "name price unit image description");

    if (!order) return fail(res, 404, "Order not found");

    const buyerId = String(order.buyer?._id || order.buyer);
    const supplierId = String(order.supplier?._id || order.supplier);
    if (
      req.user.role !== "admin" &&
      req.user.id !== buyerId &&
      req.user.id !== supplierId
    ) {
      return fail(res, 403, "Forbidden");
    }

    return ok(res, { order }, "Order fetched");
  } catch (error) {
    return fail(res, 400, "Invalid order id", error.message);
  }
});

router.post("/", protect, authorizeRoles("buyer", "admin"), validateOrderCreate, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const { items, supplierId, notes } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, 400, "Order must contain at least one item");
    }
    if (!supplierId) {
      return fail(res, 400, "supplierId is required");
    }

    let totalAmount = 0;
    const normalizedItems = [];
    const supplierObjectId = String(supplierId);

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return fail(res, 404, `Product not found: ${item.productId}`);
      }
      if (String(product.supplier) !== supplierObjectId) {
        return fail(res, 400, "All products must belong to supplierId");
      }
      const quantity = Number(item.quantity) || 0;
      if (quantity < 1) {
        return fail(res, 400, "Quantity must be at least 1");
      }
      if (product.stock < quantity) {
        return fail(res, 400, `Insufficient stock for ${product.name}`);
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
      buyer: req.user.id,
      supplier: supplierObjectId,
      items: normalizedItems,
      totalAmount,
      notes: notes || "",
    });

    for (const line of normalizedItems) {
      await Product.findByIdAndUpdate(line.product, { $inc: { stock: -line.quantity } });
    }

    const populated = await Order.findById(order._id)
      .populate("buyer", "name email")
      .populate("supplier", "name email")
      .populate("items.product", "name price unit");

    return ok(res, { order: populated }, "Order created", 201);
  } catch (error) {
    return fail(res, 400, "Failed to create order", error.message);
  }
});

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("supplier", "admin"),
  async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
      return fail(res, 503, "Database not connected");
    }

    try {
      const { status } = req.body || {};
      if (!SUPPLIER_STATUSES.has(status)) {
        return fail(res, 400, "Invalid status value");
      }

      const order = await Order.findById(req.params.id);
      if (!order) return fail(res, 404, "Order not found");

      if (req.user.role !== "admin" && String(order.supplier) !== req.user.id) {
        return fail(res, 403, "You can only update your supplier orders");
      }

      order.status = status;
      await order.save();

      const populated = await Order.findById(order._id)
        .populate("buyer", "name email")
        .populate("supplier", "name email")
        .populate("items.product", "name price unit image");

      return ok(res, { order: populated }, "Order status updated");
    } catch (error) {
      return fail(res, 400, "Failed to update order status", error.message);
    }
  }
);

router.post("/:id/review", protect, authorizeRoles("buyer", "admin"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const { rating, review = "" } = req.body || {};
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return fail(res, 400, "rating must be between 1 and 5");
    }

    const order = await Order.findById(req.params.id);
    if (!order) return fail(res, 404, "Order not found");

    if (req.user.role !== "admin" && String(order.buyer) !== req.user.id) {
      return fail(res, 403, "You can only review your own orders");
    }
    if (order.status !== "delivered") {
      return fail(res, 400, "Only delivered orders can be reviewed");
    }

    order.rating = parsedRating;
    order.review = String(review);
    await order.save();

    return ok(res, { order }, "Order reviewed");
  } catch (error) {
    return fail(res, 400, "Failed to add review", error.message);
  }
});

module.exports = router;
