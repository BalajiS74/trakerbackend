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
  uploadAvatar, // ✅ added controller
} = require("../controllers/auth.controller");

const { authenticate, requireRole } = require("../middlewares/auth.middleware");

// ✅ Setup multer for avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/avatars/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

// ✅ Protected routes
router.put("/update", authenticate, updateProfile);
router.delete("/delete", authenticate, deleteUser);

// ✅ Avatar upload route
router.put("/upload-avatar", authenticate, upload.single("avatar"), uploadAvatar);

// ✅ Admin-only routes
router.get("/active-users", authenticate, requireRole(["admin"]), getActiveUsers);

router.get("/admin/dashboard", authenticate, requireRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin 👑" });
});

module.exports = router;
