const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      enum: ["street-food", "beverages", "snacks", "desserts", "ingredients"],
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    unit: {
      type: String,
      enum: ["kg", "g", "l", "ml", "piece", "pack"],
      default: "piece",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "out-of-stock"],
      default: "active",
    },
    image: {
      type: String,
      default: "https://placehold.co/300x200?text=Product",
    },
  },
  { timestamps: true }
);

productSchema.index({ supplier: 1, category: 1, status: 1 });
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
