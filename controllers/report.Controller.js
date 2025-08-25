const Report = require("../models/Reports");

// Create a report
exports.createReport = async (req, res) => {
  try {
    const { reportType, description, busID, stopName } = req.body;

    const report = await Report.create({
      userId: req.user._id,
      reportType,
      description,
      busID,
      stopName,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get reports for a user
exports.getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;

    // Only admin or the owner can access
    if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get all reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).populate("userId", "name email role");
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: respond to a report
exports.respondToReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { response, status } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.response = response || report.response;
    report.status = status || report.status;

    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
