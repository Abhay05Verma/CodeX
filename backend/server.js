require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./mongo");
const { ok } = require("./utils/response");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const orderRoutes = require("./routes/orders");
const productRoutes = require("./routes/products");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

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

let server;

async function initializeServer() {
  const dbConnected = await connectDB();

  server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is sprinting at http://localhost:${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
    if (!dbConnected) {
      console.warn("MongoDB is not connected. API routes requiring DB will fail.");
    }
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    if (server) {
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    } else {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

initializeServer();
