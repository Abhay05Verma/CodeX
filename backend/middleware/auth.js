const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { fail } = require("../utils/response");

async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return fail(res, 401, "No token provided");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-change-me"
    );
    if (!decoded?.userId) return fail(res, 401, "Invalid token");

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) return fail(res, 401, "User not found");

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (_error) {
    return fail(res, 401, "Invalid token");
  }
}

function authorizeRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    if (!req.user || !allowed.has(req.user.role)) {
      return fail(res, 403, "Forbidden: insufficient permissions");
    }
    return next();
  };
}

module.exports = {
  protect,
  authorizeRoles,
};
