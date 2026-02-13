const Product = require("../models/Product");
const User = require("../models/User");

function buildListQuery(query = {}) {
  const {
    q = "",
    category,
    status,
    supplier,
    minPrice,
    maxPrice,
    page = "1",
    limit = "20",
    sort = "latest",
  } = query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = {};

  if (q) filter.$text = { $search: String(q) };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (supplier) filter.supplier = supplier;
  if (minPrice != null && minPrice !== "") {
    const n = parseFloat(minPrice);
    if (Number.isFinite(n)) { filter.price = filter.price || {}; filter.price.$gte = n; }
  }
  if (maxPrice != null && maxPrice !== "") {
    const n = parseFloat(maxPrice);
    if (Number.isFinite(n)) { filter.price = filter.price || {}; filter.price.$lte = n; }
  }

  const sortBy = sort === "price_asc"
    ? { price: 1 }
    : sort === "price_desc"
      ? { price: -1 }
      : { createdAt: -1 };

  return { filter, sortBy, pageNumber, pageSize };
}

async function listProducts(query) {
  const { filter, sortBy, pageNumber, pageSize } = buildListQuery(query);

  if (query.vendorOnly === "true" || query.vendorOnly === true) {
    const vendorUsers = await User.find({ role: "buyer" }, "_id").lean();
    filter.supplier = { $in: vendorUsers.map((u) => u._id) };
  }
  if (query.supplierOnly === "true" || query.supplierOnly === true) {
    const supplierUsers = await User.find({ role: "supplier" }, "_id").lean();
    filter.supplier = { $in: supplierUsers.map((u) => u._id) };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("supplier", "name email")
      .sort(sortBy)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    meta: {
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function getProductById(id) {
  return Product.findById(id).populate("supplier", "name email");
}

async function createProduct(payload, user) {
  const data = { ...(payload || {}) };
  if (user?.role === "supplier" || user?.role === "buyer") data.supplier = user.id;
  if (!data.supplier) throw new Error("supplier is required");
  return Product.create(data);
}

async function updateProduct(id, payload, user) {
  const existing = await Product.findById(id);
  if (!existing) return null;

  const owner = String(existing.supplier);
  if (user.role !== "admin" && owner !== user.id) {
    const error = new Error("You can only update your own products");
    error.code = "FORBIDDEN";
    throw error;
  }

  const data = { ...(payload || {}) };
  if (user.role !== "admin") delete data.supplier;

  return Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

async function deleteProduct(id, user) {
  const existing = await Product.findById(id);
  if (!existing) return null;

  const owner = String(existing.supplier);
  if (user.role !== "admin" && owner !== user.id) {
    const error = new Error("You can only delete your own products");
    error.code = "FORBIDDEN";
    throw error;
  }

  await Product.findByIdAndDelete(id);
  return true;
}

async function listMyProducts(userId) {
  const products = await Product.find({ supplier: userId })
    .populate("supplier", "name email")
    .sort({ createdAt: -1 });
  return { products, meta: { total: products.length, page: 1, limit: products.length, totalPages: 1 } };
}

module.exports = {
  listProducts,
  listMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
