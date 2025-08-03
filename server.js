const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

// Create app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON

// Routes
app.use("/api/auth", require("./routes/auth.routes")); // Login, signup, update, delete

// Root route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
  });
});
