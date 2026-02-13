const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/buyer-summary", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  try {
    const userId = req.user.id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalOrders, monthOrders, deliveredSpend, recentOrders] = await Promise.all([
      Order.countDocuments({ buyer: userId }),
      Order.countDocuments({ buyer: userId, createdAt: { $gte: monthStart } }),
      Order.aggregate([
        { $match: { buyer: new mongoose.Types.ObjectId(userId), status: { $in: ["shipped", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find({ buyer: userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      totalOrders,
      monthOrders,
      totalSpent: deliveredSpend[0]?.total || 0,
      recentOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch buyer analytics", error: error.message });
  }
});

router.get("/supplier-summary", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  try {
    const userId = req.user.id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalProducts, activeProducts, totalOrders, monthRevenue] = await Promise.all([
      Product.countDocuments({ supplier: userId }),
      Product.countDocuments({ supplier: userId, status: "active" }),
      Order.countDocuments({ supplier: userId }),
      Order.aggregate([
        {
          $match: {
            supplier: new mongoose.Types.ObjectId(userId),
            status: { $in: ["confirmed", "preparing", "shipped", "delivered"] },
            createdAt: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    return res.json({
      totalProducts,
      activeProducts,
      totalOrders,
      monthRevenue: monthRevenue[0]?.total || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch supplier analytics", error: error.message });
  }
});

module.exports = router;
