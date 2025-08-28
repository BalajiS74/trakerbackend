const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/hash");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");

// --- Signup ---
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

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await hashPassword(password);
    const newUser = new User({
      name,
      email,
      password: hashed,
      phone,
      gender,
      role,
    });

    if (role === "student" && Array.isArray(parents)) newUser.parents = parents;
    if (role === "staff" && emergencyContact?.phone)
      newUser.emergencyContact = emergencyContact;

    await newUser.save();

    const accessToken = signAccessToken({ id: newUser._id, role });
    const refreshToken = signRefreshToken({ id: newUser._id, role });
    newUser.refreshTokens.push(refreshToken);
    await newUser.save();

    res.status(201).json({
      message: "Signup successful",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Login ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    if (!(await comparePassword(password, user.password)))
      return res.status(401).json({ message: "Incorrect password" });

    user.lastLogin = new Date();
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        parents: user.parents,
        emergencyContact: user.emergencyContact,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Refresh Token ---
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ message: "Refresh token required" });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id);
    if (!user || !user.refreshTokens.includes(token))
      return res.status(403).json({ message: "Invalid refresh token" });

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    const newRefreshToken = signRefreshToken({ id: user._id, role: user.role });
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    res.status(200).json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// --- Logout ---
const logout = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ message: "Refresh token required" });
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id);
    if (!user) return res.status(200).json({ message: "Already logged out" });

    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    await user.save();
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout error" });
  }
};

// --- Update profile ---
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, gender, parents, emergencyContact } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;

    if (user.role === "student" && Array.isArray(parents)) {
      user.parents = parents;
    }

    if (user.role === "staff" && emergencyContact) {
      user.emergencyContact = { ...user.emergencyContact, ...emergencyContact };
    }

    await user.save();

    const { password, ...safeUser } = user.toObject();
    res.status(200).json({ message: "Profile updated", user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Delete user ---
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Upload avatar ---
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(__dirname, "..", user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    res
      .status(200)
      .json({ message: "Avatar uploaded", avatarUrl: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Avatar upload error" });
  }
};

// --- Active users ---
const getActiveUsers = async (req, res) => {
  try {
    const { range } = req.query;
    let days = 1;
    if (range === "weekly") days = 7;
    else if (range === "monthly") days = 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const users = await User.find({ lastLogin: { $gte: since } });
    res.status(200).json({
      range,
      total: users.length,
      students: users.filter((u) => u.role === "student").length,
      parents: users.filter((u) => u.role === "parent").length,
      staff: users.filter((u) => u.role === "staff").length,
      admins: users.filter((u) => u.role === "admin").length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res
        .status(400)
        .json({ message: "Email and new password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  signup,
  login,
  updateProfile,
  deleteUser,
  getActiveUsers,
  uploadAvatar,
  refreshToken,
  logout,
  forgotPassword,
};
