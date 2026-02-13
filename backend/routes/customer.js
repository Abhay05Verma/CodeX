const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  getMe,
  updateMe,
  getCart,
  updateCart,
  getFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/customerController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("customer", "admin"));

router.get("/me", getMe);
router.put("/me", updateMe);
router.get("/cart", getCart);
router.put("/cart", updateCart);
router.get("/favorites", getFavorites);
router.post("/favorites/:vendorId", addFavorite);
router.delete("/favorites/:vendorId", removeFavorite);

module.exports = router;
