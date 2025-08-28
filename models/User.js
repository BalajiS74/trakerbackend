const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    relation: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    parents: { type: [ContactSchema], default: [] },
    emergencyContact: { type: ContactSchema, default: null },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    role: {
      type: String,
      enum: ["student", "parent", "staff", "admin"],
      required: true,
    },
    avatar: { type: String, default: "" },
    lastLogin: { type: Date, default: null },
    refreshTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ lastLogin: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model("User", UserSchema);
