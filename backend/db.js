// db.js - MongoDB connection (use MONGO_URI or MONGODB_URI in .env for Atlas)
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoURI) {
  console.warn("No MONGO_URI or MONGODB_URI set in .env");
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));
