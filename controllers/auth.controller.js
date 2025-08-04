const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/hash");
const { signToken } = require("../config/jwt");
// === Signup ===
const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      role,
      parents,
      emergencyContact,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await hashPassword(password);

    const newUser = new User({
      name,
      email,
      password: hashed,
      phone,
      gender,
      role,
    });

    // ✅ Add emergency fields by role
    if (role === "student" && Array.isArray(parents)) {
      newUser.parents = parents;
    }

    if (role === "staff" && emergencyContact?.phone) {
      newUser.emergencyContact = emergencyContact;
    }

    await newUser.save();

    const token = signToken({ id: newUser._id, email, role });

    res.status(201).json({
      message: "Signup successful",
      token,
      role,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};
// === Login ===
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    // ✅ Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // ✅ Base user info
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      role: user.role,
      parents: user.parents || [],
    };

    // ✅ Add emergencyContact only if user is staff
    if (user.role === "staff") {
      userResponse.emergencyContact = user.emergencyContact || null;
    }

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      user: userResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// === Update Profile ===
const updateProfile = async (req, res) => {
  try {
    const { name, phone, gender, parents, emergencyContact } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Basic fields (for all roles)
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.gender = gender || user.gender;

    // Additional fields based on role
    if (user.role === "student" && Array.isArray(parents)) {
      user.parents = parents;
    }

    if (user.role === "staff" && emergencyContact?.phone) {
      user.emergencyContact = emergencyContact;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        ...(user.role === "student" && { parents: user.parents }),
        ...(user.role === "staff" && {
          emergencyContact: user.emergencyContact,
        }),
      },
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error during update" });
  }
};

// === Delete User ===
const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error during delete" });
  }
};

const getActiveUsers = async (req, res) => {
  try {
    const { range } = req.query;

    let days = 1; // default to daily
    if (range === "weekly") days = 7;
    else if (range === "monthly") days = 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await User.find({ lastLogin: { $gte: since } });

    const grouped = {
      total: users.length,
      students: users.filter((u) => u.role === "student").length,
      parents: users.filter((u) => u.role === "parent").length,
      staff: users.filter((u) => u.role === "staff").length,
      admins: users.filter((u) => u.role === "admin").length,
    };

    res.status(200).json({ range, ...grouped });
  } catch (err) {
    console.error("Active user error:", err);
    res.status(500).json({ message: "Error fetching active users" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Optional: delete old avatar file if stored locally
    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(__dirname, "..", user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new avatar path (you can also use absolute URL here)
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: user.avatar,
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ message: "Error uploading avatar" });
  }
};

module.exports = {
  signup,
  login,
  updateProfile,
  deleteUser,
  getActiveUsers,
  forgotPassword,
  uploadAvatar, // ✅ export new controller
};