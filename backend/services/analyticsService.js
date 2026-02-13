const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function getBuyerSummary(userId) {
  const monthStart = getMonthStart();
  const buyerId = new mongoose.Types.ObjectId(userId);

  const [totalOrders, monthOrders, deliveredSpend, recentOrders, categoryBreakdown] = await Promise.all([
    Order.countDocuments({ buyer: userId }),
    Order.countDocuments({ buyer: userId, createdAt: { $gte: monthStart } }),
    Order.aggregate([
      { $match: { buyer: buyerId, status: { $in: ["shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.find({ buyer: userId })
      .populate("supplier", "name email")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Order.aggregate([
      { $match: { buyer: buyerId, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          total: { $sum: "$items.total" },
          count: { $sum: "$items.quantity" },
        },
      },
    ]),
  ]);

  return {
    totalOrders,
    monthOrders,
    totalSpent: deliveredSpend[0]?.total || 0,
    recentOrders,
    categoryBreakdown,
  };
}

async function getSupplierSummary(userId) {
  const monthStart = getMonthStart();
  const supplierId = new mongoose.Types.ObjectId(userId);

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    thisMonthOrders,
    totalRevenue,
    monthRevenue,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    Product.countDocuments({ supplier: userId }),
    Product.countDocuments({ supplier: userId, status: "active" }),
    Order.countDocuments({ supplier: userId }),
    Order.countDocuments({ supplier: userId, createdAt: { $gte: monthStart } }),
    Order.aggregate([
      {
        $match: {
          supplier: supplierId,
          status: { $in: ["shipped", "delivered"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          supplier: supplierId,
          status: { $in: ["confirmed", "preparing", "shipped", "delivered"] },
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.find({ supplier: userId })
      .populate("buyer", "name email")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Order.aggregate([
      {
        $match: {
          supplier: supplierId,
          status: { $in: ["confirmed", "preparing", "shipped", "delivered"] },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product._id",
          name: { $first: "$product.name" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    thisMonthOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    monthRevenue: monthRevenue[0]?.total || 0,
    recentOrders,
    topProducts,
  };
}

module.exports = {
  getBuyerSummary,
  getSupplierSummary,
};
