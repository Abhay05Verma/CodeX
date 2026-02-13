const mongoose = require("mongoose");
const analyticsService = require("../services/analyticsService");
const { ok, fail } = require("../utils/response");

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    fail(res, 503, "Database not connected");
    return false;
  }
  return true;
}

async function buyerSummary(req, res) {
  if (!requireDb(res)) return;
  try {
    const data = await analyticsService.getBuyerSummary(req.user.id);
    return ok(res, data, "Buyer analytics fetched");
  } catch (error) {
    return fail(res, 500, "Failed to fetch buyer analytics", error.message);
  }
}

async function supplierSummary(req, res) {
  if (!requireDb(res)) return;
  try {
    const data = await analyticsService.getSupplierSummary(req.user.id);
    return ok(res, data, "Supplier analytics fetched");
  } catch (error) {
    return fail(res, 500, "Failed to fetch supplier analytics", error.message);
  }
}

module.exports = {
  buyerSummary,
  supplierSummary,
};
