const { fail } = require("../utils/response");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateRegister(req, res, next) {
  const { name, email, password, role, phone, address, businessName, gstin } = req.body || {};
  if (!isNonEmptyString(name)) {
    return fail(res, 400, "name is required");
  }
  if (!isNonEmptyString(email) || !email.includes("@")) {
    return fail(res, 400, "valid email is required");
  }
  if (!isNonEmptyString(password) || password.length < 6) {
    return fail(res, 400, "password must be at least 6 characters");
  }
  if (role && !["buyer", "supplier", "customer", "admin"].includes(role)) {
    return fail(res, 400, "invalid role");
  }
  if (phone != null && typeof phone !== "string") return fail(res, 400, "phone must be a string");
  if (businessName != null && typeof businessName !== "string") return fail(res, 400, "businessName must be a string");
  if (gstin != null && typeof gstin !== "string") return fail(res, 400, "gstin must be a string");
  return next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !email.includes("@")) {
    return fail(res, 400, "valid email is required");
  }
  if (!isNonEmptyString(password)) {
    return fail(res, 400, "password is required");
  }
  return next();
}

function validateProduct(req, res, next) {
  const payload = req.body || {};
  if (!isNonEmptyString(payload.name)) {
    return fail(res, 400, "name is required");
  }
  if (!isNonEmptyString(payload.description)) {
    return fail(res, 400, "description is required");
  }
  if (!isNumber(payload.price) || payload.price < 0) {
    return fail(res, 400, "price must be a non-negative number");
  }
  if (!isNumber(payload.stock) || payload.stock < 0) {
    return fail(res, 400, "stock must be a non-negative number");
  }
  if (!isNonEmptyString(payload.category)) {
    return fail(res, 400, "category is required");
  }
  return next();
}

function validateOrderCreate(req, res, next) {
  const { supplierId, items } = req.body || {};
  if (!isNonEmptyString(String(supplierId || ""))) {
    return fail(res, 400, "supplierId is required");
  }
  if (!Array.isArray(items) || items.length === 0) {
    return fail(res, 400, "items must be a non-empty array");
  }
  for (const item of items) {
    if (!isNonEmptyString(String(item?.productId || ""))) {
      return fail(res, 400, "each item must include productId");
    }
    if (!Number.isInteger(item?.quantity) || item.quantity < 1) {
      return fail(res, 400, "each item quantity must be an integer >= 1");
    }
  }
  return next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateOrderCreate,
};
