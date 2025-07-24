const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  name: {
    type: String,
    default: ""
  },
  avatar: {
    type: String,
    default: "https://randomuser.me/api/portraits/men/1.jpg" // Default profile image
  },
  phone: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);