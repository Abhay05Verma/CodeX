const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-change-me"
    );
    if (!decoded?.userId) return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function authorizeRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    if (!req.user || !allowed.has(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    return next();
  };
}

module.exports = {
  protect,
  authorizeRoles,
};
