const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const { validateOrderCreate } = require("../middleware/validate");
const {
  listMyOrders,
  listSupplierOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  addReview,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/my-orders", protect, listMyOrders);

router.get(
  "/supplier-orders",
  protect,
  authorizeRoles("supplier", "admin"),
  listSupplierOrders
);

router.get("/:id", protect, getOrder);

router.post("/", protect, authorizeRoles("buyer", "admin"), validateOrderCreate, createOrder);

router.patch("/:id/status", protect, authorizeRoles("supplier", "admin"), updateOrderStatus);

router.post("/:id/review", protect, authorizeRoles("buyer", "admin"), addReview);

module.exports = router;
