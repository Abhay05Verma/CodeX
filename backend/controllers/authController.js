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

function toUserPayload(user) {
  const u = user.toObject ? user.toObject() : user;
  delete u.passwordHash;
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    address: u.address,
    profilePic: u.profilePic,
    businessName: u.businessName,
    gstin: u.gstin,
  };
}

async function register(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return fail(res, 503, "Database not connected");
  }

  const { name, email, password, role, phone, address, businessName, gstin } = req.body || {};
  if (!name || !email || !password) {
    return fail(res, 400, "name, email and password are required");
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return fail(res, 409, "User already exists");

  const payload = {
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash: await bcrypt.hash(String(password), 12),
    role: role || "buyer",
  };
  if (phone != null) payload.phone = String(phone).trim();
  if (address != null) payload.address = typeof address === "object" ? address : { street: String(address) };
  if (businessName != null) payload.businessName = String(businessName).trim();
  if (gstin != null) payload.gstin = String(gstin).trim();

  const user = await User.create(payload);
  const token = signToken(user._id);

  return ok(res, { user: toUserPayload(user), token }, "User registered", 201);
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

  if (user.isActive === false) {
    return fail(res, 401, "Account is deactivated");
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  return ok(res, { user: toUserPayload(user), token }, "Login successful");
}

async function getMe(req, res) {
  return ok(res, { user: req.user }, "Current user");
}

async function logout(req, res) {
  return ok(res, {}, "Logged out successfully");
}

module.exports = {
  register,
  login,
  getMe,
  logout,
};
