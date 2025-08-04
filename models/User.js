const mongoose = require("mongoose");

// ✅ Subschema for parent/emergency contact
const ContactSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String },
    relation: { type: String },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },

    parents: {
      type: [ContactSchema],
      default: [],
    },

    emergencyContact: {
      type: ContactSchema,
      default: null,
    },

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

    avatar: {
      type: String, // ✅ URL or file path to uploaded profile photo
      default: "",  // Could also default to a placeholder image URL
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ lastLogin: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model("User", UserSchema);
