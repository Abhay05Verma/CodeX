const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const { validateProduct } = require("../middleware/validate");
const {
  listProducts,
  listMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", listProducts);
router.get("/my-products", protect, authorizeRoles("supplier", "buyer", "admin"), listMyProducts);
router.get("/:id", getProduct);
router.post("/", protect, authorizeRoles("supplier", "buyer", "admin"), validateProduct, createProduct);
router.put("/:id", protect, authorizeRoles("supplier", "buyer", "admin"), validateProduct, updateProduct);
router.delete("/:id", protect, authorizeRoles("supplier", "buyer", "admin"), deleteProduct);

module.exports = router;
