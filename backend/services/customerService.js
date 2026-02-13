const Customer = require("../models/Customer");
const User = require("../models/User");

async function findOrCreateCustomer(userId) {
  let customer = await Customer.findOne({ userId }).populate("favorites", "name email");
  if (!customer) {
    customer = await Customer.create({ userId });
    customer = await Customer.findById(customer._id).populate("favorites", "name email");
  }
  return customer;
}

async function getProfile(userId) {
  return findOrCreateCustomer(userId);
}

async function updateProfile(userId, payload) {
  const customer = await findOrCreateCustomer(userId);
  const { isLendingActive, totalLentAmount, impactBadges } = payload || {};
  if (typeof isLendingActive === "boolean") {
    customer.isLendingActive = isLendingActive;
    await User.findByIdAndUpdate(userId, { isLoanProvider: isLendingActive });
  }
  if (typeof totalLentAmount === "number" && totalLentAmount >= 0) customer.totalLentAmount = totalLentAmount;
  if (Array.isArray(impactBadges)) customer.impactBadges = impactBadges;
  await customer.save();
  return Customer.findById(customer._id).populate("favorites", "name email");
}

async function getCart(userId) {
  const customer = await findOrCreateCustomer(userId);
  return Customer.findById(customer._id)
    .select("cart")
    .populate("cart.vendorId", "name email");
}

async function updateCart(userId, cart) {
  const customer = await findOrCreateCustomer(userId);
  if (!Array.isArray(cart)) throw new Error("cart must be an array");
  customer.cart = cart;
  await customer.save();
  return Customer.findById(customer._id)
    .select("cart")
    .populate("cart.vendorId", "name email");
}

async function getFavorites(userId) {
  const customer = await findOrCreateCustomer(userId);
  return customer.favorites;
}

async function addFavorite(userId, vendorId) {
  const customer = await findOrCreateCustomer(userId);
  const id = String(vendorId);
  if (!customer.favorites.some((f) => String(f._id || f) === id)) {
    customer.favorites.push(vendorId);
    await customer.save();
  }
  return Customer.findById(customer._id).populate("favorites", "name email");
}

async function removeFavorite(userId, vendorId) {
  const customer = await findOrCreateCustomer(userId);
  const id = String(vendorId);
  customer.favorites = customer.favorites.filter((f) => String(f._id || f) !== id);
  await customer.save();
  return Customer.findById(customer._id).populate("favorites", "name email");
}

module.exports = {
  getProfile,
  updateProfile,
  getCart,
  updateCart,
  getFavorites,
  addFavorite,
  removeFavorite,
  findOrCreateCustomer,
};
