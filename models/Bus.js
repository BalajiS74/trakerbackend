const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busid: { type: String, required: true, unique: true },
  routeName: { type: String }, // optional if you want to store route info separately
  isNotAvailable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bus", busSchema);
