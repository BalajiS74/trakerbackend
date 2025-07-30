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
      guardian,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { email },
        { "father.email": email },
        { "mother.email": email },
        { "guardian.email": email },
      ],
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashParent = async (parent) => {
      if (!parent || !parent.password) return parent;
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
      guardian: await hashParent(guardian),
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email, role: "student" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Signup successful",
      role: "student",
      userToken: token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar || "",
      },
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
        { "guardian.email": email },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    let role = "student";
    let current = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender,
      phone: user.phone,
      address: user.address || "",
      parentdata: user.father,
    };

    let relatedTo = null;

    if (user.father?.email === email) {
      role = "father";
      if (!(await bcrypt.compare(password, user.father.password))) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      current = {
        id: user._id,
        name: user.father.name,
        email: user.father.email,
        gender: user.father.gender,
        phone: user.father.phone,
        address: user.father.address,
      };
      relatedTo = {
        studentId: user._id,
        studentName: user.name,
        studentEmail: user.email,
      };
    } else if (user.mother?.email === email) {
      role = "mother";
      if (!(await bcrypt.compare(password, user.mother.password))) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      current = {
        id: user._id,
        name: user.mother.name,
        email: user.mother.email,
        gender: user.mother.gender,
        phone: user.mother.phone,
        address: user.mother.address,
      };
      relatedTo = {
        studentId: user._id,
        studentName: user.name,
        studentEmail: user.email,
      };
    } else if (user.guardian?.email === email) {
      role = "guardian";
      if (!(await bcrypt.compare(password, user.guardian.password))) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      current = {
        id: user._id,
        name: user.guardian.name,
        email: user.guardian.email,
        gender: user.guardian.gender,
        phone: user.guardian.phone,
        address: user.guardian.address,
      };
      relatedTo = {
        studentId: user._id,
        studentName: user.name,
        studentEmail: user.email,
      };
    } else {
      // student login
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Incorrect password" });
      }
    }

    const token = jwt.sign(
      { id: user._id, email: current.email, role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      role,
      userToken: token,
      user: {
        id: user._id, // ✅ Add this line!
        ...current, // Spread other fields (name, email, etc.)
      },
      relatedTo: relatedTo || undefined,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// === Avatar Upload ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.post(
  "/upload-avatar/:userId",
  upload.single("avatar"),
  async (req, res) => {
    const { userId } = req.params;
    const role = req.query.role; // ✨ added to distinguish parent/guardian
    const email = req.query.email;

    if (!req.file)
      return res.status(400).json({ message: "No image uploaded" });

    try {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
      const user = await User.findById(userId);

      if (!user) return res.status(404).json({ message: "User not found" });

      if (role === "student") {
        user.avatar = imageUrl;
      } else if (role === "father" && user.father?.email === email) {
        user.father.avatar = imageUrl;
      } else if (role === "mother" && user.mother?.email === email) {
        user.mother.avatar = imageUrl;
      } else if (role === "guardian" && user.guardian?.email === email) {
        user.guardian.avatar = imageUrl;
      } else {
        return res.status(403).json({ message: "Unauthorized avatar update" });
      }

      await user.save();

      res.status(200).json({ message: "Avatar updated", avatar: imageUrl });
    } catch (error) {
      console.error("Upload failed:", error);
      res.status(500).json({ message: "Server error during avatar upload" });
    }
  }
);

// === Update (Student or Parent) ===
router.put("/update", async (req, res) => {
  const { email, role, updates } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email },
        { "father.email": email },
        { "mother.email": email },
        { "guardian.email": email },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (role === "student") {
      Object.assign(user, updates);
      if (updates.password) {
        user.password = await bcrypt.hash(updates.password, 10);
      }
    } else if (role === "father" && user.father?.email === email) {
      Object.assign(user.father, updates);
      if (updates.password) {
        user.father.password = await bcrypt.hash(updates.password, 10);
      }
    } else if (role === "mother" && user.mother?.email === email) {
      Object.assign(user.mother, updates);
      if (updates.password) {
        user.mother.password = await bcrypt.hash(updates.password, 10);
      }
    } else if (role === "guardian" && user.guardian?.email === email) {
      Object.assign(user.guardian, updates);
      if (updates.password) {
        user.guardian.password = await bcrypt.hash(updates.password, 10);
      }
    } else {
      return res.status(403).json({ message: "Unauthorized update attempt" });
    }

    await user.save();
    res.status(200).json({ message: "Update successful" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error during update" });
  }
});

// === Delete (Student or Remove Parent/guardian) ===
router.delete("/delete", async (req, res) => {
  const { email, role } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email },
        { "father.email": email },
        { "mother.email": email },
        { "guardian.email": email },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (role === "student" && user.email === email) {
      await User.findByIdAndDelete(user._id);
      return res.status(200).json({ message: "Student account deleted" });
    }

    if (role === "father" && user.father?.email === email) {
      user.father = undefined;
    } else if (role === "mother" && user.mother?.email === email) {
      user.mother = undefined;
    } else if (role === "guardian" && user.guardian?.email === email) {
      user.guardian = undefined;
    } else {
      return res.status(403).json({ message: "Unauthorized delete attempt" });
    }

    await user.save();
    res.status(200).json({ message: `${role} removed from account` });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error during delete" });
  }
});

module.exports = router;
