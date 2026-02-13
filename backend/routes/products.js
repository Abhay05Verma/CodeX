const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

router.get("/", async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database not connected",
      products: [],
    });
  }

  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database not connected",
    });
  }

  try {
    const product = await Product.create(req.body || {});
    return res.status(201).json({ product });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
});

module.exports = router;
