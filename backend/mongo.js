const mongoose = require("mongoose");

async function connectDB() {
  const defaultLocalURI = "mongodb://localhost:27017/codex";
  const mongoURI = process.env.MONGODB_URI || defaultLocalURI;

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.warn("MongoDB connection failed:", error.message);
    console.warn("Server will continue without DB connection.");
    return false;
  }
}

module.exports = connectDB;
