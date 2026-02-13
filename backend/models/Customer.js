const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    qty: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const vendorCartSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isLendingActive: { type: Boolean, default: false },
    totalLentAmount: { type: Number, default: 0, min: 0 },
    impactBadges: [String],
    cart: {
      type: [vendorCartSchema],
      default: [],
    },
  },
  { timestamps: true }
);

customerSchema.index({ favorites: 1 });

module.exports = mongoose.model("Customer", customerSchema);
