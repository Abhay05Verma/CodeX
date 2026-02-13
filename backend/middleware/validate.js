function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateRegister(req, res, next) {
  const { name, email, password, role } = req.body || {};
  if (!isNonEmptyString(name)) {
    return res.status(400).json({ message: "name is required" });
  }
  if (!isNonEmptyString(email) || !email.includes("@")) {
    return res.status(400).json({ message: "valid email is required" });
  }
  if (!isNonEmptyString(password) || password.length < 6) {
    return res.status(400).json({ message: "password must be at least 6 characters" });
  }
  if (role && !["buyer", "supplier", "admin"].includes(role)) {
    return res.status(400).json({ message: "invalid role" });
  }
  return next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !email.includes("@")) {
    return res.status(400).json({ message: "valid email is required" });
  }
  if (!isNonEmptyString(password)) {
    return res.status(400).json({ message: "password is required" });
  }
  return next();
}

function validateProduct(req, res, next) {
  const payload = req.body || {};
  if (!isNonEmptyString(payload.name)) {
    return res.status(400).json({ message: "name is required" });
  }
  if (!isNonEmptyString(payload.description)) {
    return res.status(400).json({ message: "description is required" });
  }
  if (!isNumber(payload.price) || payload.price < 0) {
    return res.status(400).json({ message: "price must be a non-negative number" });
  }
  if (!isNumber(payload.stock) || payload.stock < 0) {
    return res.status(400).json({ message: "stock must be a non-negative number" });
  }
  if (!isNonEmptyString(payload.category)) {
    return res.status(400).json({ message: "category is required" });
  }
  return next();
}

function validateOrderCreate(req, res, next) {
  const { supplierId, items } = req.body || {};
  if (!isNonEmptyString(String(supplierId || ""))) {
    return res.status(400).json({ message: "supplierId is required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items must be a non-empty array" });
  }
  for (const item of items) {
    if (!isNonEmptyString(String(item?.productId || ""))) {
      return res.status(400).json({ message: "each item must include productId" });
    }
    if (!Number.isInteger(item?.quantity) || item.quantity < 1) {
      return res.status(400).json({ message: "each item quantity must be an integer >= 1" });
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
