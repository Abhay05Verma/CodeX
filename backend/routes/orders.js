const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/my-orders", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("supplier", "name email")
      .populate("items.product", "name price unit")
      .sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  try {
    const { items, supplierId, notes } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }
    if (!supplierId) {
      return res.status(400).json({ message: "supplierId is required" });
    }

    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      const quantity = Number(item.quantity) || 0;
      if (quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
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
      supplier: supplierId,
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

    return res.status(201).json({ order: populated });
  } catch (error) {
    return res.status(400).json({ message: "Failed to create order", error: error.message });
  }
});

module.exports = router;
