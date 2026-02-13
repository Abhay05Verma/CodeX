const LoanRequest = require("../models/LoanRequest");
const User = require("../models/User");
const Customer = require("../models/Customer");

async function listActiveLoanProviders() {
  const customers = await Customer.find({ isLendingActive: true }).select("userId").lean();
  const userIds = customers.map((c) => c.userId);
  if (userIds.length === 0) return [];
  const users = await User.find({ _id: { $in: userIds }, role: "customer" })
    .select("name email phone")
    .lean();
  return users.map((u) => ({ _id: u._id.toString(), name: u.name, email: u.email, phone: u.phone }));
}

async function createRequest(vendorId, customerId) {
  const existing = await LoanRequest.findOne({ vendorId, customerId });
  if (existing) {
    const err = new Error(
      existing.status === "pending"
        ? "Request already sent"
        : "You already have a connection with this customer"
    );
    err.code = "BAD_REQUEST";
    throw err;
  }
  const customer = await User.findById(customerId).select("role isLoanProvider").lean();
  if (!customer || customer.role !== "customer") {
    const err = new Error("Customer not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  const customerProfile = await Customer.findOne({ userId: customerId }).select("isLendingActive").lean();
  if (!customerProfile?.isLendingActive) {
    const err = new Error("Customer is not currently accepting loan requests");
    err.code = "BAD_REQUEST";
    throw err;
  }
  const doc = await LoanRequest.create({ vendorId, customerId, status: "pending" });
  const populated = await LoanRequest.findById(doc._id)
    .populate("vendorId", "name email")
    .populate("customerId", "name email")
    .lean();
  return populated;
}

async function listRequestsForCustomer(customerId) {
  const list = await LoanRequest.find({ customerId })
    .populate("vendorId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return list;
}

async function listRequestsForVendor(vendorId) {
  const list = await LoanRequest.find({ vendorId })
    .populate("customerId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return list;
}

async function respondToRequest(requestId, customerId, status) {
  const doc = await LoanRequest.findById(requestId);
  if (!doc) {
    const err = new Error("Request not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (String(doc.customerId) !== String(customerId)) {
    const err = new Error("You can only respond to your own requests");
    err.code = "FORBIDDEN";
    throw err;
  }
  if (doc.status !== "pending") {
    const err = new Error("Request already responded to");
    err.code = "BAD_REQUEST";
    throw err;
  }
  if (!["accepted", "rejected"].includes(status)) {
    const err = new Error("Invalid status");
    err.code = "BAD_REQUEST";
    throw err;
  }
  doc.status = status;
  await doc.save();
  return doc
    .populate("vendorId", "name email")
    .populate("customerId", "name email")
    .then((d) => d.toObject());
}

module.exports = {
  listActiveLoanProviders,
  createRequest,
  listRequestsForCustomer,
  listRequestsForVendor,
  respondToRequest,
};
