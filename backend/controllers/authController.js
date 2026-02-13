const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const TOKEN_TTL = "7d";

function signToken(userId) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  return jwt.sign({ userId: String(userId) }, secret, { expiresIn: TOKEN_TTL });
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
    passwordHash: await bcrypt.hash(String(password), 12),
    role: role || "buyer",
  });

  const token = signToken(user._id);

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
  const valid = user ? await bcrypt.compare(String(password), user.passwordHash) : false;
  if (!user || !valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user._id);

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
