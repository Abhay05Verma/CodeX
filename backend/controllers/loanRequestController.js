const mongoose = require("mongoose");
const loanRequestService = require("../services/loanRequestService");
const emailService = require("../services/emailService");
const { ok, fail } = require("../utils/response");

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    fail(res, 503, "Database not connected");
    return false;
  }
  return true;
}

function mapError(res, error, fallback) {
  if (error.code === "BAD_REQUEST") return fail(res, 400, error.message);
  if (error.code === "NOT_FOUND") return fail(res, 404, error.message);
  if (error.code === "FORBIDDEN") return fail(res, 403, error.message);
  return fail(res, 500, fallback, error.message);
}

async function listLoanProviders(req, res) {
  if (!requireDb(res)) return;
  try {
    const list = await loanRequestService.listActiveLoanProviders();
    return ok(res, { providers: list }, "Loan providers fetched");
  } catch (e) {
    return mapError(res, e, "Failed to fetch loan providers");
  }
}

async function createRequest(req, res) {
  if (!requireDb(res)) return;
  try {
    const { customerId } = req.body || {};
    if (!customerId) return fail(res, 400, "customerId is required");
    const request = await loanRequestService.createRequest(req.user.id, customerId);
    const customerEmail = request.customerId?.email || request.customerId;
    const vendorName = request.vendorId?.name || "A vendor";
    if (customerEmail) {
      emailService.sendLoanRequestNotification(customerEmail, vendorName).catch((err) => {
        console.error("[LoanRequest] Email notification failed:", err.message);
      });
    }
    return ok(res, { request }, "Loan request sent", 201);
  } catch (e) {
    return mapError(res, e, "Failed to send loan request");
  }
}

async function listMyRequestsAsCustomer(req, res) {
  if (!requireDb(res)) return;
  try {
    const list = await loanRequestService.listRequestsForCustomer(req.user.id);
    return ok(res, { requests: list }, "Requests fetched");
  } catch (e) {
    return mapError(res, e, "Failed to fetch requests");
  }
}

async function listMyRequestsAsVendor(req, res) {
  if (!requireDb(res)) return;
  try {
    const list = await loanRequestService.listRequestsForVendor(req.user.id);
    return ok(res, { requests: list }, "Requests fetched");
  } catch (e) {
    return mapError(res, e, "Failed to fetch requests");
  }
}

async function respondToRequest(req, res) {
  if (!requireDb(res)) return;
  try {
    const { status } = req.body || {};
    if (!status) return fail(res, 400, "status is required");
    const request = await loanRequestService.respondToRequest(req.params.id, req.user.id, status);
    return ok(res, { request }, "Request updated");
  } catch (e) {
    return mapError(res, e, "Failed to update request");
  }
}

module.exports = {
  listLoanProviders,
  createRequest,
  listMyRequestsAsCustomer,
  listMyRequestsAsVendor,
  respondToRequest,
};
