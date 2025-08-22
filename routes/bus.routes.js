const express = require("express");
const router = express.Router();
const busController = require("../controllers/bus.controller");

// GET all buses
router.get("/", busController.getBuses);

// PUT toggle single bus
router.put("/toggle/:busid", busController.toggleBusAvailability);

// PUT toggle all buses
router.put("/toggleAll", busController.toggleAllBuses);
// POST /api/buses
router.post("/", busController.createBus);

module.exports = router;
