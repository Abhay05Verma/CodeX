const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database not connected",
      products: [],
    });
  }

  try {
    const {
      q = "",
      category,
      status,
      supplier,
      page = "1",
      limit = "20",
      sort = "latest",
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const filter = {};

    if (q) filter.$text = { $search: String(q) };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;

    const sortBy = sort === "price_asc"
      ? { price: 1 }
      : sort === "price_desc"
        ? { price: -1 }
        : { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("supplier", "name email")
        .sort(sortBy)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Product.countDocuments(filter),
    ]);

    return res.json({
      products,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  try {
    const product = await Product.findById(req.params.id).populate("supplier", "name email");
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ product });
  } catch (error) {
    return res.status(400).json({ message: "Invalid product id", error: error.message });
  }
});

router.post("/", protect, authorizeRoles("supplier", "admin"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database not connected",
    });
  }

  try {
    const payload = { ...(req.body || {}) };
    if (req.user.role === "supplier") {
      payload.supplier = req.user.id;
    }
    if (!payload.supplier) {
      return res.status(400).json({ message: "supplier is required" });
    }

    const product = await Product.create(payload);
    return res.status(201).json({ product });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
});

router.put("/:id", protect, authorizeRoles("supplier", "admin"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const owner = String(existing.supplier);
    if (req.user.role !== "admin" && owner !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own products" });
    }

    const payload = { ...(req.body || {}) };
    if (req.user.role !== "admin") delete payload.supplier;

    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    return res.json({ product });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update product", error: error.message });
  }
});

router.delete("/:id", protect, authorizeRoles("supplier", "admin"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const owner = String(existing.supplier);
    if (req.user.role !== "admin" && owner !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own products" });
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete product", error: error.message });
  }
});

module.exports = router;
