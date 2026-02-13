require("dotenv").config();
require("./db");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { ok } = require("./utils/response");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const orderRoutes = require("./routes/orders");
const productRoutes = require("./routes/products");
const customerRoutes = require("./routes/customer");
const loanRequestRoutes = require("./routes/loanRequests");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/loan-requests", loanRequestRoutes);

app.get("/", (_req, res) => {
  return ok(res, { service: "CodeX backend", status: "running" }, "Backend is running");
});

app.get("/api/status", (_req, res) => {
  return ok(res, {
    status: "Online",
    timestamp: new Date().toISOString(),
  }, "Status fetched");
});

app.get("/health", (_req, res) => {
  return ok(res, {
    status: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  }, "Health check");
});

app.get("/test-mongo", async (_req, res) => {
  try {
    const connected = mongoose.connection?.readyState === 1;
    return ok(res, {
      connected: !!connected,
      message: connected ? "MongoDB connection successful" : "MongoDB not connected",
      timestamp: new Date().toISOString(),
    }, "Mongo check");
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Mongo check failed" },
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is sprinting at http://localhost:${PORT}`);
});
