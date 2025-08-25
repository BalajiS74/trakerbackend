const express = require("express");
const router = express.Router();
const {
  createReport,
  getUserReports,
  getAllReports,
  respondToReport,
} = require("../controllers/report.Controller");

const { authenticate, requireRole } = require("../middlewares/auth.middleware");

// User creates a report
router.post("/", authenticate, createReport);

// User gets only their own reports
router.get("/user/:userId", authenticate, getUserReports);

// Admin: get all reports
router.get("/all", authenticate, requireRole(["admin"]), getAllReports);

// Admin: respond to a report
router.put("/respond/:reportId", authenticate, requireRole(["admin"]), respondToReport);

module.exports = router;
