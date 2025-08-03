const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  updateProfile,
  deleteUser,
  getActiveUsers,
  forgotPassword,
} = require("../controllers/auth.controller");

const { authenticate } = require("../middlewares/auth.middleware");

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes (require valid token)
router.put("/update", authenticate, updateProfile);
router.delete("/delete", authenticate, deleteUser);

const { requireRole } = require("../middlewares/auth.middleware");

// Add at bottom of file
router.get(
  "/active-users",
  authenticate,
  requireRole(["admin"]),
  getActiveUsers
);

router.get(
  "/admin/dashboard",
  authenticate,
  requireRole(["admin"]),
  (req, res) => {
    res.json({ message: "Welcome Admin 👑" });
  }
);

router.post("/forgot-password", forgotPassword);

module.exports = router;
