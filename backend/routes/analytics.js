const express = require("express");
const { protect } = require("../middleware/auth");
const {
  buyerSummary,
  supplierSummary,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/buyer-summary", protect, buyerSummary);
router.get("/supplier-summary", protect, supplierSummary);

module.exports = router;
