const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { ok, fail } = require("../utils/response");

const TOKEN_TTL = "7d";

function signToken(userId) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  return jwt.sign({ userId: String(userId) }, secret, { expiresIn: TOKEN_TTL });
}

async function register(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return fail(res, 400, "name, email and password are required");
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return fail(res, 409, "User already exists");

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash: await bcrypt.hash(String(password), 12),
    role: role || "buyer",
  });

  const token = signToken(user._id);

  return ok(
    res,
    { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token },
    "User registered",
    201
  );
}

async function login(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return fail(res, 400, "email and password are required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  const valid = user ? await bcrypt.compare(String(password), user.passwordHash) : false;
  if (!user || !valid) {
    return fail(res, 401, "Invalid credentials");
  }

  const token = signToken(user._id);

  return ok(
    res,
    { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token },
    "Login successful"
  );
}

async function getMe(req, res) {
  return ok(res, { user: req.user }, "Current user");
}

module.exports = {
  register,
  login,
  getMe,
};
