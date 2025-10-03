const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");


dotenv.config();

const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Routes ===
app.use("/api/auth", require("./routes/authRoutes"));   // Login/Register/Profile
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/shifts", require("./routes/shiftRoutes"));
app.use("/api/swaps", require("./routes/swapRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/admin/requests", require("./routes/requestRoutes"));

// === Health Check ===
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    ts: new Date().toISOString(),
  });
});

// Root
app.get("/", (_req, res) => res.send("OK"));

// === Start Server ===
if (require.main === module) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  });
}


module.exports = app;
