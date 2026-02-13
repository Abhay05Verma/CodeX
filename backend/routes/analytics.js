const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");
const { ok, fail } = require("../utils/response");

const router = express.Router();

router.get("/buyer-summary", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
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

    return ok(res, {
      totalOrders,
      monthOrders,
      totalSpent: deliveredSpend[0]?.total || 0,
      recentOrders,
    }, "Buyer analytics fetched");
  } catch (error) {
    return fail(res, 500, "Failed to fetch buyer analytics", error.message);
  }
});

router.get("/supplier-summary", protect, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
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

    return ok(res, {
      totalProducts,
      activeProducts,
      totalOrders,
      monthRevenue: monthRevenue[0]?.total || 0,
    }, "Supplier analytics fetched");
  } catch (error) {
    return fail(res, 500, "Failed to fetch supplier analytics", error.message);
  }
});

module.exports = router;
