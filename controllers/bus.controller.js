const Bus = require("../models/Bus");

// Get all buses
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find({});
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle a single bus availability
exports.toggleBusAvailability = async (req, res) => {
  const { busid } = req.params;
  const { isNotAvailable } = req.body;

  try {
    const bus = await Bus.findOneAndUpdate(
      { busid },
      { isNotAvailable },
      { new: true, upsert: true }
    );
    res.json(bus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle all buses
exports.toggleAllBuses = async (req, res) => {
  const { isNotAvailable } = req.body;

  try {
    await Bus.updateMany({}, { isNotAvailable });
    const buses = await Bus.find({});
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Create a new bus
exports.createBus = async (req, res) => {
  const { busid, routeName, isNotAvailable } = req.body;

  try {
    const existingBus = await Bus.findOne({ busid });
    if (existingBus) {
      return res.status(400).json({ message: "Bus already exists" });
    }

    const bus = new Bus({
      busid,
      routeName,
      isNotAvailable: isNotAvailable || false,
    });

    await bus.save();
    res.status(201).json(bus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
