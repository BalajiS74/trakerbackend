const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/userModel");
const router = express.Router();

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Serve static image files
// in server.js: app.use("/uploads", express.static("uploads"))

router.post("/upload-avatar/:userId", upload.single("avatar"), async (req, res) => {
  const { userId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  try {
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: imageUrl },
      { new: true }
    );

    res.status(200).json({ message: "Avatar updated", avatar: updatedUser.avatar });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
