const mongoose = require("mongoose");

// ✅ Subschema for parent/emergency contact
const ContactSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String },
    relation: { type: String },
  },
  { _id: false } // Prevent automatic _id generation in subdocs
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String }, // User's own phone number

    // ✅ For students — array of contact objects
    parents: {
      type: [ContactSchema],
      default: [],
    },

    // ✅ For staff — single contact object
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

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ lastLogin: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model("User", UserSchema);
