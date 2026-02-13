const mongoose = require("mongoose");

const loanRequestSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

loanRequestSchema.index({ vendorId: 1, customerId: 1 });
loanRequestSchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model("LoanRequest", loanRequestSchema);
