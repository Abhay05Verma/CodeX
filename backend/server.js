require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./mongo");
const authRoutes = require("./routes/auth");
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
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

app.get("/", (_req, res) => {
  res.send("Hello! Your Node server is officially running.");
});

app.get("/api/status", (_req, res) => {
  res.json({
    status: "Online",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

async function initializeServer() {
  const dbConnected = await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is sprinting at http://localhost:${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
    if (!dbConnected) {
      console.warn("MongoDB is not connected. API routes requiring DB will fail.");
    }
  });
}

initializeServer();
