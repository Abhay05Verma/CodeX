const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function getBuyerSummary(userId) {
  const monthStart = getMonthStart();

  const [totalOrders, monthOrders, deliveredSpend, recentOrders] = await Promise.all([
    Order.countDocuments({ buyer: userId }),
    Order.countDocuments({ buyer: userId, createdAt: { $gte: monthStart } }),
    Order.aggregate([
      {
        $match: {
          buyer: new mongoose.Types.ObjectId(userId),
          status: { $in: ["shipped", "delivered"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.find({ buyer: userId }).sort({ createdAt: -1 }).limit(5),
  ]);

  return {
    totalOrders,
    monthOrders,
    totalSpent: deliveredSpend[0]?.total || 0,
    recentOrders,
  };
}

async function getSupplierSummary(userId) {
  const monthStart = getMonthStart();

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

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    monthRevenue: monthRevenue[0]?.total || 0,
  };
}

module.exports = {
  getBuyerSummary,
  getSupplierSummary,
};
