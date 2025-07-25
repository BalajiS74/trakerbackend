const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// === Signup ===
router.post("/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      gender,
      collegename,
      dept,
      year,
      phone,
      father,
      mother,
      mentor
    } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { email },
        { "father.email": email },
        { "mother.email": email },
        { "mentor.email": email },
      ],
    });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const hashParent = async (parent) => {
      if (!parent) return undefined;
      return {
        ...parent,
        password: await bcrypt.hash(parent.password, 10),
      };
    };

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      gender,
      collegename,
      dept,
      year,
      phone,
      father: await hashParent(father),
      mother: await hashParent(mother),
      mentor: await hashParent(mentor)
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email, role: "student" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Signup successful",
      userToken: token,
      role: "student",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar || ""
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// === Login ===
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email },
        { "father.email": email },
        { "mother.email": email },
        { "mentor.email": email }
      ]
    });

    if (!user) return res.status(401).json({ message: "User not found" });

    let role = "student";
    let isMatch = false;
    let currentUser = {
      name: user.name,
      email: user.email,
      avatar: user.avatar || ""
    };

    if (user.email === email) {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (user.father?.email === email) {
      role = "father";
      isMatch = await bcrypt.compare(password, user.father.password);
      currentUser = {
        name: user.father.name,
        email: user.father.email,
        gender: user.father.gender
      };
    } else if (user.mother?.email === email) {
      role = "mother";
      isMatch = await bcrypt.compare(password, user.mother.password);
      currentUser = {
        name: user.mother.name,
        email: user.mother.email,
        gender: user.mother.gender
      };
    } else if (user.mentor?.email === email) {
      role = "mentor";
      isMatch = await bcrypt.compare(password, user.mentor.password);
      currentUser = {
        name: user.mentor.name,
        email: user.mentor.email,
        gender: user.mentor.gender
      };
    }

    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id, email, role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      role,
      userToken: token,
      currentUser,
      relatedTo: {
        studentId: user._id,
        studentName: user.name,
        studentEmail: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// === Avatar Upload ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post("/upload-avatar/:userId", upload.single("avatar"), async (req, res) => {
  const { userId } = req.params;

  if (!req.file)
    return res.status(400).json({ message: "No image uploaded" });

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
    res.status(500).json({ message: "Server error during avatar upload" });
  }
});

module.exports = router;
