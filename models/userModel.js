const mongoose = require("mongoose");

// Reusable schema for parent/guardian
const ParentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other"
  },
  address: { type: String }
}, { _id: false }); // prevent Mongo from creating _id for subdocs

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // student email
  password: { type: String, required: true },
  name: { type: String },
  avatar: { type: String, default: "" },
  gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  collegename: { type: String },
  dept: { type: String },
  year: { type: Number },
  phone: { type: String },

  father: { type: ParentSchema, required: false },
  mother: { type: ParentSchema, required: false },
  guardian: { type: ParentSchema, required: false }
});

module.exports = mongoose.model("User", UserSchema);
