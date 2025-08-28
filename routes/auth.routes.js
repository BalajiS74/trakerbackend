const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  signup,
  login,
  updateProfile,
  deleteUser,
  getActiveUsers,
  forgotPassword,
  uploadAvatar,
  refreshToken,
  logout,
} = require("../controllers/auth.controller");
const { authenticate, requireRole } = require("../middlewares/auth.middleware");

// Multer for avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/avatars/"),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`
    ),
});
const upload = multer({ storage });

// Public
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected
router.put("/update/:userId", authenticate, updateProfile);
router.delete("/delete/:userid", authenticate, deleteUser);
router.put(
  "/upload-avatar",
  authenticate,
  upload.single("avatar"),
  uploadAvatar
);
console.log({ refreshToken, logout });

// Admin
router.get(
  "/active-users",
  authenticate,
  requireRole(["admin"]),
  getActiveUsers
);

module.exports = router;
