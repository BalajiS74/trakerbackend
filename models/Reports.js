const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportType: { type: String, required: true },
    description: { type: String, required: true },
    busID: { type: String },       // optional
    busName: { type: String },     // optional, stores bus name
    stopName: { type: String },    // optional
    status: { type: String, default: "Pending" }, // Pending, In Progress, Resolved
    response: { type: String, default: "" },      // admin response
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
