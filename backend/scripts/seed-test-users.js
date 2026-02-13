/**
 * Seed test users for CodeX (buyer = vendor, supplier).
 * Run from backend: node scripts/seed-test-users.js
 * Requires MongoDB and .env (MONGODB_URI, JWT_SECRET optional).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

const User = require(path.join(__dirname, "../models/User"));

const TEST_USERS = [
  {
    name: "Test Vendor",
    email: "vendor@test.com",
    password: "vendor123",
    role: "buyer",
    phone: "9999999999",
  },
  {
    name: "Test Supplier",
    email: "supplier@test.com",
    password: "supplier123",
    role: "supplier",
    phone: "8888888888",
    businessName: "Test Supplies Co",
    gstin: "29XXXXX1234X1Z5",
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/codex";
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  for (const u of TEST_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`User ${u.email} already exists, skipping.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 12);
    await User.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      phone: u.phone,
      businessName: u.businessName,
      gstin: u.gstin,
    });
    console.log(`Created: ${u.email} (${u.role})`);
  }

  console.log("\nTest login credentials:");
  console.log("----------------------------------------");
  console.log("Vendor (Buyer):");
  console.log("  Email:    vendor@test.com");
  console.log("  Password: vendor123");
  console.log("----------------------------------------");
  console.log("Supplier:");
  console.log("  Email:    supplier@test.com");
  console.log("  Password: supplier123");
  console.log("----------------------------------------");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
