const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
} = require("../controllers/authController");
const {
  validateRegister,
  validateLogin,
} = require("../middlewares/validation");
const { authenticateToken } = require("../middlewares/auth");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);

// Basit hesap silme: kullanıcı ve notları siler
router.delete("/account", authenticateToken, deleteAccount);

module.exports = router;
