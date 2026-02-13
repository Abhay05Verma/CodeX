const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${sig}`;
}

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto
    .pbkdf2Sync(password, salt, 120000, 32, "sha256")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

async function register(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return res.status(409).json({ message: "User already exists" });

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash: makePasswordHash(String(password)),
    role: role || "buyer",
  });

  const token = signToken({
    userId: String(user._id),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });

  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  });
}

async function login(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !verifyPassword(String(password), user.passwordHash)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({
    userId: String(user._id),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });

  return res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  });
}

async function getMe(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  getMe,
};
