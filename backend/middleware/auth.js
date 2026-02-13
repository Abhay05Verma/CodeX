const crypto = require("crypto");
const User = require("../models/User");

function unb64url(input) {
  const s = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(`${s}${pad}`, "base64").toString("utf8");
}

function verifyToken(token) {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) return null;

  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  const data = `${header}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  const decoded = JSON.parse(unb64url(payload));
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded;
}

async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = verifyToken(token);
    if (!decoded?.userId) return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  protect,
};
