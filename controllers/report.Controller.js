const Report = require("../models/Reports");

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { reportType, description, busID, busName, stopName } = req.body;

    const report = await Report.create({
      userId: req.user._id,
      reportType,
      description,
      busID: busID || null,
      busName: busName || null, // store the bus name
      stopName: stopName || null,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get reports for the logged-in user
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("Get user reports error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get all reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email role");
    res.json(reports);
  } catch (err) {
    console.error("Get all reports error:", err);
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

    if (response) report.response = response;
    if (status) report.status = status;

    await report.save();
    res.json(report);
  } catch (err) {
    console.error("Respond to report error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//----------------------------delete report------------------------------- //
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) return res.status(404).json({ message: "Report not found" });

    // Only allow the owner to delete
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await report.deleteOne();
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
