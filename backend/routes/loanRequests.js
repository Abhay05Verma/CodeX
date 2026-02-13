const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  listLoanProviders,
  createRequest,
  listMyRequestsAsCustomer,
  listMyRequestsAsVendor,
  respondToRequest,
} = require("../controllers/loanRequestController");

const router = express.Router();

router.get("/providers", protect, authorizeRoles("buyer", "admin"), listLoanProviders);
router.post("/", protect, authorizeRoles("buyer", "admin"), createRequest);
router.get("/vendor", protect, authorizeRoles("buyer", "admin"), listMyRequestsAsVendor);
router.get("/customer", protect, authorizeRoles("customer", "admin"), listMyRequestsAsCustomer);
router.patch("/:id/respond", protect, authorizeRoles("customer", "admin"), respondToRequest);

module.exports = router;
