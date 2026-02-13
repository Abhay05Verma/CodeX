const express = require("express");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    message: "Products route placeholder",
    products: [],
  });
});

router.post("/", (req, res) => {
  const payload = req.body || {};
  res.status(201).json({
    message: "Create product placeholder",
    product: payload,
  });
});

module.exports = router;
