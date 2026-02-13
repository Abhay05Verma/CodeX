const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, authorizeRoles } = require("../middleware/auth");
const { validateProduct } = require("../middleware/validate");
const { ok, fail } = require("../utils/response");

const router = express.Router();

router.get("/", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
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

    return ok(res, {
      products,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    }, "Products fetched");
  } catch (error) {
    return fail(res, 500, "Failed to fetch products", error.message);
  }
});

router.get("/:id", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const product = await Product.findById(req.params.id).populate("supplier", "name email");
    if (!product) return fail(res, 404, "Product not found");
    return ok(res, { product }, "Product fetched");
  } catch (error) {
    return fail(res, 400, "Invalid product id", error.message);
  }
});

router.post("/", protect, authorizeRoles("supplier", "admin"), validateProduct, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const payload = { ...(req.body || {}) };
    if (req.user.role === "supplier") {
      payload.supplier = req.user.id;
    }
    if (!payload.supplier) {
      return fail(res, 400, "supplier is required");
    }

    const product = await Product.create(payload);
    return ok(res, { product }, "Product created", 201);
  } catch (error) {
    return fail(res, 400, "Failed to create product", error.message);
  }
});

router.put("/:id", protect, authorizeRoles("supplier", "admin"), validateProduct, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return fail(res, 404, "Product not found");

    const owner = String(existing.supplier);
    if (req.user.role !== "admin" && owner !== req.user.id) {
      return fail(res, 403, "You can only update your own products");
    }

    const payload = { ...(req.body || {}) };
    if (req.user.role !== "admin") delete payload.supplier;

    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    return ok(res, { product }, "Product updated");
  } catch (error) {
    return fail(res, 400, "Failed to update product", error.message);
  }
});

router.delete("/:id", protect, authorizeRoles("supplier", "admin"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return fail(res, 404, "Product not found");

    const owner = String(existing.supplier);
    if (req.user.role !== "admin" && owner !== req.user.id) {
      return fail(res, 403, "You can only delete your own products");
    }

    await Product.findByIdAndDelete(req.params.id);
    return ok(res, {}, "Product deleted");
  } catch (error) {
    return fail(res, 400, "Failed to delete product", error.message);
  }
});

module.exports = router;
