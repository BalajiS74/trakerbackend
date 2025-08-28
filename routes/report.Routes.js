const express = require("express");
const router = express.Router();
const {
  createReport,
  getUserReports,
  getAllReports,
  respondToReport,
  deleteReport,
} = require("../controllers/report.Controller");

const { authenticate, requireRole } = require("../middlewares/auth.middleware");

// ----------------- USER ROUTES ----------------- //

// Create a new report (any authenticated user)
router.post("/", authenticate, createReport);

// Get all reports for the logged-in user or by ID
router.get("/user/:userId", authenticate, getUserReports);
router.delete("/delete/:reportId", authenticate, deleteReport);

// ----------------- ADMIN ROUTES ----------------- //

// Get all reports (admin only)
router.get("/all", authenticate, requireRole(["admin"]), getAllReports);

// Respond to a report (admin only)
router.put("/respond/:reportId", authenticate, requireRole(["admin"]), respondToReport);

module.exports = router;
