const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path"); // Required for file paths

dotenv.config();
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use("/api", require("./routes/auth"));
// Add this line when you create profile routes later
// app.use("/api/profile", require("./routes/profileRoutes"));

app.get("/", (req, res) => {
  res.json({ 
    message: "Hello from server!",
    apiEndpoints: {
      auth: {
        signup: "POST /api/signup",
        login: "POST /api/login"
      },
      profile: {
        updatePhoto: "PUT /api/profile/update-profile-photo"
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    // Handle Multer file upload errors
    return res.status(400).json({
      message: "File upload error",
      error: err.message
    });
  }
  
  res.status(500).json({ 
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Database connection and server start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const port = process.env.PORT || 5000;
    app.listen(port, () =>
      console.log(`Server running on port ${port}`)
    );
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  // Close server and exit process
  server.close(() => process.exit(1));
});