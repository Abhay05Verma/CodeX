const express = require("express");

const router = express.Router();

router.post("/register", (req, res) => {
  const { name, email } = req.body || {};
  res.status(201).json({
    message: "Register route placeholder",
    user: { name: name || null, email: email || null },
  });
});

router.post("/login", (req, res) => {
  const { email } = req.body || {};
  res.status(200).json({
    message: "Login route placeholder",
    token: "mock-token",
    user: { email: email || null },
  });
});

module.exports = router;
