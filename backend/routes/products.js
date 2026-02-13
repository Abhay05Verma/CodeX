const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const { validateProduct } = require("../middleware/validate");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", protect, authorizeRoles("supplier", "admin"), validateProduct, createProduct);
router.put("/:id", protect, authorizeRoles("supplier", "admin"), validateProduct, updateProduct);
router.delete("/:id", protect, authorizeRoles("supplier", "admin"), deleteProduct);

module.exports = router;
