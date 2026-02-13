const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  buyerSummary,
  supplierSummary,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/buyer-summary", protect, authorizeRoles("buyer", "customer", "admin"), buyerSummary);
router.get("/supplier-summary", protect, authorizeRoles("supplier", "buyer", "admin"), supplierSummary);

module.exports = router;
